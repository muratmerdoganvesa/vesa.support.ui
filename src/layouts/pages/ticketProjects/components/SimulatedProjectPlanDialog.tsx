import { useEffect, useMemo, useState } from "react";
import { UserApi } from "api/generated";
import { ProjectTypes } from "api/generated";
import getConfiguration from "confiuration";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { cn } from "lib/utils";
import { getProjectTypeColumns } from "../projectTypeHelpers";
import type { StatsBoardItem } from "../types";
import type { SimulatedProjectPlanPayload } from "../api/simulatedProjectPlanApi";

type UserOption = { id: string; name: string };

type SimulatedProjectPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: StatsBoardItem | null;
  onSubmit: (payload: SimulatedProjectPlanPayload) => Promise<void>;
};

const UNASSIGNED_STATUS_VALUE = "__unassigned__";

const SimulatedProjectPlanDialog = ({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: SimulatedProjectPlanDialogProps) => {
  const isEdit = Boolean(editingItem);
  const [customerName, setCustomerName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectSubDescription, setProjectSubDescription] = useState("");
  const [statusValue, setStatusValue] = useState<string>(UNASSIGNED_STATUS_VALUE);
  const [managerId, setManagerId] = useState<string>("");
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [personSearch, setPersonSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const statusColumns = useMemo(() => getProjectTypeColumns(), []);

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      setCustomerName(editingItem.customerName ?? "");
      setProjectDescription(editingItem.projectDescription ?? "");
      setProjectSubDescription(editingItem.projectSubDescription ?? "");
      setStatusValue(
        editingItem.projectStatus == null
          ? UNASSIGNED_STATUS_VALUE
          : String(editingItem.projectStatus),
      );
      setManagerId(editingItem.projectManager?.id ?? "");
      setEmployeeIds((editingItem.employees ?? []).map((e) => e.id).filter(Boolean));
    } else {
      setCustomerName("");
      setProjectDescription("");
      setProjectSubDescription("");
      setStatusValue(UNASSIGNED_STATUS_VALUE);
      setManagerId("");
      setEmployeeIds([]);
    }
    setPersonSearch("");
  }, [open, editingItem]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const api = new UserApi(getConfiguration());
        const response = await api.apiUserVesaUsersWithoutPhotoGet();
        if (cancelled) return;
        const options = (response.data ?? [])
          .filter((u) => u.id)
          .map((u) => ({
            id: u.id as string,
            name:
              [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
              u.email ||
              (u.id as string),
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "tr"));
        setUsers(options);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = personSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, personSearch]);

  const toggleEmployee = (userId: string) => {
    setEmployeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSave = async () => {
    if (!customerName.trim() || !projectDescription.trim()) return;

    const projectStatus: ProjectTypes | null =
      statusValue === UNASSIGNED_STATUS_VALUE
        ? null
        : (Number(statusValue) as ProjectTypes);

    setIsSaving(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        projectDescription: projectDescription.trim(),
        projectSubDescription: projectSubDescription.trim() || null,
        projectStatus,
        modules: [],
        employeeUserIds: employeeIds,
        projectManagerId: managerId || null,
      });
      onOpenChange(false);
    } catch {
      // Hata mesajı parent tarafından gösterilir; dialog açık kalır.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Plan Kartını Düzenle" : "Plan Kartı Ekle"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="sim-customer">Müşteri</Label>
            <Input
              id="sim-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Müşteri adı"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-project">Proje adı</Label>
            <Input
              id="sim-project"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Proje adı"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-sub">Alt açıklama</Label>
            <Input
              id="sim-sub"
              value={projectSubDescription}
              onChange={(e) => setProjectSubDescription(e.target.value)}
              placeholder="Opsiyonel"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Durum (kolon)</Label>
            <Select
              value={statusValue}
              onValueChange={(v) => {
                if (v != null) setStatusValue(v);
              }}
            >
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Kolon seçin" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[1200] w-(--radix-select-trigger-width)"
              >
                {statusColumns.map((column) => (
                  <SelectItem
                    key={String(column.key)}
                    value={
                      column.projectType == null
                        ? UNASSIGNED_STATUS_VALUE
                        : String(column.projectType)
                    }
                  >
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Proje yöneticisi</Label>
            <Select
              value={managerId || "__none__"}
              onValueChange={(v) => {
                if (v == null) return;
                setManagerId(v === "__none__" ? "" : v);
              }}
            >
              <SelectTrigger className="h-9 w-full min-w-0">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[1200] max-h-60 w-(--radix-select-trigger-width)"
              >
                <SelectItem value="__none__">—</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Danışmanlar</Label>
            <Input
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              placeholder="Kişi ara..."
              className="mb-1"
            />
            <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 p-1 dark:border-border">
              {isLoadingUsers ? (
                <p className="px-2 py-3 text-xs text-slate-400">Kişiler yükleniyor...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="px-2 py-3 text-xs text-slate-400">Kişi bulunamadı</p>
              ) : (
                filteredUsers.map((user) => {
                  const checked = employeeIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleEmployee(user.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                        checked
                          ? "bg-rose-50 font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                          : "hover:bg-slate-50 dark:hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-3.5 shrink-0 items-center justify-center rounded border text-[9px]",
                          checked
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-slate-300",
                        )}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      {user.name}
                    </button>
                  );
                })
              )}
            </div>
            {employeeIds.length > 0 && (
              <p className="text-[11px] text-slate-500">{employeeIds.length} danışman seçildi</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !customerName.trim() || !projectDescription.trim()}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {isSaving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimulatedProjectPlanDialog;
