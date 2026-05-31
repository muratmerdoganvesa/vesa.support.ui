import {
  FormAuthApi,
  FormAuthInsertDto,
  FormAuthUpdateDto,
  FormDataApi,
  UserApi,
} from "api/generated/api";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Checkbox } from "components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import { ScrollArea } from "components/ui/scroll-area";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { cn } from "lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  Search,
  User as UserIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const userSearchHaystack = (u: any) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email ?? ""} ${u.userName ?? ""}`
    .toLowerCase();

function FormAuthDetail() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [target, setTarget] = useState<any[]>([]);
  const [formName, setFormName] = useState<any | null>(null);
  const [formNameOptions, setFormNameOptions] = useState<any[]>([]);
  const [formNameError, setFormNameError] = useState(false);
  const [targetError, setTargetError] = useState(false);

  const [leftSel, setLeftSel] = useState<Set<string>>(new Set());
  const [rightSel, setRightSel] = useState<Set<string>>(new Set());
  const [leftFilter, setLeftFilter] = useState("");
  const [rightFilter, setRightFilter] = useState("");

  const [formPopoverOpen, setFormPopoverOpen] = useState(false);

  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const { id } = useParams();

  const targetIdSet = useMemo(
    () => new Set(target.map((u) => String(u.id))),
    [target],
  );

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !targetIdSet.has(String(u.id))),
    [allUsers, targetIdSet],
  );

  const leftFiltered = useMemo(() => {
    const q = leftFilter.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter((u) => userSearchHaystack(u).includes(q));
  }, [availableUsers, leftFilter]);

  const rightFiltered = useMemo(() => {
    const q = rightFilter.trim().toLowerCase();
    if (!q) return target;
    return target.filter((u) => userSearchHaystack(u).includes(q));
  }, [target, rightFilter]);

  useEffect(() => {
    if (id) {
      fetchRelationData();
    }
  }, [id]);

  const fetchRelationData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormAuthApi(conf);
      var response = await api.apiFormAuthIdGet(id);
      setFormName(response.data.form);
      setTarget(response.data.users ?? []);
    } catch (error) {
      dispatchAlert({
        message: "Hata Oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new UserApi(conf);
      var data = await api.apiUserGetAllWithOuthPhotoGet();
      console.log("userData", data.data);
      setAllUsers(data.data ?? []);

      var formApi = new FormDataApi(conf);
      var formsData = await formApi.apiFormDataGet();
      console.log("formsData", formsData.data);
      setFormNameOptions(formsData.data ?? []);
    } catch (error) {
      dispatchAlert({
        message: "Hata Oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLeft = (uid: string) => {
    setLeftSel((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  };

  const handleToggleRight = (uid: string) => {
    setRightSel((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });
  };

  const handleMoveToTarget = () => {
    if (leftSel.size === 0) return;
    const selectedUsers = availableUsers.filter((u) => leftSel.has(String(u.id)));
    if (selectedUsers.length === 0) return;
    setTarget((prev) => {
      const prevIds = new Set(prev.map((p) => String(p.id)));
      const merged = [...prev];
      for (const u of selectedUsers) {
        if (!prevIds.has(String(u.id))) merged.push(u);
      }
      return merged;
    });
    setLeftSel(new Set());
    setTargetError(false);
  };

  const handleMoveToSource = () => {
    if (rightSel.size === 0) return;
    const removeIds = rightSel;
    setTarget((prev) => prev.filter((u) => !removeIds.has(String(u.id))));
    setRightSel(new Set());
    setTargetError(false);
  };

  const handleSave = async () => {
    let hasError = false;
    if (!formName) {
      setFormNameError(true);
      hasError = true;
    }
    if (hasError) return;

    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormAuthApi(conf);

      const dto: FormAuthInsertDto = {
        formId: formName.id,
        userIds: target.map((item: any) => item.id),
      };

      await api.apiFormAuthPost(dto);
      console.log(dto);
      navigate("/formAuth");
      dispatchAlert({
        message: "Form yetkisi tanımlandı.",
        type: "Success",
      });
    } catch (error) {
      dispatchAlert({
        message: "Hata Oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUpdate = async () => {
    let hasError = false;
    if (!formName) {
      setFormNameError(true);
      hasError = true;
    }
    if (hasError) return;

    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormAuthApi(conf);

      const dto: FormAuthUpdateDto = {
        formId: formName.id,
        userIds: target.map((item: any) => item.id),
      };

      await api.apiFormAuthPut(dto);
      console.log(dto);
      navigate("/formAuth");

      dispatchAlert({
        message: "Form yetkisi düzenlendi.",
        type: "Success",
      });
    } catch (error) {
      console.log(error);
      dispatchAlert({
        message: "Hata Oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const UserListRow = ({
    user,
    side,
  }: {
    user: any;
    side: "left" | "right";
  }) => {
    const uid = String(user.id);
    const checked = side === "left" ? leftSel.has(uid) : rightSel.has(uid);
    const onToggle = () =>
      side === "left" ? handleToggleLeft(uid) : handleToggleRight(uid);

    return (
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-muted/60",
          checked && "border-border/60 bg-muted/40",
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          className="mt-0.5"
          aria-label={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {user.firstName} {user.lastName}
          </p>
          {(user.email || user.userName) && (
            <p className="truncate text-xs text-muted-foreground">
              {[user.email, user.userName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </label>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <main className=" w-full  px-3 pb-10">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-xl font-semibold tracking-tight">Form Yetkisi Tanımlama</CardTitle>
            <CardDescription>Form seçin ve kullanıcıları yetkili listesine taşıyın.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="max-w-xl space-y-2">
              <Label className="text-muted-foreground">Form</Label>
              <Popover open={formPopoverOpen} onOpenChange={setFormPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={formPopoverOpen}
                    disabled={!!id}
                    aria-invalid={formNameError}
                    className="h-11 w-full justify-between font-normal"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">
                        {formName
                          ? `${formName.formName} - Rev:${formName.revision}`
                          : "Form seçiniz"}
                      </span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-1200 w-[min(520px,calc(100vw-2rem))] p-0 sm:min-w-80" align="start">
                  <Command>
                    <CommandInput placeholder="Form ara..." />
                    <CommandList>
                      <CommandEmpty>Sonuç yok.</CommandEmpty>
                      <CommandGroup>
                        {formNameOptions.map((f) => (
                          <CommandItem
                            key={String(f.id)}
                            value={`${f.formName}-${f.revision}-${f.id}`}
                            onSelect={() => {
                              setFormName(f);
                              setFormNameError(false);
                              setFormPopoverOpen(false);
                            }}
                          >
                            {`${f.formName} - Rev:${f.revision}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formNameError && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  Form seçiniz
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/15 p-4 shadow-sm md:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch lg:gap-3">
                <Card className="border border-border/50 shadow-none">
                  <CardHeader className="space-y-1 border-b border-border/50 py-4">
                    <div className="flex items-center gap-2 text-[#757ce8]">
                      <UserIcon className="size-5 shrink-0" aria-hidden />
                      <CardTitle className="text-base font-semibold text-[#757ce8] dark:text-indigo-300">
                        Tüm Kullanıcılar
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        className="h-9 rounded-lg bg-background pl-9"
                        placeholder="Kullanıcı ara"
                        value={leftFilter}
                        onChange={(e) => setLeftFilter(e.target.value)}
                        aria-label="Tüm kullanıcıları filtrele"
                      />
                    </div>
                    <ScrollArea className="h-96 rounded-lg border border-border/60 bg-background">
                      <div className="divide-y divide-border/50 p-2">
                        {leftFiltered.length === 0 ? (
                          <p className="py-10 text-center text-sm text-muted-foreground">Liste boş.</p>
                        ) : (
                          leftFiltered.map((u) => <UserListRow key={String(u.id)} user={u} side="left" />)
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="flex flex-row justify-center gap-2 lg:flex-col lg:justify-center lg:px-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    disabled={leftSel.size === 0}
                    aria-label="Seçilenleri yetkiye ekle"
                    onClick={handleMoveToTarget}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    disabled={rightSel.size === 0}
                    aria-label="Seçilenleri yetkiden çıkar"
                    onClick={handleMoveToSource}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </Button>
                </div>

                <Card className="border border-border/50 shadow-none">
                  <CardHeader className="space-y-1 border-b border-border/50 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-[#757ce8]">
                      <UserIcon className="size-5 shrink-0" aria-hidden />
                      <CardTitle className="text-base font-semibold text-[#757ce8] dark:text-indigo-300">
                        Yetki Verilen Kullanıcılar
                      </CardTitle>
                      {targetError && (
                        <span className="text-sm font-medium text-destructive">Form Yetkisi Error</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        className="h-9 rounded-lg bg-background pl-9"
                        placeholder="Kullanıcı ara"
                        value={rightFilter}
                        onChange={(e) => setRightFilter(e.target.value)}
                        aria-label="Yetkili kullanıcıları filtrele"
                      />
                    </div>
                    <ScrollArea className="h-96 rounded-lg border border-border/60 bg-background">
                      <div className="divide-y divide-border/50 p-2">
                        {rightFiltered.length === 0 ? (
                          <p className="py-10 text-center text-sm text-muted-foreground">Liste boş.</p>
                        ) : (
                          rightFiltered.map((u) => <UserListRow key={String(u.id)} user={u} side="right" />)
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/50 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate("/formAuth")}>
                İptal
              </Button>
              <Button type="button" onClick={id ? handleUpdate : handleSave}>
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}

export default FormAuthDetail;
