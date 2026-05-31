import {
  UserApi,
  UserAppDto,
  PCTrackingApi,
  PcTrackGraphicDto,
  TicketDepartmentsApi,
  TicketDepartmensListDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Monitor,
  CheckCircle2,
  LockOpen,
  KeyRound,
  HelpCircle,
  User,
  Mail,
  RefreshCw,
  TableIcon,
  List,
  Search,
  X,
  ChevronDown,
  Check,
  MonitorDot,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupedUserData {
  user: UserAppDto;
  logins: PcTrackGraphicDto[];
}

// ─── PC Status helpers ────────────────────────────────────────────────────────

const getPCStatus = (loginType: number) => {
  if (loginType === 2) return { label: "Açıldı", color: "info", icon: "computer" };
  if (loginType === 5) return { label: "Aktif", color: "success", icon: "check_circle" };
  if (loginType === 7) return { label: "Kilit Açıldı", color: "warning", icon: "lock_open" };
  if (loginType === 11) return { label: "Önbellekli Giriş", color: "secondary", icon: "vpn_key" };
  return { label: "Bilinmiyor", color: "default", icon: "help" };
};

const STATUS_STYLE: Record<string, string> = {
  info: "bg-blue-100 text-blue-700 border-blue-200",
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  secondary: "bg-slate-100 text-slate-600 border-slate-200",
  default: "bg-gray-100 text-gray-600 border-gray-200",
};

const StatusIcon = ({ loginType }: { loginType: number }) => {
  if (loginType === 2) return <Monitor className="w-3 h-3" />;
  if (loginType === 5) return <CheckCircle2 className="w-3 h-3" />;
  if (loginType === 7) return <LockOpen className="w-3 h-3" />;
  if (loginType === 11) return <KeyRound className="w-3 h-3" />;
  return <HelpCircle className="w-3 h-3" />;
};

const getLoginTypeLabel = (loginType: number) => {
  if (loginType === 2) return "Açılış Saati:";
  if (loginType === 5) return "Aktif Saati:";
  if (loginType === 7) return "Kilit Açma:";
  if (loginType === 11) return "Önbellekli Giriş:";
  return "Bilinmiyor:";
};

const getInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

// ─── Inline SearchableSelect (single) ────────────────────────────────────────

interface SearchableSelectProps<T> {
  options: T[];
  value: T | null | undefined;
  onChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  placeholder?: string;
  label?: string;
}

function SearchableSelect<T extends { id?: any }>({
  options,
  value,
  onChange,
  getLabel,
  placeholder = "Seçiniz...",
  label,
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
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 flex items-center justify-between gap-2 px-3 border border-slate-200 rounded-lg bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
      >
        <span className={value ? "text-slate-700" : "text-slate-400 text-xs"}>
          {value ? getLabel(value) : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
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
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
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
                      value?.id === opt.id ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
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

// ─── UserMultiSelect ──────────────────────────────────────────────────────────

interface UserMultiSelectProps {
  options: UserAppDto[];
  value: UserAppDto[];
  onChange: (val: UserAppDto[]) => void;
}

function UserMultiSelect({ options, value, onChange }: UserMultiSelectProps) {
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
    () =>
      options.filter(
        (o) =>
          `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          o.userName?.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  const toggle = (opt: UserAppDto) => {
    const exists = value.some((v) => v.id === opt.id);
    onChange(exists ? value.filter((v) => v.id !== opt.id) : [...value, opt]);
  };

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        Kullanıcı / Kullanıcılar
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[36px] flex flex-wrap items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
      >
        {value.length === 0 ? (
          <span className="text-slate-400 text-xs">Kullanıcı seçiniz...</span>
        ) : (
          value.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-md"
            >
              {v.firstName} {v.lastName}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(value.filter((u) => u.id !== v.id)); }}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform", open && "rotate-180")} />
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
                placeholder="İsim veya e-posta ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((opt) => {
                const selected = value.some((v) => v.id === opt.id);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => toggle(opt)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors border-b border-slate-50",
                        selected ? "bg-blue-50" : "hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", selected ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white")}>
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          {opt.firstName} {opt.lastName}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {opt.userName}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-500">{value.length} seçili</span>
              <button type="button" onClick={() => onChange([])} className="text-xs text-red-500 hover:text-red-700 font-medium">
                Temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function PCTrackingManagement() {
  const [selectedUser, setSelectedUser] = useState<UserAppDto[]>([]);
  const [userData, setUserData] = useState<UserAppDto[]>([]);
  const [departments, setDepartments] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<TicketDepartmensListDto>();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [hourRange, setHourRange] = useState([9, 18]);
  const [isAllUserSelected, setIsAllUserSelected] = useState(false);
  const [pcData, setPcData] = useState<GroupedUserData[]>([]);
  const [showOnlyFirstData, setShowOnlyFirstData] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [filteredPcData, setFilteredPcData] = useState<GroupedUserData[]>([]);
  const [filteredSessionData, setFilteredSessionData] = useState<GroupedUserData[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<GroupedUserData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const { t } = useTranslation();

  const tabs = [
    { label: "Tablo Şeklinde Göster", icon: <TableIcon className="w-4 h-4" /> },
    { label: "Liste Şeklinde Göster", icon: <List className="w-4 h-4" /> },
  ];

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchPcData = async (isAllUser: boolean = false) => {
    if (
      !isAllUser &&
      (selectedUser.length === 0 ||
        selectedUser.length === undefined ||
        selectedUser.length === null)
    ) {
      dispatchAlert({ message: "Lütfen kullanıcı seçiniz", type: "Error" });
      setPcData([]);
      setFilteredPcData([]);
      return;
    }

    if (!selectedDate) {
      dispatchAlert({ message: "Lütfen tarih seçiniz", type: "Error" });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let api = new PCTrackingApi(config);
      let formattedStartDate = selectedDate.split(".").reverse().join("-");
      let formattedEndDate = selectedEndDate.split(".").reverse().join("-");
      let response;

      if (isAllUser) {
        response = await api.apiPCTrackingGetByUserGet(
          null,
          formattedStartDate,
          formattedEndDate,
          hourRange[0],
          hourRange[1] - 3,
          true
        );
        console.log("response", response.data);
      } else {
        response = await api.apiPCTrackingGetByUserGet(
          selectedUser?.map((user) => user.id.toString()),
          formattedStartDate,
          formattedEndDate,
          hourRange[0],
          hourRange[1] - 3
        );
        console.log("response", response.data);
      }

      const groupedDataByUser: GroupedUserData[] = response.data.reduce(
        (acc: GroupedUserData[], item: PcTrackGraphicDto) => {
          const userId = item.user.id;
          const existingUserIndex = acc.findIndex((user) => user.user.id === userId);
          if (existingUserIndex !== -1) {
            acc[existingUserIndex].logins.push(item);
          } else {
            acc.push({
              user: {
                id: item.user.id,
                firstName: item.user.firstName,
                lastName: item.user.lastName,
                userName: item.user.userName,
              },
              logins: [item],
            });
          }
          return acc;
        },
        []
      );

      console.log("transformedDataByUser", groupedDataByUser);
      setPcData(groupedDataByUser);

      const filteredActiveData = groupedDataByUser.map((ud: GroupedUserData) => ({
        ...ud,
        logins: ud.logins.filter((login: PcTrackGraphicDto) => login.loginType !== 5),
      }));
      console.log("filteredActiveData", filteredActiveData);
      setFilteredSessionData(filteredActiveData);
      setFilteredTableData(filteredActiveData);
      setFilteredPcData(filteredActiveData);
      setShowOnlyActive(true);
    } catch (error) {
      setPcData([]);
      setFilteredPcData([]);
      dispatchAlert({ message: `${error} `, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleToggleFirstData = () => {
    const newShowOnlyFirstData = !showOnlyFirstData;
    setShowOnlyFirstData(newShowOnlyFirstData);
    if (newShowOnlyFirstData) {
      const firstDataOnly = pcData.map((ud: GroupedUserData) => ({
        ...ud,
        logins: ud.logins.length > 0 ? [ud.logins[0]] : [],
      }));
      setFilteredPcData(firstDataOnly);
    } else {
      setFilteredPcData(pcData);
    }
  };

  const handleToggleActive = () => {
    const newShowOnlyActive = !showOnlyActive;
    setShowOnlyActive(newShowOnlyActive);
    if (newShowOnlyActive) {
      const filteredActiveData = pcData.map((ud: GroupedUserData) => ({
        ...ud,
        logins: ud.logins.filter((login: PcTrackGraphicDto) => login.loginType !== 5),
      }));
      setFilteredPcData(filteredActiveData);
    } else {
      setFilteredPcData(pcData);
    }
  };

  // MUI Slider signature preserved — called with synthetic event
  const handleHourRangeChange = (event: Event, newValue: number | number[]) => {
    setHourRange(newValue as number[]);
  };

  const handleFetchData = () => {
    if (isAllUserSelected) {
      fetchPcData(true);
    } else {
      fetchPcData();
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDepartmentsData = async () => {
      if (departments.length > 0) return;
      try {
        dispatchBusy({ isBusy: true });
        let config = getConfiguration();
        let api = new TicketDepartmentsApi(config);
        let response = await api.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();
        setDepartments(response.data);
      } catch (error) {
        console.log("error", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchDepartmentsData();
  }, []);

  useEffect(() => {
    const fetchUsersData = async () => {
      if (!selectedDepartment) {
        setUserData([]);
        return;
      }
      if (selectedDepartment) setUserData([]);
      if (selectedDepartment && selectedUser) setSelectedUser([]);
      try {
        dispatchBusy({ isBusy: true });
        let config = getConfiguration();
        let api = new UserApi(config);
        let response = await api.apiUserVesaUsersWithoutPhotoGet(selectedDepartment.id);
        console.log("response", response.data);
        setUserData(response.data);
      } catch (error) {
        console.log("error", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchUsersData();
  }, [selectedDepartment]);

  useEffect(() => {
    console.log("isAllUserSelected", isAllUserSelected);
    if (isAllUserSelected) {
      setSelectedDepartment(null);
      setSelectedUser([]);
      setUserData([]);
    }
  }, [isAllUserSelected]);

  // ── Date helpers ─────────────────────────────────────────────────────────────

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-");
    if (year && month && day) setSelectedDate(`${day}.${month}.${year}`);
    else setSelectedDate("");
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-");
    if (year && month && day) setSelectedEndDate(`${day}.${month}.${year}`);
    else setSelectedEndDate("");
  };

  // Convert stored dd.mm.yyyy back to yyyy-mm-dd for native input value
  const toNativeDate = (ddmmyyyy: string) => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split(".");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="space-y-4 mt-2 mx-1">

        {/* ── Page title ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shrink-0">
            <MonitorDot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800 leading-tight">
              Bilgisayar Takip Paneli
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">PC oturum ve aktivite verilerini filtreleyin</p>
          </div>
        </div>

        {/* ── Filters card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Filtreler</h2>
            <span className="text-xs text-slate-400">(Aktiflik durumu default olarak filtrelenmiş gelecektir)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1 — User/Dept */}
            <div className="space-y-4">
              {!isAllUserSelected && (
                <>
                  <SearchableSelect
                    options={departments}
                    value={selectedDepartment}
                    onChange={(val) => setSelectedDepartment(val ?? undefined)}
                    getLabel={(o) => o.departmentText ?? ""}
                    label="Departman"
                    placeholder="Departman seçiniz..."
                  />
                  <UserMultiSelect
                    options={userData}
                    value={selectedUser}
                    onChange={setSelectedUser}
                  />
                </>
              )}

              {/* "Tüm Vesa" toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none mt-2">
                <div
                  role="switch"
                  aria-checked={isAllUserSelected}
                  tabIndex={0}
                  onClick={() => setIsAllUserSelected(!isAllUserSelected)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") setIsAllUserSelected((v) => !v);
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer",
                    isAllUserSelected ? "bg-sky-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      isAllUserSelected ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">Tüm Vesa'yı Getir</span>
              </label>
            </div>

            {/* Column 2 — Dates */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={toNativeDate(selectedDate)}
                  onChange={handleStartDateChange}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={toNativeDate(selectedEndDate)}
                  onChange={handleEndDateChange}
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            {/* Column 3 — Hour range */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Saat Aralığı
                </label>
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  {hourRange[0]}:00 — {hourRange[1]}:00
                </span>
              </div>

              {/* Start hour slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Başlangıç: {hourRange[0]}:00</span>
                  <span>0 — {hourRange[1]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={hourRange[1]}
                  step={1}
                  value={hourRange[0]}
                  onChange={(e) =>
                    handleHourRangeChange(new Event("change"), [+e.target.value, hourRange[1]])
                  }
                  className="w-full h-2 accent-sky-600 cursor-pointer"
                />
              </div>

              {/* End hour slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Bitiş: {hourRange[1]}:00</span>
                  <span>{hourRange[0]} — 24</span>
                </div>
                <input
                  type="range"
                  min={hourRange[0]}
                  max={24}
                  step={1}
                  value={hourRange[1]}
                  onChange={(e) =>
                    handleHourRangeChange(new Event("change"), [hourRange[0], +e.target.value])
                  }
                  className="w-full h-2 accent-sky-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Fetch button */}
          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={handleFetchData}
              className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Verileri Getir
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setActiveIndex(idx); console.log("e", idx); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeIndex === idx
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── List View (activeIndex === 1) ── */}
        {activeIndex === 1 && (
          <div>
            {/* Toggle buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={handleToggleFirstData}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                  showOnlyFirstData
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <List className="w-4 h-4" />
                {showOnlyFirstData ? "Tüm Verileri Göster" : "Her Kullanıcının İlk Verisini Göster"}
              </button>
              <button
                type="button"
                onClick={handleToggleActive}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                  showOnlyActive
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {showOnlyActive ? "Aktiflik Durumunu Göster" : "Aktiflik Durumunu Gizle"}
              </button>
            </div>

            {filteredPcData.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
                {filteredPcData.map((ud, userIndex) => (
                  <div
                    key={`user-${ud.user.id}-${userIndex}`}
                    className={cn(
                      "pb-5",
                      userIndex < filteredPcData.length - 1 && "border-b border-slate-100"
                    )}
                  >
                    {/* User header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitials(ud.user.firstName, ud.user.lastName)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-800">
                          {ud.user.firstName} {ud.user.lastName}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">({ud.user.userName})</span>
                      </div>
                    </div>

                    {ud.logins && ud.logins.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {ud.logins.map((login: PcTrackGraphicDto, loginIndex: number) => {
                          const status = getPCStatus(login.loginType);
                          return (
                            <div
                              key={`login-${loginIndex}`}
                              className="min-w-[260px] max-w-[260px] border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 shrink-0"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                  Bilgisayar Adı
                                </span>
                                <span className="text-xs font-bold text-slate-800">{login.pCname}</span>
                              </div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-500">{getLoginTypeLabel(login.loginType)}</span>
                                <span className="text-xs text-slate-700">
                                  {new Date(login.adjustedProcessTime).toLocaleString("tr-TR")}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                    STATUS_STYLE[status.color] ?? STATUS_STYLE.default
                                  )}
                                >
                                  <StatusIcon loginType={login.loginType} />
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-700 font-medium">
                          Kullanıcı için aktif veri bulunamadı
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">Sonuç bulunamadı</h3>
                <p className="text-sm text-slate-400">
                  Lütfen filtreleri düzenleyin ve &ldquo;Verileri Getir&rdquo; butonuna tıklayın
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Table View (activeIndex === 0) ── */}
        {activeIndex === 0 && (
          <div>
            {filteredTableData.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <h2 className="text-sm font-semibold text-slate-700">Oturum Verileri Tablosu</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-sky-500" />
                            Kullanıcı
                          </div>
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-slate-500" />
                            Bilgisayar Adı
                          </div>
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Oturum Zamanı
                          </div>
                        </th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            Durum
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredTableData.map((ud) =>
                        ud.logins.map((login, loginIndex) => {
                          const status = getPCStatus(login.loginType);
                          return (
                            <tr
                              key={`${ud.user.id}-${loginIndex}`}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {getInitials(ud.user.firstName, ud.user.lastName)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">
                                      {ud.user.firstName} {ud.user.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400">({ud.user.userName})</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-sm text-slate-700">{login.pCname}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="text-sm text-slate-700">
                                    {new Date(login.adjustedProcessTime).toLocaleString("tr-TR")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-center">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                    STATUS_STYLE[status.color] ?? STATUS_STYLE.default
                                  )}
                                >
                                  <StatusIcon loginType={login.loginType} />
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <TableIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">Tablo Görünümü</h3>
                <p className="text-sm text-slate-400">
                  Oturum verilerini görüntülemek için filtreleri ayarlayın ve Verileri Getir butonuna tıklayın
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PCTrackingManagement;
