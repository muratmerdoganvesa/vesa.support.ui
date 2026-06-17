import { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import getConfiguration from "confiuration";
import {
  IdentityRole,
  PositionListDto,
  PositionsApi,
  RoleMenuApi,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
  UserApi,
  UserAppDtoWithoutPhoto,
  WorkCompanyApi,
  WorkCompanyDto,
} from "api/generated";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import { Button } from "components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Badge } from "components/ui/badge";
import { Settings2, ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "lib/utils";
import { ComboField } from "../ComboField";

interface ILevels { id: number; name: string; description: string; }

// ── Multi-select (roles) ──────────────────────────────────────────────────
interface MultiComboFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}

function MultiComboField({ id, label, placeholder = "Seçin…", options, value, onChange }: MultiComboFieldProps) {
  const [open, setOpen] = useState(false);

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-10 w-full justify-between font-normal"
          >
            <div className="flex flex-1 flex-wrap gap-1">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                value.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                    onClick={(e) => { e.stopPropagation(); toggle(v); }}
                  >
                    {v}
                    <X className="size-3" />
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Ara…" />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem key={opt} value={opt} onSelect={() => toggle(opt)}>
                    <Check className={cn("mr-2 size-4", value.includes(opt) ? "opacity-100" : "opacity-0")} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Permission checkbox ───────────────────────────────────────────────────
interface PermissionCheckProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function PermissionCheck({ id, label, checked, onCheckedChange }: PermissionCheckProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/20">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5 shrink-0" />
      <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground leading-snug">
        {label}
      </Label>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
function TicketManagement({ formData }: any): JSX.Element {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const { setFieldValue } = useFormikContext();
  const { values } = formData;
  const {
    ticketDepartmentId: ticketDepartmentIdV,
    workCompanyId: workCompanyIdV,
    hasTicketPermission: hasTicketPermissionV,
    hasDepartmentPermission: hasDepartmentPermissionV,
    hasOtherCompanyPermission: hasOtherCompanyPermissionV,
    hasOtherDeptCalendarPerm: hasOtherDeptCalendarPermV,
    canEditTicket: canEditTicketV,
    dontApplyDefaultFilters: dontApplyDefaultFiltersV,
    positionId: positionIdV,
    userLevel: userLevelV,
    mainManagerUserAppId: mainManagerUserAppIdV,
    isTeamLeader: isTeamLeaderV,
    isKanbanAdmin: isKanbanAdminV,
  } = values;

  const [departmentData, setDepartmentData] = useState<TicketDepartmensListDto[]>([]);
  const [usersData, setUsersData] = useState<UserAppDtoWithoutPhoto[]>([]);
  const [roleData, setRoleData] = useState<IdentityRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [companies, setCompanies] = useState<WorkCompanyDto[]>([]);
  const [positionData, setPositionData] = useState<PositionListDto[]>([]);
  const [userLevelData, setUserLevelData] = useState<ILevels[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const [deptRes, usersRes, rolesRes, compRes, posRes, levelRes] = await Promise.all([
          new TicketDepartmentsApi(conf).apiTicketDepartmentsAllOnlyNameGet(),
          new UserApi(conf).apiUserGetAllUsersNameIdOnlyGet(),
          new RoleMenuApi(conf).apiRoleMenuAllOnlyHeadGet(),
          new WorkCompanyApi(conf).apiWorkCompanyGet(),
          new PositionsApi(conf).apiPositionsGet(),
          new UserApi(conf).apiUserUserLevelsGet(),
        ]);
        setDepartmentData(deptRes.data);
        setUsersData(usersRes.data);
        setRoleData(rolesRes.data);
        setCompanies(compRes.data);
        setPositionData(posRes.data);
        setUserLevelData(levelRes.data as any);
      } catch (error) {
        dispatchAlert({ message: "Veriler yüklenirken hata: " + error, type: "Error" });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    load();
  }, []);

  // Sync selected role names when form values or roleData loads
  useEffect(() => {
    const names = roleData
      .filter((r: any) => values.roleIds.some((role: any) => role.roleId === r.id))
      .map((r: any) => r.name as string);
    setSelectedRoles(names);
  }, [values.roleIds, roleData]);

  // ── Flat string options ───────────────────────────────────────────────
  const deptOptions    = departmentData.map((d) => d.departmentText);
  const companyOptions = companies.map((c) => (c as any).name as string);
  const userOptions    = usersData.map((u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim());
  const posOptions     = positionData.map((p) => p.name);
  const levelOptions   = userLevelData.map((l) => l.description);

  // ── Current value labels ──────────────────────────────────────────────
  const deptLabel    = departmentData.find((d) => d.id === ticketDepartmentIdV)?.departmentText ?? "";
  const companyLabel = (companies.find((c) => c.id === workCompanyIdV) as any)?.name ?? "";
  const userLabel    = (() => {
    const u = usersData.find((u) => u.id === mainManagerUserAppIdV);
    return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";
  })();
  const posLabel     = positionData.find((p) => p.id === positionIdV)?.name ?? "";
  const levelLabel   = userLevelData.find((l) => l.id === userLevelV)?.description ?? "";

  // ── Change handlers ───────────────────────────────────────────────────
  const handleRolesChange = (names: string[]) => {
    const mapped = names.map((name) => {
      const found = roleData.find((r) => r.name === name);
      return found ? { roleId: found.id, roleName: name } : null;
    }).filter(Boolean);
    setFieldValue("roleIds", mapped);
    setSelectedRoles(names);
  };

  const handleDept    = (l: string) => setFieldValue("ticketDepartmentId", departmentData.find((d) => d.departmentText === l)?.id ?? "");
  const handleCompany = (l: string) => setFieldValue("workCompanyId", companies.find((c) => (c as any).name === l)?.id ?? "");
  const handleUser    = (l: string) => setFieldValue("mainManagerUserAppId", usersData.find((u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() === l)?.id ?? null);
  const handlePos     = (l: string) => setFieldValue("positionId", positionData.find((p) => p.name === l)?.id ?? null);
  const handleLevel   = (l: string) => setFieldValue("userLevel", userLevelData.find((lv) => lv.description === l)?.id ?? null);

  const permissions = [
    { id: "perm-ticket",   label: "Başkası adına talep oluşturma yetkisi",                         field: "hasTicketPermission",      value: hasTicketPermissionV },
    { id: "perm-dept",     label: "Departmanımda oluşturulan tüm talepleri görebilme",              field: "hasDepartmentPermission",   value: hasDepartmentPermissionV },
    { id: "perm-company",  label: "Başka şirketlerdeki talepleri görebilme yetkisi",                field: "hasOtherCompanyPermission", value: hasOtherCompanyPermissionV },
    { id: "perm-calendar", label: "Ekip planlama sayfasında departman seçebilme yetkisi",           field: "hasOtherDeptCalendarPerm",  value: hasOtherDeptCalendarPermV },
    { id: "perm-edit",     label: "Talep düzenleyebilme yetkisi (Oluşturulan talepler için)",       field: "canEditTicket",             value: canEditTicketV },
    { id: "perm-filter",   label: "Varsayılan filtreleri uygulama",                                  field: "dontApplyDefaultFilters",   value: dontApplyDefaultFiltersV },
    { id: "perm-leader",   label: "Takım Lideri mi?",                                               field: "isTeamLeader",              value: isTeamLeaderV },
    { id: "perm-kanban-admin", label: "Kanbanda Admin Yetkisi",                                     field: "isKanbanAdmin",            value: isKanbanAdminV },
  ];

  return (
    <Card id="ticket-management" className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/40 bg-muted/20 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Settings2 className="size-4 text-indigo-500" />
          Talep Yönetimi
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {values.firstName} için görüntüleme yetkisi ve rol ayarları
        </p>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <MultiComboField
            id="combo-roles"
            label="Yetki Seviyesi"
            placeholder="Rol seçin…"
            options={roleData.map((r) => r.name as string)}
            value={selectedRoles}
            onChange={handleRolesChange}
          />
          <ComboField id="combo-dept"    label="Departman"          placeholder="Departman seçin…"    options={deptOptions}    value={deptLabel}    onChange={handleDept}    />
          <ComboField id="combo-company" label="Şirket"             placeholder="Şirket seçin…"       options={companyOptions} value={companyLabel} onChange={handleCompany} />
          <ComboField id="combo-user"    label="Asıl Yönetici"      placeholder="Yönetici seçin…"     options={userOptions}    value={userLabel}    onChange={handleUser}    />
          <ComboField id="combo-pos"     label="Pozisyon"           placeholder="Pozisyon seçin…"     options={posOptions}     value={posLabel}     onChange={handlePos}     />
          <ComboField id="combo-level"   label="Kullanıcı Seviyesi" placeholder="Seviye seçin…"       options={levelOptions}   value={levelLabel}   onChange={handleLevel}   />
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Yetkiler</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((p) => (
              <PermissionCheck
                key={p.id}
                id={p.id}
                label={p.label}
                checked={p.value}
                onCheckedChange={(v) => setFieldValue(p.field, v)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketManagement;
