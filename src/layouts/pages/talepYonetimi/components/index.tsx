import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DepartmentsApi,
  TicketApi,
  UserApi,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
  TicketTeamApi,
  TicketTeamListDto,
  WorkCompanyApi,
  WorkCompanyDto,
  UserAppDtoOnlyNameId,
  TicketProjectsListDto,
  TicketProjectsApi,
} from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import GlobalCell from "../allTickets/tableData/globalCell";
import HistoryDialog from "components/HistoryDialog/HistoryDialog";
import ShowHistory from "layouts/pages/WorkFlow/ShowHistory";
import { cn } from "lib/utils";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";

import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  FileDown,
  Filter,
  X,
  Check,
  ChevronsUpDown,
  Save,
  Trash2,
  History,
  Eye,
  Pencil,
  BookmarkPlus,
  RotateCcw,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssigneeType {
  id: number;
  name: string;
}

interface TableFilters {
  company: string;
  creator: string;
  assignee: string;
  startDate: string;
  endDate: string;
  assignedTeam: string;
  assignedUser: string[];
  status: string[];
  type: string;
  customer: string;
  closeInc: boolean;
  title: string;
  department: string[];
  ticketProject: string[];
}

interface NamedCache {
  name: string;
  filters: TableFilters;
  selectedAssigneeType: AssigneeType | null;
  checkBox: boolean;
}

interface FilterTableMethodProps {
  ticketRowData: any[];
  setFilteredData: (data: any[]) => void;
  pageDesc: string;
  isSolveAllTicket?: boolean;
  handleSearch?: (data: any[]) => void;
  isrefresh?: boolean;
  setisrefresh?: (data: boolean) => void;
  skip?: number;
  top?: number;
  setPageCount?: (count: number) => void;
  setTotalCount?: (count: number) => void;
  excelAndGraphicData?: (data: any) => void;
  createGraph?: boolean;
  setcreateGraph?: (data: boolean) => void;
  setgraphicData?: (data: any[]) => void;
  onlyAll?: boolean;
  fromDashboard?: {
    workCompanyId: string;
    workCompanyName: string;
    projectId: string;
    projectName: string;
    projectSubName: string;
  };
}

// ---------------------------------------------------------------------------
// Normalizers (business logic — unchanged)
// ---------------------------------------------------------------------------

function defaultTableFilters(onlyAll?: boolean): TableFilters {
  return {
    company: "",
    creator: "",
    assignee: "",
    startDate: "",
    endDate: "",
    assignedTeam: "",
    assignedUser: [],
    status: onlyAll ? ["2"] : ["1", "2", "3", "4", "5", "6", "7", "8"],
    type: "",
    customer: "",
    closeInc: false,
    title: "",
    department: [],
    ticketProject: [],
  };
}

function normalizeAssignedUser(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter((s) => s.length > 0);
  if (typeof value === "string" && value.trim() !== "") return [value.trim()];
  return [];
}

function normalizeStringArrayField(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter((s) => s.length > 0);
  if (typeof value === "string" && value.trim() !== "") return [value.trim()];
  return [];
}

function normalizeTableFilters(raw: unknown, onlyAll?: boolean): TableFilters {
  const defaults = defaultTableFilters(onlyAll);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const o = raw as Record<string, unknown>;
  const status =
    "status" in o
      ? Array.isArray(o.status)
        ? o.status.map(String)
        : typeof o.status === "string" && o.status.trim() !== ""
          ? [o.status.trim()]
          : []
      : defaults.status;
  return {
    ...defaults,
    company: typeof o.company === "string" ? o.company : defaults.company,
    creator: typeof o.creator === "string" ? o.creator : defaults.creator,
    assignee: typeof o.assignee === "string" ? o.assignee : defaults.assignee,
    startDate: typeof o.startDate === "string" ? o.startDate : defaults.startDate,
    endDate: typeof o.endDate === "string" ? o.endDate : defaults.endDate,
    assignedTeam: typeof o.assignedTeam === "string" ? o.assignedTeam : defaults.assignedTeam,
    assignedUser: normalizeAssignedUser(o.assignedUser),
    status,
    type: typeof o.type === "string" ? o.type : defaults.type,
    customer: typeof o.customer === "string" ? o.customer : defaults.customer,
    closeInc: typeof o.closeInc === "boolean" ? o.closeInc : defaults.closeInc,
    title: typeof o.title === "string" ? o.title : defaults.title,
    department: "department" in o ? normalizeStringArrayField(o.department) : defaults.department,
    ticketProject: "ticketProject" in o ? normalizeStringArrayField(o.ticketProject) : defaults.ticketProject,
  };
}

function normalizeAssigneeType(raw: unknown): AssigneeType | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === "number" && typeof o.name === "string") return { id: o.id, name: o.name };
  return null;
}

function normalizeNamedCache(raw: unknown, onlyAll?: boolean): NamedCache | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== "string" || !o.name.trim()) return null;
  return {
    name: o.name.trim(),
    filters: normalizeTableFilters(o.filters, onlyAll),
    selectedAssigneeType: normalizeAssigneeType(o.selectedAssigneeType),
    checkBox: typeof o.checkBox === "boolean" ? o.checkBox : false,
  };
}

function loadSavedFiltersFromStorage(onlyAll?: boolean): NamedCache[] {
  try {
    const saved = localStorage.getItem("savedFilters");
    if (!saved) return [];
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) { localStorage.removeItem("savedFilters"); return []; }
    const normalized = parsed.map((item) => normalizeNamedCache(item, onlyAll)).filter((x): x is NamedCache => x !== null);
    localStorage.setItem("savedFilters", JSON.stringify(normalized));
    return normalized;
  } catch {
    localStorage.removeItem("savedFilters");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Primitive UI sub-components
// ---------------------------------------------------------------------------

const FilterField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-none">
      {label}
    </label>
    {children}
  </div>
);

// Single-select combobox (replaces MUI Autocomplete single)
interface ComboboxProps<T> {
  options: T[];
  value: string | null;
  onChange: (val: string | null) => void;
  getOptionValue: (o: T) => string;
  getOptionLabel: (o: T) => string;
  placeholder?: string;
  disabled?: boolean;
}

function Combobox<T>({
  options, value, onChange, getOptionValue, getOptionLabel,
  placeholder = "Seçiniz...", disabled,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => getOptionValue(o) === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
            "focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-150 hover:border-slate-300"
          )}
        >
          <span className={cn("truncate", !selected && "text-slate-400")}>
            {selected ? getOptionLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        style={{ width: "var(--radix-popover-trigger-width)" }}
        className="p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Ara..." />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(null); setOpen(false); }}
                  className="text-slate-400 text-xs"
                >
                  <X className="mr-2 h-3 w-3" />
                  Temizle
                </CommandItem>
              )}
              {options.map((option) => {
                const v = getOptionValue(option);
                return (
                  <CommandItem
                    key={v}
                    value={getOptionLabel(option)}
                    onSelect={() => { onChange(v); setOpen(false); }}
                    data-checked={value === v}
                  >
                    <Check className={cn("mr-2 h-3.5 w-3.5", value === v ? "opacity-100" : "opacity-0")} />
                    {getOptionLabel(option)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Multi-select combobox (replaces MUI Autocomplete multiple)
interface MultiComboboxProps<T> {
  options: T[];
  values: string[];
  onChange: (vals: string[]) => void;
  getOptionValue: (o: T) => string;
  getOptionLabel: (o: T) => string;
  placeholder?: string;
}

function MultiCombobox<T>({
  options, values, onChange, getOptionValue, getOptionLabel,
  placeholder = "Seçiniz...",
}: MultiComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const handleToggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const selectedOptions = options.filter((o) => values.includes(getOptionValue(o)));

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
              "focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
              "transition-all duration-150 hover:border-slate-300"
            )}
          >
            <span className={cn("truncate", selectedOptions.length === 0 && "text-slate-400")}>
              {selectedOptions.length === 0
                ? placeholder
                : `${selectedOptions.length} seçili`}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className="p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Ara..." />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const v = getOptionValue(option);
                  const checked = values.includes(v);
                  return (
                    <CommandItem
                      key={v}
                      value={getOptionLabel(option)}
                      onSelect={() => handleToggle(v)}
                      data-checked={checked}
                    >
                      <Check className={cn("mr-2 h-3.5 w-3.5", checked ? "opacity-100" : "opacity-0")} />
                      {getOptionLabel(option)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => {
            const v = getOptionValue(option);
            return (
              <Badge key={v} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                {getOptionLabel(option)}
                <button
                  type="button"
                  onClick={() => handleToggle(v)}
                  aria-label={`${getOptionLabel(option)} kaldır`}
                  className="ml-0.5 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Tooltip-wrapped icon button (search dialog actions)
interface TipBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tip: string;
  variant?: "default" | "danger";
}

const TipBtn = ({ tip, variant = "default", className, children, ...props }: TipBtnProps) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={tip}
        className={cn(
          "inline-flex items-center justify-center rounded-lg w-7 h-7 transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          variant === "danger"
            ? "text-rose-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-rose-300"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent sideOffset={6}>{tip}</TooltipContent>
  </Tooltip>
);


const SearchResultsTable = ({
  rows,
  pageDesc,
  onAprHistory,
  onTicketHistory,
  onView,
  onEdit,
}: {
  rows: any[];
  pageDesc: string;
  onAprHistory: (id: string) => void;
  onTicketHistory: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  if (rows.length === 0) return null;

  const cols: { key: string; label: string }[] = [
    { key: "ticketNumber", label: "Talep No" },
    { key: "statusText", label: "Durum" },
    { key: "title", label: "Başlık" },
    { key: "customerRefName", label: "Müşteri" },
    { key: "ticketAssigneText", label: "Atanan" },
    { key: "userAppName", label: "Oluşturan" },
    { key: "createdDate", label: "Tarih" },
    { key: "ticketDepartmentText", label: "Departman" },
  ];

  return (
    <Table className="min-w-[700px]">
      <TableHeader className="sticky top-0 z-10 bg-slate-50">
        <TableRow className="border-b border-slate-200 hover:bg-slate-50">
          <TableHead className="px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap w-36">
            İşlemler
          </TableHead>
          {cols.map((c) => (
            <TableHead
              key={c.key}
              className="px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap"
            >
              {c.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow
            key={i}
            className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
          >
            <TableCell className="px-4 py-2.5 align-middle">
              <div className="flex items-center gap-0.5">
                <TipBtn tip="Onay Geçmişi" onClick={() => onAprHistory(row.workFlowHeadId)}>
                  <History className="w-3.5 h-3.5" />
                </TipBtn>
                <TipBtn tip="Talep Geçmişi" onClick={() => onTicketHistory(row.id)}>
                  <Search className="w-3.5 h-3.5" />
                </TipBtn>
                <TipBtn tip="İncele" onClick={() => onView(row.id)}>
                  <Eye className="w-3.5 h-3.5" />
                </TipBtn>
                <TipBtn tip="Düzenle" onClick={() => onEdit(row.id)}>
                  <Pencil className="w-3.5 h-3.5" />
                </TipBtn>
              </div>
            </TableCell>
            {cols.map((c) => (
              <TableCell
                key={c.key}
                className="px-4 py-2.5 text-sm text-slate-700 align-middle whitespace-nowrap"
              >
                <GlobalCell value={row[c.key]} statusId={row.status} columnName={c.key} testRow={row} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function FilterTableMethod({
  ticketRowData,
  setFilteredData,
  pageDesc,
  isSolveAllTicket,
  handleSearch,
  isrefresh,
  setisrefresh,
  skip,
  top,
  setPageCount,
  setTotalCount,
  excelAndGraphicData,
  createGraph,
  setcreateGraph,
  setgraphicData,
  onlyAll,
  fromDashboard,
}: FilterTableMethodProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  // ── Lookup data ────────────────────────────────────────────────────────────
  const [companyData, setCompanyData] = useState<WorkCompanyDto[]>([]);
  const [teamData, setTeamData] = useState<TicketTeamListDto[]>([]);
  const [userData, setUserData] = useState<UserAppDtoOnlyNameId[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [creatorData, setCreatorData] = useState<UserAppDtoOnlyNameId[]>([]);
  const [departmentData, setDepartmentData] = useState<TicketDepartmensListDto[]>([]);
  const [ticketProjectData, setTicketProjectData] = useState<TicketProjectsListDto[]>([]);

  const assigneeTypeData: AssigneeType[] = [
    { id: 1, name: "Kullanıcı" },
    { id: 2, name: "Takım" },
    { id: 999999, name: "Atama Yok" },
  ];

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<TableFilters>({
    company: "",
    creator: "",
    assignee: "",
    startDate: "",
    endDate: "",
    assignedTeam: "",
    assignedUser: [],
    status: onlyAll ? ["2"] : ["1", "2", "3", "4", "5", "6", "7", "8"],
    type: "",
    customer: "",
    closeInc: false,
    title: "",
    department: [],
    ticketProject: [],
  });
  const [selectedAssigneeType, setSelectedAssigneeType] = useState<AssigneeType | null>(null);
  const [checkBox, setCheckBox] = useState(false);
  const [isFirst, setIsFirst] = useState<boolean>(true);
  const [sendData, setSendData] = useState<any[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [savedFilters, setSavedFilters] = useState<NamedCache[]>([]);
  const [hasPerm, setHasPerm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginUserCompany, setLoginUserCompany] = useState("");
  const [excelData, setExcelData] = useState<any>(null);
  const [searchTalepBaslik, setSearchTalepBaslik] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Search dialog state ────────────────────────────────────────────────────
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchTalepNo, setSearchTalepNo] = useState("");
  const [searchedData, setSearchedData] = useState<any[]>([]);
  const [searchMsj, setSearchMsj] = useState("");
  const [selectedAprHis, setSelectedAprHis] = useState<any>(null);
  const [aprHistoryOpen, setAprHistoryOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // ── fromDashboard init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (fromDashboard?.workCompanyId && fromDashboard?.projectId) {
      setFilters((prev) => ({
        ...prev,
        customer: fromDashboard.workCompanyId,
        ticketProject: [fromDashboard.projectId],
      }));
    }
  }, []);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAllData = async () => {
      const conf = getConfiguration();
      const api2 = new WorkCompanyApi(conf);
      const data2 = await api2.apiWorkCompanyGet();
      setCompanyData(data2.data);

      const api3 = new TicketTeamApi(conf);
      const data3 = await api3.apiTicketTeamWithoutTeamGet(false);
      setTeamData(data3.data);

      const api4 = new TicketApi(conf);
      const response: any = await api4.apiTicketTicketStatusGet();

      const api5 = new UserApi(conf);
      const filterCheckData = await api5.apiUserCheckApplyDefaultFiltersGet();

      if (filterCheckData.data === true) {
        if (isSolveAllTicket) {
          setFilters((prev) => ({ ...prev, status: ["2", "4", "5", "6", "7", "8", "9", "10"] }));
        } else {
          setFilters((prev) => ({ ...prev, status: ["1", "2", "4", "5", "6", "7", "8", "9", "10", "12"] }));
        }
      }

      const filteredData = isSolveAllTicket
        ? response.data.filter((item: any) => item.id !== 12 && item.id !== 1)
        : response.data;
      setStatusData(filteredData);

      const data5 = await api4.apiTicketTicketTypeGet();
      setTypeData(data5.data as any);

      const data6 = await api5.apiUserGetAllUsersNameIdOnlyGet();
      setCreatorData(data6.data);
      setUserData(data6.data);

      const permData = await api4.apiTicketCheckOthercompanypermGet();
      setHasPerm(permData.data.perm);

      const permData2 = await api5.apiUserCheckIsAdminGet();
      setIsAdmin(permData2.data);

      if (permData.data.perm === false) {
        const userData = await api5.apiUserUserCompanyGet();
        setFilters((prev) => ({ ...prev, company: userData.data.workCompanyId }));
        setLoginUserCompany(userData.data.workCompanyId);
      }
    };

    const fetchDepartments = async () => {
      const conf = getConfiguration();
      const api = new TicketDepartmentsApi(conf);
      const data = await api.apiTicketDepartmentsGetAllVisibleDepartmentsGet();
      setDepartmentData(data.data);
    };

    const fetchTicketProjectsData = async () => {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsGetActiveProjectsGet();
      setTicketProjectData(data.data as any);
      dispatchBusy({ isBusy: false });
    };

    fetchAllData();
    fetchDepartments();
    fetchTicketProjectsData();
  }, []);

  useEffect(() => {
    setFilteredData(ticketRowData);
  }, [ticketRowData, setFilteredData]);

  useEffect(() => {
    if (filters.startDate !== "" && filters.endDate !== "" && filters.status.length > 0 && isFirst) {
      sendFilter();
      setIsFirst(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isrefresh) {
      sendFilter();
      setisrefresh(false);
      handleSearch(sendData);
    }
  }, [isrefresh]);

  useEffect(() => {
    setSavedFilters(loadSavedFiltersFromStorage(onlyAll));
  }, [onlyAll]);

  useEffect(() => {
    if (createGraph) {
      sendFilter();
      setcreateGraph(false);
      getExcelAndGraphicData();
    }
  }, [createGraph]);

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterChange = (field: keyof TableFilters, value: any) => {
    if (field === "assignedUser") {
      setFilters((prev) => ({ ...prev, assignedTeam: "", assignedUser: Array.isArray(value) ? value : [] }));
    } else if (field === "assignedTeam") {
      setFilters((prev) => ({ ...prev, assignedUser: [], assignedTeam: value || "" }));
    } else if (field === "status") {
      setFilters((prev) => ({ ...prev, [field]: value || [] }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value || "" }));
    }
  };

  const saveFiltersToCache = () => {
    localStorage.setItem("filterCache", JSON.stringify({
      filters: normalizeTableFilters(filters, onlyAll),
      selectedAssigneeType,
      checkBox,
    }));
  };

  const sendFilter = async () => {
    try {
      dispatchBusy({ isBusy: true });

      if (isFirst) {
        const conf = getConfiguration();
        const api5 = new UserApi(conf);
        const filterCheckData = await api5.apiUserCheckApplyDefaultFiltersGet();
        if (filterCheckData.data === true) {
          filters.status = isSolveAllTicket
            ? ["2", "4", "5", "6", "7", "8", "9", "10"]
            : ["1", "2", "4", "5", "6", "7", "8", "9", "10", "12"];
        }
        setIsFirst(false);

        const api4 = new TicketApi(conf);
        const permData = await api4.apiTicketCheckOthercompanypermGet();
        setHasPerm(permData.data.perm);

        const permData2 = await api5.apiUserCheckIsAdminGet();
        setIsAdmin(permData2.data);

        if (permData.data.perm === false) {
          const ud = await api5.apiUserUserCompanyGet();
          filters.company = ud.data.workCompanyId;
          setLoginUserCompany(ud.data.workCompanyId);
        }
      }

      const formattedData: TableFilters = {
        ...filters,
        endDate: filters.endDate.replaceAll("-", ""),
        startDate: filters.startDate.replaceAll("-", ""),
      };

      if (selectedAssigneeType?.name === "Atama Yok") {
        formattedData.assignedUser = [selectedAssigneeType!.id.toString()];
      }

      const assignedUserQuery = formattedData.assignedUser.length > 0 ? formattedData.assignedUser : undefined;

      const conf = getConfiguration();
      const api = new TicketApi(conf);
      const data = await api.apiTicketFilteredAllTicketsGet(
        skip, top, pageDesc,
        formattedData.status, formattedData.company,
        assignedUserQuery, formattedData.assignedTeam,
        formattedData.type, formattedData.endDate, formattedData.startDate,
        formattedData.creator, formattedData.customer,
        checkBox, formattedData.title,
        formattedData.department, formattedData.ticketProject
      );

      setFilteredData(data.data.ticketList);
      setSendData(data.data.ticketList);
      setTotalCount(data.data.count!);
      setPageCount(Math.ceil(data.data.count! / top));
      setisrefresh(false);
      saveFiltersToCache();
    } catch (error) {
      console.error(error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const filterButton = async () => {
    skip = 0;
    await sendFilter();
  };

  const clearFilters = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const empty: TableFilters = {
        company: loginUserCompany === "" ? "" : loginUserCompany,
        creator: "", assignee: "", startDate: "", endDate: "",
        assignedTeam: "", assignedUser: [], status: [], type: "",
        customer: "", closeInc: false, title: "", department: [], ticketProject: [],
      };
      setFilters(empty);
      setSearchTalepBaslik("");

      const conf = getConfiguration();
      const api = new TicketApi(conf);
      skip = 0;

      const data = await api.apiTicketFilteredAllTicketsGet(
        0, top, pageDesc, [], loginUserCompany === "" ? "" : loginUserCompany,
        undefined, "", "", "", "", "", "", checkBox, "", [], []
      );

      setFilteredData(data.data.ticketList);
      setSelectedAssigneeType(null);
      setTotalCount(data.data.count!);
      setPageCount(Math.ceil(data.data.count! / top));
      localStorage.removeItem("filterCache");
    } catch (error) {
      console.error(error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const addCache = () => {
    if (!filterName) return;
    const newCache: NamedCache = {
      name: filterName.trim(),
      filters: normalizeTableFilters(filters, onlyAll),
      selectedAssigneeType,
      checkBox,
    };
    const updated = [...savedFilters, newCache];
    setSavedFilters(updated);
    localStorage.setItem("savedFilters", JSON.stringify(updated));
    setFilterName("");
  };

  const deleteSavedFilter = (filterToDelete: NamedCache) => {
    const updated = savedFilters.filter((f) => f.name !== filterToDelete.name);
    setSavedFilters(updated);
    localStorage.setItem("savedFilters", JSON.stringify(updated));
  };

  const isAnyFilterActive = () =>
    Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== "")) ||
    selectedAssigneeType !== null;

  const getExcelAndGraphicData = async () => {
    try {
      const formattedData: TableFilters = {
        ...filters,
        endDate: filters.endDate.replaceAll("-", ""),
        startDate: filters.startDate.replaceAll("-", ""),
      };
      if (selectedAssigneeType?.name === "Atama Yok") {
        formattedData.assignedUser = [selectedAssigneeType!.id.toString()];
      }
      const assignedUserExcel = formattedData.assignedUser.length > 0 ? formattedData.assignedUser : undefined;
      const conf = getConfiguration();
      const api = new TicketApi(conf);
      const res = await api.apiTicketExcelExportGet(
        pageDesc, formattedData.status, formattedData.company,
        assignedUserExcel, formattedData.assignedTeam, formattedData.type,
        formattedData.endDate, formattedData.startDate, formattedData.creator,
        formattedData.customer, checkBox, formattedData.title,
        formattedData.department, formattedData.ticketProject
      );
      setExcelData(res.data.excelData);
      setgraphicData(res.data.graphicData);
    } catch (error) {
      console.error(error);
    }
  };

  const exportCsv = async () => {
    try {
      const formattedData: TableFilters = {
        ...filters,
        endDate: filters.endDate.replaceAll("-", ""),
        startDate: filters.startDate.replaceAll("-", ""),
      };
      if (selectedAssigneeType?.name === "Atama Yok") {
        formattedData.assignedUser = [selectedAssigneeType!.id.toString()];
      }
      const assignedUserExport = formattedData.assignedUser.length > 0 ? formattedData.assignedUser : undefined;
      const conf = getConfiguration();
      const api = new TicketApi(conf);
      const res = await api.apiTicketExcelExportGet(
        pageDesc, formattedData.status, formattedData.company,
        assignedUserExport, formattedData.assignedTeam, formattedData.type,
        formattedData.endDate, formattedData.startDate, formattedData.creator,
        formattedData.customer, checkBox, formattedData.title,
        formattedData.department, formattedData.ticketProject
      );
      setExcelData(res.data.excelData);
      const data = res.data.excelData as any;
      const byteCharacters = atob(data.fileContents);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.contentType });
      const fileName = `talep-listesi-${new Date().toLocaleDateString("tr-TR")}.xlsx`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
    }
  };

  const onCloseSearchDialog = () => {
    setOpenSearchDialog(false);
    setSearchTalepNo("");
    setSearchedData([]);
    setSearchMsj("");
  };

  const onSearchButton = async () => {
    if (!searchTalepNo) {
      dispatchAlert({ message: "Lütfen talep numarası girin..!", type: "Warning" });
      return;
    }
    setLoading(true);
    const conf = getConfiguration();
    const api = new TicketApi(conf);
    const data = await api.apiTicketSearchTicketGet(pageDesc, searchTalepNo, skip, 10);
    setSearchedData(data.data.ticketList);
    setSearchMsj(data.data.ticketList.length === 0 ? "Girilen talep numarasına ait kayıt bulunamadı." : "");
    setLoading(false);
  };

  const handleSearchNavigate = (id: string, review: boolean) => {
    sessionStorage.setItem("ticketId", id);
    if (pageDesc === "solveAllTicket") {
      navigate("/solveAllTicket/solveTicket", { state: { ticketId: id, review } });
    } else {
      navigate("/tickets/detail/", { state: { ticketId: id, review } });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={150}>
      <div className="px-4 py-3 w-full">

        {/* ── Top action bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-2 h-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showFilters
              ? t("ns1:TicketPage.TicketTablePage.FiltreleriGizle")
              : t("ns1:TicketPage.TicketTablePage.FiltreleriGoster")}
            {showFilters
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenSearchDialog(true)}
            className="gap-2 h-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          >
            <Search className="w-3.5 h-3.5" />
            {t("ns1:TicketPage.TicketTablePage.AramaYap")}
          </Button>

          {isSolveAllTicket && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              className="gap-2 h-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            >
              <FileDown className="w-3.5 h-3.5" />
              {t("ns1:TicketPage.TicketTablePage.TalepListesiniIndir")}
            </Button>
          )}
        </div>

        {/* ── Collapsible filter panel ── */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            showFilters ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-4">

            {/* Row 1: Filter name + Saved filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.FiltreAdi")}>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.FiltreAdiPlaceholder")}
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCache()}
                    className="rounded-xl border-slate-200 bg-white focus-visible:border-slate-400 focus-visible:ring-slate-100"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addCache}
                    disabled={!filterName.trim()}
                    className="shrink-0 h-9 w-9 border-slate-200 hover:bg-slate-50"
                    aria-label={t("ns1:TicketPage.TicketTablePage.FilterProps.FiltreKaydet")}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </Button>
                </div>
              </FilterField>

              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.KayitliFiltreler")}>
                {savedFilters.length === 0 ? (
                  <div className="flex h-9 items-center rounded-xl border border-dashed border-slate-200 px-3 text-sm text-slate-400">
                    Kayıtlı filtre yok
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
                          "focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all hover:border-slate-300"
                        )}
                      >
                        <span className="text-slate-400">
                          {t("ns1:TicketPage.TicketTablePage.FilterProps.KayitliFiltrelerPlaceholder")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      style={{ width: "var(--radix-popover-trigger-width)" }}
                      className="p-1"
                      align="start"
                    >
                      <div className="flex flex-col gap-0.5">
                        {savedFilters.map((sf) => (
                          <div
                            key={sf.name}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 cursor-pointer group"
                            onClick={() => {
                              const nextFilters = normalizeTableFilters(sf.filters, onlyAll);
                              const nextAssignee = normalizeAssigneeType(sf.selectedAssigneeType);
                              const nextCheck = typeof sf.checkBox === "boolean" ? sf.checkBox : false;
                              setFilters(nextFilters);
                              setSelectedAssigneeType(nextAssignee);
                              setCheckBox(nextCheck);
                              localStorage.setItem("filterCache", JSON.stringify({
                                filters: nextFilters,
                                selectedAssigneeType: nextAssignee,
                                checkBox: nextCheck,
                              }));
                            }}
                          >
                            <span className="text-sm text-slate-700">{sf.name}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); deleteSavedFilter(sf); }}
                              aria-label={`${sf.name} filtresi sil`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-600 rounded p-0.5 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </FilterField>
            </div>

            {/* Row 2: Assignee type + Assignee detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.AtananTipi")}>
                <Combobox
                  options={assigneeTypeData}
                  value={selectedAssigneeType ? String(selectedAssigneeType.id) : null}
                  onChange={(val) => {
                    if (!val) {
                      setSelectedAssigneeType(null);
                      setFilters((prev) => ({ ...prev, assignedUser: [], assignedTeam: "" }));
                    } else {
                      const found = assigneeTypeData.find((a) => String(a.id) === val);
                      setSelectedAssigneeType(found ?? null);
                    }
                  }}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.name}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.AtananTipiPlaceholder")}
                />
              </FilterField>

              {selectedAssigneeType?.name === "Kullanıcı" ? (
                <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.AtananKullanici")}>
                  <MultiCombobox
                    options={userData}
                    values={filters.assignedUser}
                    onChange={(vals) => handleFilterChange("assignedUser", vals)}
                    getOptionValue={(o) => String(o.id)}
                    getOptionLabel={(o) => `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim()}
                    placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.AtananKullaniciPlaceholder")}
                  />
                </FilterField>
              ) : selectedAssigneeType?.name === "Takım" ? (
                <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.AtananTakim")}>
                  <Combobox
                    options={teamData}
                    value={filters.assignedTeam || null}
                    onChange={(val) => handleFilterChange("assignedTeam", val)}
                    getOptionValue={(o) => String(o.id)}
                    getOptionLabel={(o) => o.name || ""}
                    placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.AtananTakimPlaceholder")}
                  />
                </FilterField>
              ) : (
                <div />
              )}
            </div>

            {/* Row 3: Company + Creator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.TalebiAcanSirket")}>
                <Combobox
                  options={companyData}
                  value={filters.company || null}
                  onChange={(val) => handleFilterChange("company", val)}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.name || ""}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.TalebiAcanSirketPlaceholder")}
                  disabled={!hasPerm && !isAdmin}
                />
              </FilterField>

              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.Olusturan")}>
                <Combobox
                  options={creatorData}
                  value={filters.creator || null}
                  onChange={(val) => handleFilterChange("creator", val ? creatorData.find((c) => String(c.id) === val)?.userName ?? val : "")}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim()}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.OlusturanPlaceholder")}
                />
              </FilterField>
            </div>

            {/* Row 4: Status (full width) */}
            <div className="grid grid-cols-1 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.Durum")}>
                <MultiCombobox
                  options={statusData}
                  values={filters.status}
                  onChange={(vals) => handleFilterChange("status", vals)}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.description || ""}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.DurumPlaceholder")}
                />
              </FilterField>
            </div>

            {/* Row 5: Department + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.Departman")}>
                <MultiCombobox
                  options={departmentData}
                  values={filters.department}
                  onChange={(vals) => handleFilterChange("department", vals)}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.departmentText || ""}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.DepartmanPlaceholder")}
                />
              </FilterField>

              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.Tip")}>
                <Combobox
                  options={typeData}
                  value={filters.type || null}
                  onChange={(val) => handleFilterChange("type", val)}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.description || ""}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.TipPlaceholder")}
                />
              </FilterField>
            </div>

            {/* Row 6: Customer + Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.Musteri")}>
                <Combobox
                  options={companyData}
                  value={filters.customer || null}
                  onChange={(val) => handleFilterChange("customer", val)}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.name || ""}
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.MusteriPlaceholder")}
                />
              </FilterField>

              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.TalepBasligi")}>
                <Input
                  placeholder={t("ns1:TicketPage.TicketTablePage.FilterProps.TalepBasligiPlaceholder")}
                  value={searchTalepBaslik}
                  onChange={(e) => {
                    setSearchTalepBaslik(e.target.value);
                    handleFilterChange("title", e.target.value || null);
                  }}
                  className="rounded-xl border-slate-200 bg-white focus-visible:border-slate-400 focus-visible:ring-slate-100"
                />
              </FilterField>
            </div>

            {/* Row 7: Start date + End date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.BaslangicTarihi")}>
                <Input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="rounded-xl border-slate-200 bg-white focus-visible:border-slate-400 focus-visible:ring-slate-100"
                />
              </FilterField>

              <FilterField label={t("ns1:TicketPage.TicketTablePage.FilterProps.BitisTarihi")}>
                <Input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="rounded-xl border-slate-200 bg-white focus-visible:border-slate-400 focus-visible:ring-slate-100"
                />
              </FilterField>
            </div>

            {/* Row 8: Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FilterField label="Proje">
                <MultiCombobox
                  options={ticketProjectData}
                  values={filters.ticketProject}
                  onChange={(vals) => handleFilterChange("ticketProject", vals)}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) =>
                    o.subProjectName ? `${o.name} - ${o.subProjectName}` : (o.name ?? "")
                  }
                  placeholder="Proje Seçiniz"
                />
              </FilterField>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {isAnyFilterActive() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2 h-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t("ns1:TicketPage.TicketTablePage.FilterProps.FiltreleriTemizle")}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCache}
                  disabled={!filterName.trim()}
                  className="gap-2 h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {t("ns1:TicketPage.TicketTablePage.FilterProps.FiltreKaydet")}
                </Button>

                <Button
                  size="sm"
                  onClick={filterButton}
                  className="gap-2 h-8 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium shadow-sm shadow-[#3e5d8f]/25 transition-all"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {t("ns1:TicketPage.TicketTablePage.FilterProps.Filtrele")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Dialog ── */}
      <Dialog open={openSearchDialog} onOpenChange={(open) => !open && onCloseSearchDialog()}>
        <DialogContent className="w-[95vw] max-w-7xl p-0 gap-0 overflow-hidden sm:max-w-7xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <DialogTitle className="text-base font-semibold text-[#344767] tracking-tight">
              {t("ns1:TicketPage.TicketTablePage.AramaYapin")}
            </DialogTitle>
            <p className="text-sm text-slate-500 font-normal leading-relaxed pt-1">
              Talep numarası girerek arama yapabilirsiniz.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-6 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4 max-w-md">
              <FilterField label={t("ns1:TicketPage.TicketTablePage.TalepNumarasi")}>
                <Input
                  placeholder={t("ns1:TicketPage.TicketTablePage.TalepNumarasi")}
                  value={searchTalepNo}
                  onChange={(e) => {
                    setSearchTalepNo(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onSearchButton()}
                  className="h-10 rounded-xl border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-slate-100"
                />
              </FilterField>
            </div>

            {searchMsj && !loading && searchedData.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-600">{searchMsj}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Farklı bir talep numarası ile tekrar deneyebilirsiniz.
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-100 bg-white py-16">
                <Loader2 className="size-5 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Aranıyor...</p>
              </div>
            ) : searchedData.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Arama Sonuçları
                  </p>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {searchedData.length} kayıt
                  </span>
                </div>

                <div className="overflow-auto rounded-xl border border-slate-200 max-h-[60vh] shadow-sm">
                  <SearchResultsTable
                    rows={searchedData}
                    pageDesc={pageDesc}
                    onAprHistory={(id) => { setSelectedAprHis(id); setAprHistoryOpen(true); }}
                    onTicketHistory={(id) => { setSelectedTicket(id); setHistoryDialogOpen(true); }}
                    onView={(id) => handleSearchNavigate(id, true)}
                    onEdit={(id) => handleSearchNavigate(id, false)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 mb-1 py-3 border-t border-slate-100 bg-slate-50/60 gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseSearchDialog}
              className="h-9 gap-2 border-slate-200 text-slate-600 hover:bg-white"
            >
              {t("ns1:TicketPage.TicketTablePage.Kapat")}
            </Button>
            <Button
              size="sm"
              onClick={onSearchButton}
              className="h-9 gap-2 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium shadow-sm shadow-[#3e5d8f]/20"
            >
              <Search className="w-3.5 h-3.5" />
              {t("ns1:TicketPage.TicketTablePage.AramaYap")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Dialogs ── */}
      {historyDialogOpen && (
        <HistoryDialog
          ticketId={selectedTicket}
          isOpen={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
        />
      )}

      {aprHistoryOpen && (
        <ShowHistory
          approveId={selectedAprHis}
          open={aprHistoryOpen}
          onClose={() => setAprHistoryOpen(false)}
        />
      )}
    </TooltipProvider>
  );
}

export default FilterTableMethod;
