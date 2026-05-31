import {
  DepartmentUserInsertDto,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
  UserApi,
  UserAppDto,
  WorkCompanyApi,
  WorkCompanyDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";
import { cn } from "lib/utils";

// shadcn/ui
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

// Lucide
import {
  Building2,
  Users,
  User,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  ArrowLeft,
  Save,
  CheckCircle,
  GitBranch,
} from "lucide-react";

// ─── Avatar helper ────────────────────────────────────────────────────────────

function UserAvatar({ user, size = "sm" }: { user: UserAppDto; size?: "sm" | "md" }) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const cls = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  if (user.photo) {
    return (
      <img
        src={`data:image/png;base64,${user.photo}`}
        alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
        className={cn("rounded-full object-cover shrink-0", cls)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold shrink-0",
        cls
      )}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Simple search select (for static option lists) ──────────────────────────

type SimpleSearchSelectProps<T> = {
  options: T[];
  value: T | null;
  onChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

function SimpleSearchSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getId,
  placeholder,
  disabled,
  icon,
}: SimpleSearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = options.filter((opt) =>
    getLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
          disabled && "cursor-not-allowed opacity-50"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
            {value ? getLabel(value) : placeholder}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && onChange(null)}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground"
              aria-label="Temizle"
            >
              <X className="size-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden">
            <div className="p-1.5 border-b bg-muted/20">
              <div className="flex items-center gap-1.5 px-2 h-7 bg-background rounded border border-input/40">
                <Search className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  Sonuç bulunamadı
                </p>
              ) : (
                filtered.map((opt) => {
                  const isSelected = value !== null && getId(value) === getId(opt);
                  return (
                    <button
                      key={getId(opt)}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors",
                        isSelected && "bg-accent/60 font-medium"
                      )}
                      onClick={() => {
                        onChange(opt);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <CheckCircle
                        className={cn(
                          "size-3.5 shrink-0 transition-opacity",
                          isSelected ? "opacity-100 text-indigo-600" : "opacity-0"
                        )}
                      />
                      <span>{getLabel(opt)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Async user search – single select ────────────────────────────────────────

type UserSearchSingleProps = {
  value: UserAppDto | undefined;
  options: UserAppDto[];
  onInputChange: (val: string) => void;
  onChange: (user: UserAppDto) => void;
  placeholder?: string;
  label?: string;
};

function UserSearchSingle({
  value,
  options,
  onInputChange,
  onChange,
  placeholder,
}: UserSearchSingleProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setInputValue(`${value.firstName ?? ""} ${value.lastName ?? ""}`.trim());
    }
  }, [value?.id]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (value) {
          setInputValue(`${value.firstName ?? ""} ${value.lastName ?? ""}`.trim());
        }
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onInputChange(val);
    setOpen(val.length > 0);
  };

  const handleSelect = (user: UserAppDto) => {
    onChange(user);
    setInputValue(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        <input
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "hover:border-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          )}
          value={inputValue}
          onChange={handleInput}
          onFocus={() => inputValue && options.length > 0 && setOpen(true)}
          placeholder={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onInputChange("");
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Temizle"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && options.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-left hover:bg-accent transition-colors"
                >
                  <UserAvatar user={user} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-slate-800 truncate">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-slate-500 truncate">{user.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Async user search – multi-select ─────────────────────────────────────────

type UserSearchMultiProps = {
  value: UserAppDto[];
  options: UserAppDto[];
  onInputChange: (val: string) => void;
  onChange: (users: UserAppDto[]) => void;
  placeholder?: string;
};

function UserSearchMulti({
  value,
  options,
  onInputChange,
  onChange,
  placeholder,
}: UserSearchMultiProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onInputChange(val);
    setOpen(val.length > 0);
  };

  const handleToggle = (user: UserAppDto) => {
    const alreadySelected = value.some((u) => u.id === user.id);
    if (alreadySelected) {
      onChange(value.filter((u) => u.id !== user.id));
    } else {
      onChange([...value, user]);
      setInputValue("");
      onInputChange("");
    }
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter((u) => u.id !== userId));
  };

  return (
    <div className="w-full" ref={ref}>
      {/* Selected user chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-medium"
            >
              <UserAvatar user={user} size="sm" />
              <span className="ml-0.5">
                {user.firstName} {user.lastName}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(user.id)}
                className="ml-0.5 rounded-full hover:bg-indigo-200 p-0.5"
                aria-label="Kullanıcıyı kaldır"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        <input
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "hover:border-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          )}
          value={inputValue}
          onChange={handleInput}
          onFocus={() => inputValue && options.length > 0 && setOpen(true)}
          placeholder={value.length > 0 ? "Daha fazla kullanıcı ekle..." : placeholder}
        />
      </div>

      {/* Dropdown */}
      {open && options.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <div className="absolute mt-1 w-full rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden">
              <div className="max-h-60 overflow-y-auto p-1">
                {options.map((user) => {
                  const isSelected = value.some((u) => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleToggle(user)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-left hover:bg-accent transition-colors",
                        isSelected && "bg-indigo-50"
                      )}
                    >
                      <UserAvatar user={user} size="sm" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-slate-800 truncate">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-slate-500 truncate">{user.email}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle className="size-4 text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── FormField wrapper ────────────────────────────────────────────────────────

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function CreateDepartment() {
  const [departmentCode, setDepartmentCode] = useState("");
  const [departmentText, setDepartmentText] = useState("");
  const [departmentIsActive, setDepartmentIsActive] = useState(false);
  const [departmentManageId, setDepartmentManageId] = useState("");
  const [activeOptions] = useState(["Pasif", "Aktif"]);
  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const [selectedKullanici, setSelectedKullanici] = useState<UserAppDto>();
  const [selectionKullaniciId, setSelectionKullaniciId] = useState<string>();
  const [selectedUsers, setSelectedUsers] = useState<UserAppDto[]>([]);
  const [selectionUserIds, setSelectionUserIds] = useState<string[]>([]);
  const [namesOfSelected, setNamesOfSelected] = useState<string>();
  const [companies, setCompanies] = useState<WorkCompanyDto[]>([]);
  const [myDepertments, setMyDepertments] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [parentDepartmanId, setParentDepartmanId] = useState(null);
  const [IsVisibleInList, setIsVisibleInList] = useState(false);
  const [nameofSelected, setNameofSelected] = useState("");

  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchIDData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      var response = await api.apiTicketDepartmentsIdGet(id);
      console.log("response", response.data);
      setDepartmentCode(response.data.deparmentCode);
      setDepartmentText(response.data.departmentText);
      setDepartmentIsActive(response.data.isActive);
      setDepartmentManageId(response.data.managerId);
      setIsVisibleInList(response.data.isVisibleInList);
      setSelectedCompany({
        id: response.data.workCompanyId,
        name: companies.find((company: any) => company.id === response.data.workCompanyId)?.name,
      });
      if (response.data.parentDepartmentId) {
        setSelectedDepartment({
          id: response.data.parentDepartmentId,
          departmentText: myDepertments.find(
            (department: any) => department.id === response.data.parentDepartmentId
          )?.departmentText,
        });
      }
      setParentDepartmanId(response.data.parentDepartmentId);
      console.log("response.data.departmentUsers", response.data);

      const managerData = {
        id: response.data.managerId,
        firstName: response.data.manager.firstName,
        lastName: response.data.manager.lastName,
      };
      setSelectedKullanici(managerData);
      setSelectionKullaniciId(response.data.managerId);

      var deptusers: UserAppDto[] = [];
      response.data.departmentUsers.forEach((item) => {
        deptusers.push(item.user);
      });
      setSelectedUsers(deptusers);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentList.HataOlustu") + ": " + error,
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchCompany = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyApi(conf);
      var response = await api.apiWorkCompanyGet();
      setCompanies(response.data);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentList.HataOlustu") + ": " + error,
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchDepartment = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      var response = await api.apiTicketDepartmentsGet();
      console.log("sercan departmanları", response);
      setMyDepertments(response.data);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentList.HataOlustu") + ": " + error,
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    const initializeCompanies = async () => {
      await fetchCompany();
      await fetchDepartment();
    };
    initializeCompanies();
  }, []);

  useEffect(() => {
    const initializeDepartmentData = async () => {
      if (id && companies.length > 0) {
        await fetchIDData();
      }
    };
    initializeDepartmentData();
  }, [id, companies, myDepertments]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateDepartment = async () => {
    if (
      departmentCode === "" ||
      departmentText === "" ||
      selectionKullaniciId === null ||
      selectedCompany === null ||
      selectedUsers.length === 0
    ) {
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentDetail.AlanlariDoldur"),
        type: "Error",
      });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      await api.apiTicketDepartmentsPost({
        deparmentCode: departmentCode,
        departmentText: departmentText,
        isActive: departmentIsActive,
        managerId: selectionKullaniciId,
        workCompanyId: selectedCompany.id,
        isVisibleInList: IsVisibleInList,
        departmentUsers: selectedUsers.map((user) => ({
          ticketDepartmentId: user.ticketDepartmentId,
          userId: user.id,
        })),
        parentDepartmentId: selectedDepartment ? selectedDepartment.id : null,
      });
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentDetail.DepartmanEklendi"),
        type: "Success",
      });
      dispatchBusy({ isBusy: false });
      navigate("/departments");
    } catch (error) {
      dispatchAlert({ message: error?.toString(), type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUpdateDepartment = async () => {
    if (
      departmentCode === "" ||
      departmentText === "" ||
      selectionKullaniciId === null ||
      selectedCompany === null ||
      selectedUsers.length === 0
    ) {
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentDetail.AlanlariDoldur"),
        type: "Error",
      });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      await api.apiTicketDepartmentsPut({
        id: id,
        deparmentCode: departmentCode,
        departmentText: departmentText,
        isActive: departmentIsActive,
        managerId: selectionKullaniciId,
        workCompanyId: selectedCompany.id,
        isVisibleInList: IsVisibleInList,
        departmentUsers: selectedUsers.map((user) => ({
          ticketDepartmentId: user.ticketDepartmentId,
          userId: user.id,
        })),
        parentDepartmentId: selectedDepartment ? selectedDepartment.id : null,
      });
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentDetail.DepartmanGuncellendi"),
        type: "Success",
      });
      dispatchBusy({ isBusy: false });
      navigate("/departments");
    } catch (error) {
      dispatchAlert({ message: error?.toString(), type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new UserApi(conf);
        var data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
        var pureData = data.data;
        setSearchByName(pureData);
        dispatchBusy({ isBusy: false });
      } catch (error) {
        console.log("error", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
  };

  useEffect(() => {
    console.log("selectedUsers", selectedUsers);
  }, [selectedUsers]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-4 mx-1 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                {id
                  ? t("ns1:DepartmentPage.DepartmentDetail.DepartmanDuzenle")
                  : t("ns1:DepartmentPage.DepartmentDetail.DepartmanOlustur")}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {id
                  ? t("ns1:DepartmentPage.DepartmentDetail.DepartmanDuzenle")
                  : t("ns1:DepartmentPage.DepartmentDetail.DepartmanOlustur")}
              </p>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">

              {/* ── Left Column ── */}
              <div className="flex flex-col gap-5">

                {/* Department Name */}
                <FormField
                  label={t("ns1:DepartmentPage.DepartmentDetail.DepartmanAdi")}
                  required
                >
                  <Input
                    type="text"
                    value={departmentText}
                    onChange={(e) => setDepartmentText(e.target.value)}
                    placeholder={t("ns1:DepartmentPage.DepartmentDetail.DepartmanAdi")}
                    className="h-10 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </FormField>

                {/* Status */}
                <FormField label={t("ns1:DepartmentPage.DepartmentDetail.Durum")} required>
                  <Select
                    value={departmentIsActive ? "aktif" : "pasif"}
                    onValueChange={(val) => setDepartmentIsActive(val === "aktif")}
                  >
                    <SelectTrigger className="h-10 hover:border-indigo-400 focus:ring-indigo-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          Aktif
                        </span>
                      </SelectItem>
                      <SelectItem value="pasif">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                          Pasif
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Company */}
                <FormField
                  label={t("ns1:DepartmentPage.DepartmentDetail.SirketAdi")}
                  required
                >
                  <SimpleSearchSelect<WorkCompanyDto>
                    options={companies}
                    value={selectedCompany}
                    onChange={setSelectedCompany}
                    getLabel={(opt) => (opt as any).name ?? ""}
                    getId={(opt) => String((opt as any).id ?? "")}
                    placeholder={t("ns1:DepartmentPage.DepartmentDetail.SirketAdi")}
                    icon={<Building2 className="size-4" />}
                  />
                </FormField>

                {/* Parent Department */}
                <FormField
                  label={t("ns1:DepartmentPage.DepartmentDetail.UstDepartman")}
                >
                  <SimpleSearchSelect<TicketDepartmensListDto>
                    options={myDepertments}
                    value={selectedDepartment}
                    onChange={(val) => setSelectedDepartment(val || null)}
                    getLabel={(opt) => opt.departmentText ?? ""}
                    getId={(opt) => opt.id ?? ""}
                    placeholder={t("ns1:DepartmentPage.DepartmentDetail.UstDepartman")}
                    icon={<GitBranch className="size-4" />}
                  />
                </FormField>

                {/* Visible in list */}
                <div className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:border-indigo-200 transition-colors">
                  <Checkbox
                    id="visibleInList"
                    checked={IsVisibleInList}
                    onCheckedChange={(checked) => setIsVisibleInList(checked === true)}
                    className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <div>
                    <label
                      htmlFor="visibleInList"
                      className="text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      {t("ns1:DepartmentPage.DepartmentDetail.TicketGorunsun")}
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bu departman ticket listesinde görünür olacak
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right Column ── */}
              <div className="flex flex-col gap-5">

                {/* Department Code */}
                <FormField
                  label={t("ns1:DepartmentPage.DepartmentDetail.DepartmanKodu")}
                  required
                >
                  <Input
                    type="text"
                    value={departmentCode}
                    onChange={(e) => setDepartmentCode(e.target.value)}
                    placeholder={t("ns1:DepartmentPage.DepartmentDetail.DepartmanKodu")}
                    className="h-10 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                  />
                </FormField>

                {/* Manager Search */}
                <FormField
                  label={t("ns1:DepartmentPage.DepartmentDetail.Yoneticiler")}
                  required
                >
                  <UserSearchSingle
                    value={selectedKullanici}
                    options={searchByName}
                    onInputChange={handleSearchByName}
                    onChange={(user) => {
                      setSelectedKullanici(user);
                      setSelectionKullaniciId(user.id);
                      setNamesOfSelected(`${user.firstName} ${user.lastName}`);
                    }}
                    placeholder={t("ns1:DepartmentPage.DepartmentDetail.IsimAratin")}
                  />
                  {/* Selected manager preview */}
                  {selectedKullanici && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <UserAvatar user={selectedKullanici} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedKullanici.firstName} {selectedKullanici.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{selectedKullanici.email}</p>
                      </div>
                    </div>
                  )}
                </FormField>

                {/* Users Multi-Search */}
                <FormField
                  label={t("ns1:DepartmentPage.DepartmentDetail.Kullanicilar")}
                  required
                >
                  <UserSearchMulti
                    value={selectedUsers}
                    options={searchByName}
                    onInputChange={handleSearchByName}
                    onChange={(users) => {
                      setSelectedUsers(users);
                      setSelectionUserIds(users.map((u) => u.id));
                    }}
                    placeholder={t("ns1:DepartmentPage.DepartmentDetail.IsimAratin")}
                  />
                  {selectedUsers.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedUsers.length} kullanıcı seçildi
                    </p>
                  )}
                </FormField>
              </div>
            </div>
          </div>

          {/* ── Footer Actions ── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <Button
              variant="outline"
              onClick={() => navigate("/departments")}
              className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("ns1:DepartmentPage.DepartmentDetail.Iptal")}
            </Button>
            <Button
              onClick={id ? handleUpdateDepartment : handleCreateDepartment}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              {t("ns1:DepartmentPage.DepartmentDetail.Kaydet")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CreateDepartment;
