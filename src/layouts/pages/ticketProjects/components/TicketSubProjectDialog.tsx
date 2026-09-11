import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { ListModuleDto, UserAppDto } from "api/generated";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { cn } from "lib/utils";
import type { TicketSubProjectDto } from "../api/ticketSubProjectsApi";

type TicketSubProjectFormValues = {
  name: string;
  userIds: string[];
  users: UserAppDto[];
  moduleIds: string[];
  effortDuration: number | null;
};

type TicketSubProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: TicketSubProjectDto | null;
  modules: ListModuleDto[];
  projectUsers: UserAppDto[];
  onSubmit: (values: TicketSubProjectFormValues) => Promise<void>;
};

const getUserSearchText = (user: UserAppDto) =>
  `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email ?? ""}`.trim().toLowerCase();

const emptyForm = (): TicketSubProjectFormValues => ({
  name: "",
  userIds: [],
  users: [],
  moduleIds: [],
  effortDuration: null,
});

const TicketSubProjectDialog = ({
  open,
  onOpenChange,
  editingItem,
  modules,
  projectUsers = [],
  onSubmit,
}: TicketSubProjectDialogProps) => {
  const isEdit = Boolean(editingItem);

  const [values, setValues] = useState<TicketSubProjectFormValues>(emptyForm());
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [modulesOpen, setModulesOpen] = useState(false);
  const [moduleSearch, setModuleSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      const existingUsers = editingItem.users ?? [];
      const userIds =
        editingItem.userIds?.length > 0
          ? editingItem.userIds
          : existingUsers.map((user) => user.id).filter(Boolean) as string[];
      const users = userIds
        .map((userId) =>
          projectUsers.find((user) => user.id === userId)
          ?? existingUsers.find((user) => user.id === userId)
        )
        .filter((user): user is UserAppDto => Boolean(user));
      const moduleIds =
        editingItem.moduleIds?.length > 0
          ? editingItem.moduleIds
          : (editingItem.modules ?? []).map((mod) => mod.id).filter(Boolean) as string[];

      setValues({
        name: editingItem.name ?? "",
        userIds,
        users,
        moduleIds,
        effortDuration: editingItem.effortDuration,
      });
    } else {
      setValues(emptyForm());
    }

    setEmployeesOpen(false);
    setModulesOpen(false);
    setEmployeeSearch("");
    setModuleSearch("");
  }, [open, editingItem]);

  const employeeOptions = useMemo(() => {
    const byId = new Map<string, UserAppDto>();

    for (const user of projectUsers) {
      if (user.id) byId.set(user.id, user);
    }

    for (const user of values.users) {
      if (user.id && !byId.has(user.id)) byId.set(user.id, user);
    }

    const list = Array.from(byId.values());
    const query = employeeSearch.trim().toLowerCase();
    if (!query) return list;

    return list.filter((user) => getUserSearchText(user).includes(query));
  }, [projectUsers, values.users, employeeSearch]);

  const selectedEmployees = useMemo(
    () =>
      values.userIds
        .map(
          (userId) =>
            projectUsers.find((user) => user.id === userId)
            ?? values.users.find((user) => user.id === userId)
        )
        .filter((user): user is UserAppDto => Boolean(user)),
    [projectUsers, values.userIds, values.users]
  );

  const selectedModules = useMemo(
    () => modules.filter((mod) => mod.id && values.moduleIds.includes(mod.id)),
    [modules, values.moduleIds]
  );

  const handleRemoveEmployee = (userId: string) => {
    setValues((prev) => ({
      ...prev,
      users: prev.users.filter((user) => user.id !== userId),
      userIds: prev.userIds.filter((id) => id !== userId),
    }));
  };

  const handleToggleEmployee = (user: UserAppDto) => {
    if (!user.id) return;
    const isSelected = values.userIds.includes(user.id);
    if (isSelected) {
      handleRemoveEmployee(user.id);
      return;
    }

    setValues((prev) => ({
      ...prev,
      users: [...prev.users, user],
      userIds: [...prev.userIds, user.id as string],
    }));
  };

  const handleToggleModule = (moduleId: string) => {
    setValues((prev) => {
      const isSelected = prev.moduleIds.includes(moduleId);
      return {
        ...prev,
        moduleIds: isSelected
          ? prev.moduleIds.filter((id) => id !== moduleId)
          : [...prev.moduleIds, moduleId],
      };
    });
  };

  const handleSave = async () => {
    if (!values.name.trim()) return;

    setIsSaving(true);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Alt Projeyi Düzenle" : "Alt Proje Ekle"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-project-name">Ad</Label>
            <Input
              id="sub-project-name"
              type="text"
              placeholder="Alt proje adı giriniz"
              value={values.name}
              onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
              aria-label="Alt proje adı"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Çalışanlar</Label>
            <Popover
              open={employeesOpen}
              onOpenChange={(nextOpen) => {
                setEmployeesOpen(nextOpen);
                if (!nextOpen) setEmployeeSearch("");
              }}
            >
              <PopoverTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={employeesOpen}
                  aria-label="Çalışan seç"
                  className="flex min-h-8 w-full cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setEmployeesOpen(true);
                  }}
                >
                  {selectedEmployees.length === 0 ? (
                    <span className="text-muted-foreground">Çalışan seçiniz</span>
                  ) : (
                    selectedEmployees.map((user) => (
                      <span
                        key={user.id}
                        className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium"
                      >
                        {user.firstName} {user.lastName}
                        <button
                          type="button"
                          aria-label={`${user.firstName} ${user.lastName} kaldır`}
                          className="rounded hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user.id) handleRemoveEmployee(user.id);
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                  <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="z-[10060] w-80 p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Çalışan ara"
                    value={employeeSearch}
                    onValueChange={setEmployeeSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {projectUsers.length === 0
                        ? "Bu projede çalışan bulunamadı"
                        : "Çalışan bulunamadı"}
                    </CommandEmpty>
                    <CommandGroup>
                      {employeeOptions.map((user) => {
                        if (!user.id) return null;
                        const isSelected = values.userIds.includes(user.id);
                        return (
                          <CommandItem
                            key={user.id}
                            value={`${user.firstName} ${user.lastName} ${user.id}`}
                            data-checked={isSelected}
                            onSelect={() => handleToggleEmployee(user)}
                          >
                            <Check
                              className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")}
                            />
                            <img
                              className="size-8 shrink-0 rounded-full object-cover"
                              src={`data:image/png;base64,${user.photo}`}
                              alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Çalışan"}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Modüller</Label>
            <Popover open={modulesOpen} onOpenChange={setModulesOpen}>
              <PopoverTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={modulesOpen}
                  aria-label="Modül seç"
                  className="flex min-h-8 w-full cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setModulesOpen(true);
                  }}
                >
                  {selectedModules.length === 0 ? (
                    <span className="text-muted-foreground">Modül seçiniz</span>
                  ) : (
                    selectedModules.map((mod) => (
                      <span
                        key={mod.id}
                        className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium"
                      >
                        {mod.name}
                        <button
                          type="button"
                          aria-label={`${mod.name} kaldır`}
                          className="rounded hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (mod.id) handleToggleModule(mod.id);
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                  <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="z-[10060] w-80 p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Modül ara"
                    value={moduleSearch}
                    onValueChange={setModuleSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Modül bulunamadı</CommandEmpty>
                    <CommandGroup>
                      {modules.map((mod) => {
                        if (!mod.id) return null;
                        const isSelected = values.moduleIds.includes(mod.id);
                        return (
                          <CommandItem
                            key={mod.id}
                            value={`${mod.name} ${mod.id}`}
                            data-checked={isSelected}
                            onSelect={() => handleToggleModule(mod.id as string)}
                          >
                            <Check
                              className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")}
                            />
                            <span>{mod.name}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-project-effort">Efor süresi (gün)</Label>
            <Input
              id="sub-project-effort"
              type="number"
              min={0}
              step="0.01"
              placeholder="Gün giriniz"
              value={values.effortDuration ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                setValues((prev) => ({
                  ...prev,
                  effortDuration: raw === "" ? null : Number(raw),
                }));
              }}
              aria-label="Efor süresi (gün)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            type="button"
            disabled={!values.name.trim() || isSaving}
            onClick={handleSave}
          >
            {isEdit ? "Güncelle" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketSubProjectDialog;
export type { TicketSubProjectFormValues };
