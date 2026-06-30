import {
  Configuration,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
  TicketTeamApi,
  TicketTeamListDto,
  TicketTeamUserAppInsertDto,
  UserApi,
  UserApp,
  UserCalendarApi,
} from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDateRangeFromWeek } from "../../utils/utils";
import { fetchTeamData } from "layouts/pages/queryBuild/controller/custom/apiCalls";
import {
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Building2,
  BarChart2,
  CalendarRange,
  Calendar,
  User,
  Users,
  Percent,
  Info,
  RefreshCw,
  Search,
  X,
  Check,
} from "lucide-react";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterCalendarProps {
  initialWeek?: number;
  initialYear?: number;
  onFilterApply?: (filterData: filterData) => void;
}

export interface filterData {
  selectedUsers: UserApp[];
  selectedDepartmentForm: string;
  selectedLevelForm: number | null;
  week: string;
  year: string;
  selectedDays: number[];
  selectedPercentage: number[];
  showAll: boolean;
  startDate?: string;
  endDate?: string;
}

// ─── Shared helper ────────────────────────────────────────────────────────────

const getInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

// ─── SearchableSelect (single) ────────────────────────────────────────────────

interface SelectOption {
  id?: any;
  [key: string]: any;
}

interface SearchableSelectProps<T extends SelectOption> {
  options: T[];
  value: T | null | undefined;
  onChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function SearchableSelect<T extends SelectOption>({
  options,
  value,
  onChange,
  getLabel,
  placeholder = "Seçiniz...",
  label,
  disabled = false,
  icon,
}: SearchableSelectProps<T>) {
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

  const filtered = useMemo(
    () => options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "w-full h-9 flex items-center justify-between gap-2 px-3 border rounded-lg bg-white text-sm text-left focus:outline-none transition-all",
          disabled
            ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
            : "border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer"
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span className={cn("truncate text-sm", value ? "text-slate-700" : "text-slate-400 text-xs")}>
            {value ? getLabel(value) : placeholder}
          </span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((opt, idx) => (
                <li key={opt.id ?? idx}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                      value?.id === opt.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {value?.id === opt.id && <Check className="w-3 h-3 shrink-0" />}
                    {getLabel(opt)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── MultiSelectField ─────────────────────────────────────────────────────────

interface MultiSelectFieldProps<T extends SelectOption> {
  options: T[];
  value: T[];
  onChange: (items: T[]) => void;
  getLabel: (item: T) => string;
  renderOption?: (item: T, selected: boolean) => React.ReactNode;
  renderChip?: (item: T, onRemove: () => void) => React.ReactNode;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function MultiSelectField<T extends SelectOption>({
  options,
  value,
  onChange,
  getLabel,
  renderOption,
  renderChip,
  placeholder = "Seçiniz...",
  label,
  disabled = false,
  icon,
}: MultiSelectFieldProps<T>) {
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

  const isSelected = (opt: T) => value.some((v) => v.id === opt.id);

  const handleToggle = (opt: T) => {
    if (isSelected(opt)) {
      onChange(value.filter((v) => v.id !== opt.id));
    } else {
      onChange([...value, opt]);
    }
  };

  const filtered = useMemo(
    () => options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger area */}
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "min-h-9 w-full flex items-center flex-wrap gap-1.5 px-3 py-1.5 border rounded-lg bg-white text-sm transition-all",
          disabled
            ? "border-slate-100 bg-slate-50 cursor-not-allowed"
            : "border-slate-200 hover:border-slate-300 cursor-pointer"
        )}
      >
        {icon && value.length === 0 && (
          <span className="text-slate-400 shrink-0">{icon}</span>
        )}
        {value.length === 0 ? (
          <span className="text-slate-400 text-xs">{placeholder}</span>
        ) : (
          value.map((item, i) =>
            renderChip ? (
              renderChip(item, () => onChange(value.filter((v) => v.id !== item.id)))
            ) : (
              <span
                key={item.id ?? i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100"
              >
                {getLabel(item)}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange(value.filter((v) => v.id !== item.id)); }}
                    className="text-indigo-400 hover:text-indigo-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            )
          )
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 ml-auto transition-transform", open && "rotate-180")} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((opt, idx) => {
                const sel = isSelected(opt);
                return (
                  <li key={opt.id ?? idx}>
                    <button
                      type="button"
                      onClick={() => handleToggle(opt)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                        sel ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "w-3.5 h-3.5 shrink-0 rounded border flex items-center justify-center transition-colors",
                          sel ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
                        )}
                      >
                        {sel && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      {renderOption ? renderOption(opt, sel) : <span>{getLabel(opt)}</span>}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Field label ──────────────────────────────────────────────────────────────

const FieldLabel = ({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
    {icon && <span className="text-slate-400">{icon}</span>}
    {children}
  </label>
);

// ─── Stat row ─────────────────────────────────────────────────────────────────

const StatRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2 text-xs text-slate-500">
    <span className="text-blue-400 mt-0.5 shrink-0">{icon}</span>
    <span>
      {label}:{" "}
      <strong className="text-slate-700 font-semibold">{value}</strong>
    </span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

function FilterCalendar({ initialWeek, initialYear, onFilterApply }: FilterCalendarProps) {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const hasInitialAppliedRef = useRef(false);

  const [departmentData, setDepartmentData] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<TicketDepartmensListDto | null>(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [levelData, setLevelData] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<any | null>(null);
  const [teamUsers, setTeamUsers] = useState<UserApp[]>([]);
  const [formData, setFormData] = useState<filterData>({
    selectedUsers: [],
    selectedDepartmentForm: "",
    selectedLevelForm: null,
    week: initialWeek ? initialWeek.toString() : "",
    year: initialYear ? initialYear.toString() : new Date().getFullYear().toString(),
    selectedDays: [],
    selectedPercentage: [],
    showAll: false,
  });

  // ── Static options ─────────────────────────────────────────────────────────

  const dayOptions = [
    { id: 0, description: "Pazartesi" },
    { id: 1, description: "Salı" },
    { id: 2, description: "Çarşamba" },
    { id: 3, description: "Perşembe" },
    { id: 4, description: "Cuma" },
    { id: 5, description: "Cumartesi" },
    { id: 6, description: "Pazar" },
  ];

  const percentageOptions = [
    { id: 1, description: "%25", color: "#10B981" },
    { id: 2, description: "%50", color: "#f4e218" },
    { id: 3, description: "%75", color: "#f69c09" },
    { id: 4, description: "%100", color: "#EF4444" },
  ];

  // ── Derived ────────────────────────────────────────────────────────────────

  const dateRange = useMemo(() => {
    if (formData.week && formData.year) {
      const weekNum = parseInt(formData.week as string);
      const yearNum = parseInt(formData.year as string);
      if (!isNaN(weekNum) && !isNaN(yearNum) && weekNum >= 1 && weekNum <= 53) {
        const { startDate, endDate } = getDateRangeFromWeek(weekNum, yearNum);
        const fmt = (d: Date) =>
          `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
            .toString()
            .padStart(2, "0")}.${d.getFullYear()}`;
        return `${fmt(new Date(startDate))} - ${fmt(new Date(endDate))}`;
      }
    }
    return null;
  }, [formData.week, formData.year]);

  const selectedDayItems = dayOptions.filter((o) => formData.selectedDays.includes(o.id));
  const selectedPercentageItems = percentageOptions.filter((o) =>
    formData.selectedPercentage?.includes(o.id)
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchIsManager = async () => {
      let conf = getConfiguration();
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckUserIsManagerGet();
      setIsManager(permData.data.perm);
    };
    const fetchHasPerm = async () => {
      let conf = getConfiguration();
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckOtherDeptpermGet();
      setHasPerm(permData.data.perm);
    };
    fetchIsManager();
    fetchHasPerm();
  }, []);

  useEffect(() => {
    if (initialWeek) setFormData((prev) => ({ ...prev, week: initialWeek.toString() }));
    if (initialYear) setFormData((prev) => ({ ...prev, year: initialYear.toString() }));
    if (selectedDepartment)
      setFormData((prev) => ({ ...prev, selectedDepartmentForm: selectedDepartment.id }));
  }, [initialWeek, initialYear, selectedDepartment]);

  useEffect(() => {
    const fetchDepartmentData = async () => {
      let conf = getConfiguration();
      let api3 = new TicketDepartmentsApi(conf);
      let response = await api3.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();
      setDepartmentData(response.data);
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckOtherDeptpermGet();
      if (permData.data.perm == false) {
        let api2 = new UserApi(conf);
        let response = await api2.apiUserUserDepartmentGet();
        setSelectedDepartment(response.data);
      }
    };
    const fetchLevelData = async () => {
      let conf = getConfiguration();
      let api = new UserApi(conf);
      let response = await api.apiUserUserLevelsGet();
      setLevelData(response.data as any);
    };
    try {
      dispatchBusy({ isBusy: true });
      fetchDepartmentData();
      fetchLevelData();
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, []);


  useEffect(() => {
    if (
      hasPerm === false &&
      isManager === true &&
      formData.selectedLevelForm == null &&
      formData.selectedUsers.length === 0 &&
      teamUsers.length > 0
    ) {
      setFormData((prev) => ({ ...prev, selectedUsers: teamUsers }));
    }
  }, [hasPerm, isManager, formData.selectedLevelForm, formData.selectedUsers.length, teamUsers]);

  useEffect(() => {
    if (
      hasInitialAppliedRef.current ||
      hasPerm !== false ||
      !formData.week ||
      !formData.year ||
      formData.selectedUsers.length === 0 ||
      !onFilterApply
    ) {
      return;
    }

    const weekNum = parseInt(formData.week as string);
    const yearNum = parseInt(formData.year as string);
    if (isNaN(weekNum) || isNaN(yearNum) || weekNum < 1 || weekNum > 53) {
      return;
    }

    hasInitialAppliedRef.current = true;
    const { startDate, endDate } = getDateRangeFromWeek(weekNum, yearNum);
    onFilterApply({ ...formData, startDate, endDate });
  }, [hasPerm, formData.week, formData.year, formData.selectedUsers.length, onFilterApply]);

  useEffect(() => {
    const fetchTeamUsers = async () => {
      if (selectedDepartment || selectedLevel) {
        try {
          dispatchBusy({ isBusy: true });
          let conf = getConfiguration();
          let api = new UserCalendarApi(conf);
          let response = await api.apiUserCalendarGetUsersByDepartmentAndLevelGet(
            selectedDepartment?.id,
            selectedLevel?.id
          );
          setTeamUsers(response.data);
          if (hasPerm == false) {
            setFormData((prev) => ({ ...prev, selectedUsers: response.data }));
          }
        } catch (error) {
          dispatchAlert({ message: "Hata oluştu", type: "Error" });
        } finally {
          dispatchBusy({ isBusy: false });
        }
      } else {
        setTeamUsers([]);
      }
    };
    fetchTeamUsers();
  }, [selectedDepartment, selectedLevel]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDepartmentChange = (_event: any, value: TicketDepartmensListDto | null) => {
    setSelectedDepartment(value);
    setFormData((prev) => ({
      ...prev,
      selectedDepartmentForm: value ? value.id : "",
      selectedUsers: [],
    }));
  };

  const handleLevelChange = (_event: any, value: any | null) => {
    setSelectedLevel(value);
    setFormData((prev) => ({
      ...prev,
      selectedLevelForm: value ? value.id : "",
      selectedUsers: [],
    }));
  };

  const handleFilterReset = async () => {
    setSelectedLevel(null);
    if (hasPerm == false) {
      const data: filterData = {
        selectedLevelForm: null,
        selectedUsers: teamUsers,
        selectedDepartmentForm: selectedDepartment.id,
        week: initialWeek ? initialWeek.toString() : "",
        year: initialYear ? initialYear.toString() : new Date().getFullYear().toString(),
        selectedDays: [],
        selectedPercentage: [],
        showAll: false,
      };
      setFormData(data);
      if (onFilterApply) onFilterApply(data);
    } else {
      setTeamUsers([]);
      setSelectedDepartment(null);
      const data: filterData = {
        selectedUsers: [],
        selectedDepartmentForm: "",
        selectedLevelForm: null,
        week: initialWeek ? initialWeek.toString() : "",
        year: initialYear ? initialYear.toString() : new Date().getFullYear().toString(),
        selectedDays: [],
        selectedPercentage: [],
        showAll: false,
      };
      setFormData(data);
      if (onFilterApply) onFilterApply(data);
    }
  };

  const handleFilterApply = () => {
    if (formData.week && formData.year) {
      if (
        (formData.selectedDays.length > 0 && formData.selectedPercentage.length === 0) ||
        (formData.selectedDays.length === 0 && formData.selectedPercentage.length > 0)
      ) {
        dispatchAlert({
          message: "Gün ve yoğunluk değerleri birlikte seçilmeli.",
          type: "Warning",
        });
      } else {
        const weekNum = parseInt(formData.week as string);
        const yearNum = parseInt(formData.year as string);
        if (weekNum >= 1 && weekNum <= 53) {
          const { startDate, endDate } = getDateRangeFromWeek(weekNum, yearNum);
          const updatedFormData = { ...formData, startDate, endDate };

          if (hasPerm == false && updatedFormData.selectedUsers == null) {
            const newupdatedFormData = { ...updatedFormData, selectedusers: teamUsers };
            if (onFilterApply) onFilterApply(newupdatedFormData);
          }
          if (onFilterApply) onFilterApply(updatedFormData);
        } else {
          dispatchAlert({
            message: "Hafta değeri 1-53 aralığında olmalıdır",
            type: "Error",
          });
        }
      }
    } else {
      if (!formData.week || !formData.year) {
        dispatchAlert({
          message: "Hafta ve yıl değerleri gereklidir",
          type: "Warning",
        });
      }
    }
  };

  // ── Person multi-select disabled state ────────────────────────────────────

  const isPersonDisabled =
    (!selectedDepartment && !selectedLevel) ||
    (hasPerm == false && isManager == false);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtre Ayarları
          </button>

          {dateRange && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/60 border border-indigo-100 rounded-lg">
              <CalendarRange className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-slate-600">{dateRange}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          aria-label={showFilter ? "Filtreyi Kapat" : "Filtreyi Aç"}
        >
          {showFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Expandable content ── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          showFilter ? "max-h-[2000px] opacity-100 visible" : "max-h-0 opacity-0 invisible"
        )}
      >
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left: Filters ── */}
          <div className="lg:col-span-9 space-y-4">

            {/* Department */}
            <SearchableSelect
              options={departmentData}
              value={selectedDepartment}
              onChange={(v) => handleDepartmentChange(null, v)}
              getLabel={(o) => o.departmentText || ""}
              label="Departman"
              placeholder="Departman Seçiniz"
              disabled={!hasPerm}
              icon={<Building2 className="w-3.5 h-3.5" />}
            />

            {/* Level */}
            <SearchableSelect
              options={levelData}
              value={selectedLevel}
              onChange={(v) => handleLevelChange(null, v)}
              getLabel={(o) => o.description || ""}
              label="Seviye"
              placeholder="Seviye Seçiniz"
              disabled={hasPerm == false && isManager == false}
              icon={<BarChart2 className="w-3.5 h-3.5" />}
            />

            {/* Week + Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={<CalendarRange className="w-3.5 h-3.5" />}>Hafta</FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      max={53}
                      placeholder="1-53"
                      value={formData.week || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("week", e.target.value)
                      }
                      className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white"
                    />
                  </div>
                  {dateRange && (
                    <span className="text-xs text-slate-500 whitespace-nowrap">({dateRange})</span>
                  )}
                </div>
              </div>
              <div>
                <FieldLabel icon={<Calendar className="w-3.5 h-3.5" />}>Yıl</FieldLabel>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min={2020}
                    max={2100}
                    value={formData.year || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("year", e.target.value)
                    }
                    className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Day + Percentage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Day multi-select */}
              <MultiSelectField
                options={dayOptions}
                value={selectedDayItems}
                onChange={(items) =>
                  handleInputChange("selectedDays", items.map((i) => i.id))
                }
                getLabel={(o) => o.description}
                label="Gün"
                icon={<CalendarRange className="w-3.5 h-3.5" />}
                placeholder="Gün Seçiniz"
              />

              {/* Percentage multi-select */}
              <MultiSelectField
                options={percentageOptions}
                value={selectedPercentageItems}
                onChange={(items) =>
                  handleInputChange("selectedPercentage", items.map((i) => i.id))
                }
                getLabel={(o) => o.description}
                label="Yoğunluk"
                icon={<Percent className="w-3.5 h-3.5" />}
                placeholder="Yoğunluk Seçiniz"
                renderOption={(opt) => (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span>{opt.description}</span>
                  </div>
                )}
                renderChip={(item, onRemove) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border"
                    style={{
                      backgroundColor: `${item.color}18`,
                      borderColor: `${item.color}40`,
                      color: item.color === "#f4e218" ? "#854d0e" : item.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.description}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemove(); }}
                      className="opacity-60 hover:opacity-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              />
            </div>

            {/* Person multi-select */}
            <div>
              <MultiSelectField
                options={teamUsers}
                value={formData.selectedUsers}
                onChange={(items) => handleInputChange("selectedUsers", items)}
                getLabel={(o) => `${o.firstName ?? ""} ${o.lastName ?? ""}`}
                label="Kişi"
                icon={<User className="w-3.5 h-3.5" />}
                placeholder="Kişi Seçiniz"
                disabled={isPersonDisabled}
                renderOption={(opt) => (
                  <div className="flex items-center gap-2">
                    {opt.photo ? (
                      <img
                        src={`data:image/jpeg;base64,${opt.photo}`}
                        alt={`${opt.firstName} ${opt.lastName}`}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {getInitials(opt.firstName, opt.lastName)}
                      </div>
                    )}
                    <span>
                      {opt.firstName} {opt.lastName}
                    </span>
                  </div>
                )}
                renderChip={(item, onRemove) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 pl-0.5 pr-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100"
                  >
                    {item.photo ? (
                      <img
                        src={`data:image/jpeg;base64,${item.photo}`}
                        alt={`${item.firstName} ${item.lastName}`}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[8px] font-bold flex items-center justify-center">
                        {getInitials(item.firstName, item.lastName)}
                      </div>
                    )}
                    {item.firstName} {item.lastName}
                    {!isPersonDisabled && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                )}
              />

              {!selectedDepartment && !selectedLevel && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Önce bir departman veya seviye seçmelisiniz
                </p>
              )}
            </div>

            {/* Show All toggle */}
            {hasPerm && (
              <div className="flex items-center gap-3">
                <div
                  role="switch"
                  aria-checked={formData.showAll}
                  tabIndex={0}
                  onClick={() => handleInputChange("showAll", !formData.showAll)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter")
                      handleInputChange("showAll", !formData.showAll);
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer",
                    formData.showAll ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      formData.showAll ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
                <span className="text-sm text-slate-600 select-none">Herkesi Getir</span>
              </div>
            )}
          </div>

          {/* ── Right: Summary + Actions ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Stats card (hidden on mobile) */}
            <div className="hidden md:block p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Filtre Özeti
              </p>
              <div className="space-y-2">
                <StatRow
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  label="Departman"
                  value={selectedDepartment ? selectedDepartment.departmentText : "Seçilmedi"}
                />
                <StatRow
                  icon={<BarChart2 className="w-3.5 h-3.5" />}
                  label="Seviye"
                  value={selectedLevel ? selectedLevel.description : "Seçilmedi"}
                />
                <StatRow
                  icon={<CalendarRange className="w-3.5 h-3.5" />}
                  label="Hafta/Yıl"
                  value={
                    formData.week && formData.year
                      ? `${formData.week}. Hafta, ${formData.year}`
                      : "Seçilmedi"
                  }
                />
                <StatRow
                  icon={<Users className="w-3.5 h-3.5" />}
                  label="Seçili Kişi Sayısı"
                  value={
                    formData.selectedUsers.length > 0
                      ? `${formData.selectedUsers.length} kişi`
                      : "Seçilmedi"
                  }
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleFilterApply}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtreleri Uygula
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleFilterReset}
                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Filtreleri Sıfırla
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterCalendar;
