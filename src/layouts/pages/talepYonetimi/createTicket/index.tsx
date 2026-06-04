import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import "layouts/pages/teams/createTeam/index.css";
import {
  TicketApi,
  TicketDepartmentsApi,
  TicketInsertDto,
  TicketUpdateDto,
  TicketPriority,
  TicketSLA,
  TicketSubject,
  TicketTeamApi,
  TicketTeamListDto,
  TicketProjectsApi,
  TicketType,
  UserApi,
  UserAppDto,
  WorkCompanyApi,
  WorkCompanyDto,
  WorkCompanySystemInfoApi,
  WorkCompanySystemInfoListDto,
  TicketCommentInsertDto,
  TicketDepartmensListDto,
  TicketStatus,
  TicketManagerUpdateDto,
  UserApp,
  TicketProjectsListDto,
  TicketTaskListDto,
  TicketTaskUpdateDto,
} from "api/generated";

import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import TimelineComponent from "layouts/pages/Components/MessageBox/timeline";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./index.css";

import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { Textarea } from "components/ui/textarea";
import { Checkbox } from "components/ui/checkbox";
import { Label } from "components/ui/label";
import { Separator } from "components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
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
  Paperclip,
  Download,
  Trash2,
  ChevronsUpDown,
  Check,
  X,
  FileDown,
  ClipboardList,
  GitBranch,
  Settings2,
  CheckSquare,
  History,
  ChevronDown,
  Users,
  Building2,
  CalendarDays,
  FolderKanban,
  Tag,
  Zap,
  ShieldCheck,
  MessageSquare,
  Upload,
} from "lucide-react";

import TaskList from "./components/TaskList";
import UserSearchCombobox, { getUserDisplayName } from "./components/UserSearchCombobox";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface subjectHelp { id: TicketSubject; name: string; description: string; }
interface slaPlan { id: TicketSLA; name: string; description: string; }
interface ticketType { id: TicketType; name: string; description: string; }
interface ticketPriority { id: TicketPriority; name: string; description: string; }
interface statusData { id: TicketStatus; name: string; description: string; }

interface createTicketProps {
  idSolveTicket?: string;
  isSolveTicket?: boolean;
}

// ---------------------------------------------------------------------------
// Local UI sub-components
// ---------------------------------------------------------------------------

const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">
      {label}
      {required && <span className="ml-1 text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

const SectionCard = ({
  title,
  icon,
  children,
  className,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}
  >
    {(title || icon) && (
      <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-slate-50">
        {icon && (
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3e5d8f]/8 text-[#3e5d8f]/70">
            {icon}
          </div>
        )}
        {title && (
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
            {title}
          </h3>
        )}
      </div>
    )}
    {children}
  </div>
);

// Generic single-select combobox
interface ComboboxOption {
  value: string;
  label: string;
}

const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  disabled,
  noOptionsText = "Sonuç bulunamadı.",
}: {
  options: ComboboxOption[];
  value: string | null;
  onChange: (val: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  noOptionsText?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

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
            "focus:outline-none focus:border-[#3e5d8f]/40 focus:ring-2 focus:ring-[#3e5d8f]/8",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
            "transition-all duration-150 hover:border-slate-300 hover:bg-slate-50/50"
          )}
        >
          <span className={cn("truncate", !selected && "text-slate-400")}>
            {selected ? selected.label : placeholder}
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
            <CommandEmpty>{noOptionsText}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(null); setOpen(false); }}
                  className="text-slate-400 text-xs"
                >
                  <X className="mr-2 h-3 w-3" /> Temizle
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => { onChange(opt.value); setOpen(false); }}
                  data-checked={value === opt.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === opt.value ? "opacity-100 text-[#3e5d8f]" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Multi-user select with avatar (for "ilgili kişiler")
const MultiUserSearchCombobox = ({
  values,
  onChange,
  onSearch,
  results,
  placeholder,
}: {
  values: any[];
  onChange: (users: any[]) => void;
  onSearch: (q: string) => void;
  results: any[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);

  const handleToggle = (user: any) => {
    const exists = values.some((v) => v.id === user.id);
    onChange(exists ? values.filter((v) => v.id !== user.id) : [...values, user]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
              "focus:outline-none focus:border-[#3e5d8f]/40 focus:ring-2 focus:ring-[#3e5d8f]/8",
              "transition-all duration-150 hover:border-slate-300 hover:bg-slate-50/50"
            )}
          >
            <span className={cn("truncate", values.length === 0 && "text-slate-400")}>
              {values.length === 0 ? placeholder : `${values.length} kişi seçili`}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className="p-0"
          align="start"
        >
          <div className="p-2 pb-1">
            <Input
              autoFocus
              placeholder="İsim ile ara..."
              onChange={(e) => onSearch(e.target.value)}
              className="h-8 rounded-lg border-slate-200 text-sm"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {results.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">Aramak için yazın...</p>
            ) : (
              results.map((user) => {
                const isSelected = values.some((v) => v.id === user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleToggle(user)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-[#3e5d8f] bg-[#3e5d8f] text-white"
                          : "border-slate-200"
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    {user.photo ? (
                      <img
                        src={`data:image/png;base64,${user.photo}`}
                        alt={user.firstName}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3e5d8f]/10 text-[#3e5d8f] text-xs font-semibold">
                        {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="gap-1 pr-1 text-xs font-normal bg-[#3e5d8f]/8 text-[#3e5d8f] border border-[#3e5d8f]/15 hover:bg-[#3e5d8f]/12"
            >
              {getUserDisplayName(user) || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
              <button
                type="button"
                onClick={() => handleToggle(user)}
                aria-label="Kaldır"
                className="ml-0.5 rounded-full hover:bg-[#3e5d8f]/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// CC Email tag input
const CcEmailInput = ({
  emails,
  inputValue,
  onInputChange,
  onKeyDown,
  onRemove,
  disabled,
}: {
  emails: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
  disabled?: boolean;
}) => (
  <div
    className={cn(
      "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2",
      "focus-within:border-[#3e5d8f]/40 focus-within:ring-2 focus-within:ring-[#3e5d8f]/8",
      "transition-all"
    )}
  >
    {emails.map((email, i) => (
      <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs font-normal bg-slate-100 border border-slate-200">
        {email}
        {!disabled && (
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`${email} kaldır`}
            className="ml-0.5 rounded-full hover:bg-slate-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Badge>
    ))}
    <input
      type="text"
      disabled={disabled}
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={
        emails.length === 0
          ? "E-posta adresi ekle (Boşluk veya Enter ile onaylayın)"
          : "Ekle..."
      }
      className="flex-1 min-w-[200px] bg-transparent text-sm outline-none placeholder:text-slate-400"
    />
  </div>
);

// File item row
const FileItem = ({
  name,
  size,
  onDownload,
  onDelete,
  showDelete = true,
}: {
  name: string;
  size?: number;
  onDownload?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-4 py-2.5 transition-all hover:border-slate-200 hover:shadow-sm group">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3e5d8f]/8 text-[#3e5d8f]/70 shrink-0">
        <Paperclip className="h-3.5 w-3.5 rotate-45" />
      </div>
      <span className="text-sm text-slate-700 truncate">{name}</span>
      {size !== undefined && (
        <span className="text-xs text-slate-400 shrink-0">
          ({(size / 1024 / 1024).toFixed(2)} MB)
        </span>
      )}
    </div>
    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
          aria-label="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
      {onDownload && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDownload}
          className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-[#3e5d8f] rounded-lg"
          aria-label="İndir"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </div>
);

// Status color helper
const getStatusColor = (value: number): string => {
  const colors = [
    "#607D8B", "#4CAF50", "#3F51B5", "#2196F3", "#9C27B0",
    "#00BCD4", "#795548", "#ffaa00", "#009688", "#E91E63", "#df1c1a",
  ];
  return colors[(value - 1)] ?? "#94a3b8";
};

type TFn = (key: string) => string;

// Premium card-based timeline
const AssignTimeline = ({
  history,
  t,
}: {
  history: any[];
  t: TFn;
}) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <History className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-sm text-slate-400">
          {t("ns1:TicketDetailPage.TimeLine.TalepGeçmişiBulunmamaktadır")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((event, i) => (
        <div key={i} className="flex gap-3">
          {/* Connector line + dot */}
          <div className="flex flex-col items-center pt-3.5">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-3 w-3 shrink-0 rounded-full ring-[3px] ring-white shadow cursor-default z-10"
                    style={{ backgroundColor: getStatusColor(event.statusId) }}
                  />
                </TooltipTrigger>
                <TooltipContent side="left">{event.status}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {i < history.length - 1 && (
              <div className="mt-2 w-px flex-1 min-h-6 bg-gradient-to-b from-slate-200 to-slate-100" />
            )}
          </div>

          {/* Event card */}
          <div className={cn("flex-1 pb-3 min-w-0", i === history.length - 1 && "pb-0")}>
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
                    style={{
                      backgroundColor: `${getStatusColor(event.statusId)}18`,
                      color: getStatusColor(event.statusId),
                    }}
                  >
                    {event.status}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-800 leading-snug">
                    {t("ns1:TicketDetailPage.TimeLine.AtananKisiTakim")}{" "}
                    <span className="text-[#3e5d8f]">{event.name}</span>
                  </p>
                  {event.description && (
                    <p className="mt-1.5 text-xs text-slate-500 italic leading-relaxed border-l-2 border-slate-200 pl-2">
                      {t("ns1:TicketDetailPage.TimeLine.Aciklama")}: {event.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-700 tabular-nums">{event.createDate}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{event.createdBy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function CreateRequest({ ...rest }: createTicketProps) {
  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const { ticketId } = useParams();
  const { fromApr } = useParams();

  const location = useLocation();
  const storedTicketId = sessionStorage.getItem("ticketId");

  const id = storedTicketId;
  const reviewFromState = Boolean(location.state?.review);
  const reviewFromSession = sessionStorage.getItem("review") === "true";
  const review = Boolean(id) && (reviewFromState || reviewFromSession);
  const checkApr = fromApr || location.state?.fromApr;
  const { idSolveTicket, isSolveTicket } = rest;
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedKullanici, setSelectedKullanici] = useState(null);
  const [slaPlan, setSlaPlan] = useState<slaPlan[]>([]);
  const [subjectHelp, setsubjectHelp] = useState<subjectHelp[]>([]);
  const [ticketType, setTicketType] = useState<ticketType[]>([]);
  const [ticketPriority, setTicketPriority] = useState<ticketPriority[]>([]);

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectionPerson, setSelectionPerson] = useState(null);
  const [checkBox, setCheckBox] = useState(false);

  const [companyData, setCompanyData] = useState<WorkCompanyDto[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<WorkCompanyDto>(null);
  const [selectedToCompany, setselectedToCompany] = useState<WorkCompanyDto>(null);
  const [encodedHtml, setEncodedHtml] = useState("");
  const [systemData, setSystemData] = useState<WorkCompanySystemInfoListDto[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<WorkCompanySystemInfoListDto>(null);
  const [ticketForm, setTicketForm] = useState<TicketInsertDto>({
    title: "",
    description: "",
    workCompanyId: "",
    workCompanySystemInfoId: "",
    userAppId: "",
    type: null,
    ticketSLA: null,
    ticketSubject: null,
    priority: null,
    isSend: false,
    ticketComment: [],
    ticketCode: "",
    customerRefId: "",
  });
  const [updatedTicketForm, setUpdatedTicketForm] = useState<TicketUpdateDto>(null);
  const [selectedTicketPriority, setSelectedTicketPriority] = useState<ticketPriority>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<ticketType>(null);
  const [selectedTicketSLA, setSelectedTicketSLA] = useState<slaPlan>(null);
  const [selectedSubject, setSelectedSubject] = useState<subjectHelp>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dispatchBusy = useBusy();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newSelectedFiles, setNewSelectedFiles] = useState<File[]>([]);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const [teamData, setTeamData] = useState<TicketTeamListDto[]>([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [departmentData, setDepartmentData] = useState<TicketDepartmensListDto[]>([]);
  const [projectData, setProjectData] = useState<TicketProjectsListDto[]>([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [statusData, setStatusData] = useState<statusData[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<statusData>(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [nameOfAssigned, setNameOfAssigned] = useState("");
  const [selectedTicketNo, setSelectedTicketNo] = useState("");
  const [assingDesc, setassingDesc] = useState("");
  const [flagBoolean, setFlagBoolean] = useState(true);
  const [ticketTitleText, setTicketTitleText] = useState("");
  const [selectedIlgiliPerson, setSelectedIlgiliPerson] = useState<UserAppDto[]>([]);
  const [selectionIlgiliPerson, setSelectionIlgiliPerson] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignHistory, setAssignHistory] = useState<any[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const { source } = useParams<{ source: "gelen" | "olusturdugum" }>();
  const [canEditTicket, setCanEditTicket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInputValue, setCcInputValue] = useState("");

  // ── Görevler sekmesi state ─────────────────────────────────────────────────
  const [existingTasks, setExistingTasks] = useState<TicketTaskListDto[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // ── Yönlendirme geçmişi collapsible ───────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);

  const quillRef = useRef(null);

  // ── Tab items ──────────────────────────────────────────────────────────────
  const tabItems = [
    { value: "0", label: t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailNavBarProps.MevcutTalep"), icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { value: "1", label: "Görevler", icon: <CheckSquare className="w-3.5 h-3.5" /> },
    ...(isSolveTicket && !review
      ? [{ value: "2", label: t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailNavBarProps.TalepGuncelleme"), icon: <Settings2 className="w-3.5 h-3.5" /> }]
      : []),
  ];

  const showTabs = true;

  // ── Business logic (all preserved) ────────────────────────────────────────

  useEffect(() => {
    console.log(source);
  }, [source]);

  useEffect(() => {
    if (!id) {
      sessionStorage.removeItem("review");
    }
  }, [id]);

  const fetchFlagBoolean = async () => {
    try {
      const conf = getConfiguration();
      const api = new TicketApi(conf);
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu " + error, type: "Error" });
    }
  };

  useEffect(() => {
    const fetchUserAppName = async () => {
      if (!id) {
        const conf = getConfiguration();
        const api = new TicketApi(conf);
        const data = await api.apiTicketCheckPermGet();
        setHasPerm(data.data.perm);
        setSelectedKullanici({ userAppId: data.data.id, userAppName: data.data.name });
        setTicketForm((prevForm) => ({ ...prevForm, userAppId: data.data.id }));
      }
      if (id != null) {
        await getAssignHistory();
      }
    };
    fetchUserAppName();
  }, []);

  const handleAssignTicket = async () => {
    try {
      dispatchBusy({ isBusy: true });
      ticketForm.ticketComment = [];
      const conf = getConfiguration();
      const api = new TicketApi(conf);
      let assignDataDTO: TicketManagerUpdateDto;

      if (!assingDesc || assingDesc.trim() === "") {
        dispatchAlert({ message: "Lütfen güncelleme nedenini yazınız.", type: "Warning" });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (selectedStatus.id !== 10) {
        if (nameOfAssigned === "" || nameOfAssigned === "Atama Yok") {
          if (selectedPerson === null && !checkBox) {
            dispatchAlert({ message: "Lütfen atanılan kişi veya talep seçiniz.", type: "Warning" });
            dispatchBusy({ isBusy: false });
            return;
          }
        }
      }

      const baseManagerDto = {
            ...ticketForm,
        id,
            ticketDepartmentId: selectedDepartment.id,
            status: selectedStatus.id,
            estimatedDeadline: selectedDate,
            ticketProjectId: selectedProject?.id ? selectedProject.id : null,
      };
      const notifications = selectedIlgiliPerson?.length
        ? selectedIlgiliPerson.map((item) => ({ ticketId: id, userAppId: item.id }))
        : [];

      if (checkBox && selectedTeam) {
        assignDataDTO = { managerDto: baseManagerDto, assigngDto: { ticketsId: id, isActive: true, description: assingDesc, ticketTeamID: selectedTeam.id }, notificationsInsertDtos: notifications };
      } else if (!checkBox && selectedPerson) {
        assignDataDTO = { managerDto: baseManagerDto, assigngDto: { ticketsId: id, isActive: true, userAppId: selectedPerson.id, description: assingDesc }, notificationsInsertDtos: notifications };
      } else {
        assignDataDTO = { managerDto: baseManagerDto, assigngDto: { ticketsId: id, isActive: true, description: assingDesc }, notificationsInsertDtos: notifications };
      }

      await api.apiTicketAssignPost(assignDataDTO);
      dispatchAlert({ message: "Talep başarıyla güncellendi", type: "Success" });
      navigate("/solveAllTicket/");
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchAlert({ message: "Talep atanırken bir hata oluştu " + error, type: "Error" });
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchStatusData = async () => {
    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api = new TicketApi(conf);
    const data = await api.apiTicketTicketStatusGet();
    const statData = data.data as any;
    setStatusData(statData.filter((item: any) => item.id !== 2 && item.id !== 1));
    dispatchBusy({ isBusy: false });
  };

  const fetchDepartmentData = async () => {
    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api = new TicketDepartmentsApi(conf);
    const data = await api.apiTicketDepartmentsAllOnlyNameGet();
    setDepartmentData(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  const fetchTeamData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketTeamApi(conf);
      const data = await api.apiTicketTeamWithoutTeamGet(false);
      setTeamData(data.data);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchTicketAndCompanyData = async () => {
    setIsLoading(true);
    dispatchBusy({ isBusy: true });
    try {
      const conf = getConfiguration();
      const companyApi = new WorkCompanyApi(conf);
      const ticketApi = new TicketApi(conf);
      const companyDataRes = await companyApi.apiWorkCompanyGetAssingListGet();
      setCompanyData(companyDataRes.data);

      if (id) {
        const dataTicket = await ticketApi.apiTicketCheckPermGet();
        setCanEditTicket(dataTicket.data.canEditTicket);

        const ticketResponse = await ticketApi.apiTicketIdGet(id);
        const ticketData = ticketResponse.data;

        if ([1, 9, 10, 11, 12].includes(ticketData.status)) {
          setCanEditTicket(false);
        }

        setSelectedTicketNo(ticketData.ticketNumber.toString());
        setTicketTitleText(ticketData.title);

        const selectedCompanyData = companyDataRes.data.find((c) => c.id === ticketData.workCompanyId);
        setSelectedCompany({ id: ticketData.workCompanyId, name: selectedCompanyData?.name });

        if (ticketData.addedMailAddresses) {
          setCcEmails(
            denormalizeEmails(ticketData.addedMailAddresses)
              .split(" ")
              .filter(Boolean)
          );
        }

        const relUsers: UserApp[] = [];
        if (ticketData.ticketNotificationsListDto) {
          ticketData.ticketNotificationsListDto.forEach((item) => relUsers.push(item.user));
        }
        setSelectedIlgiliPerson(relUsers);

        if (ticketData.customerRefId) {
          const selectedCustCompanyData = companyDataRes.data.find((c) => c.id === ticketData.customerRefId);
          setselectedToCompany({ id: ticketData.customerRefId, name: selectedCustCompanyData?.name });

          const api = new TicketProjectsApi(conf);
          const data = await api.apiTicketProjectsGetActiveProjectsGet(ticketData.customerRefId);
          setProjectData(data.data as any);
          setSelectedProject(ticketData.ticketProjectId);

          const systemApi = new WorkCompanySystemInfoApi(conf);
          const systemResponse = await systemApi.apiWorkCompanySystemInfoByCompanyIdIdGet(ticketData.customerRefId);
          setSystemData(systemResponse.data);

          if (ticketData.workCompanySystemInfoId) {
            setSelectedSystem({ id: ticketData.workCompanySystemInfoId, name: systemResponse.data.find((s) => s.id === ticketData.workCompanySystemInfoId)?.name });
          }

          setTicketForm((prevForm) => ({ ...prevForm, customerRefId: ticketData.customerRefId }));
        }

        setCanEdit(ticketData.canEdit);
        if (checkApr) setCanEdit(false);
        setIsOpen(ticketData.status > 1);

        if (ticketData.userAppId && ticketData.userAppName) {
          setSelectedKullanici({ userAppId: ticketData.userAppId, userAppName: ticketData.userAppName });
        }

        setSelectedTicketType({ id: ticketData.type, name: ticketData.typeText, description: ticketData.typeText });
        setSelectedSubject({ id: ticketData.ticketSubject, name: ticketData.ticketSubjectText, description: ticketData.ticketSubjectText });
        setSelectedTicketSLA({ id: ticketData.ticketSLA, name: ticketData.ticketSLAText, description: ticketData.ticketSLAText });
        setSelectedTicketPriority({ id: ticketData.priority, name: ticketData.priorityText, description: ticketData.priorityText });

        setTicketForm((prevForm) => ({
          ...prevForm,
          priority: ticketData.priority,
          type: ticketData.type,
          ticketSLA: ticketData.ticketSLA,
          ticketSubject: ticketData.ticketSubject,
          userAppId: ticketData.userAppId,
          workCompanyId: ticketData.workCompanyId,
          workCompanySystemInfoId: ticketData.workCompanySystemInfoId,
          ticketComment: ticketData.ticketComment || [],
          ticketCode: ticketData.ticketCode,
          title: ticketData.title,
        }));

        setSelectedStatus({ id: ticketData.status, name: ticketData.statusText, description: ticketData.statusText });
        setSelectedDate(ticketData.estimatedDeadline);

        if (ticketData.ticketProjectId) {
          setSelectedProject({ id: ticketData.ticketProjectId, name: ticketData.ticketprojectName });
        }

        setSelectedDepartment({ id: ticketData.ticketDepartmentId, departmentText: ticketData.ticketDepartmentText });
        setNameOfAssigned(ticketData.ticketAssigneText);
        setEncodedHtml("");
        setSelectedFiles([]);
      } else {
        const userApi = new UserApi(conf);
        const userCompany = await userApi.apiUserUserCompanyGet();
        setSelectedCompany(companyDataRes.data.find((e) => e.id === userCompany.data.workCompanyId));
        setTicketForm((prevForm) => ({
          ...prevForm,
          workCompanyId: companyDataRes.data.find((e) => e.id === userCompany.data.workCompanyId).id,
        }));

        const systemApi = new WorkCompanySystemInfoApi(conf);
        await systemApi.apiWorkCompanySystemInfoByCompanyIdIdGet(companyDataRes.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      dispatchBusy({ isBusy: false });
      setIsLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => (dateString ? dateString.split("T")[0] : "");

  const fetchSystemData = async () => {
    if (!selectedToCompany) return;
  if (!id) {
    dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WorkCompanySystemInfoApi(conf);
      const data = await api.apiWorkCompanySystemInfoByCompanyIdIdGet(selectedToCompany.id);
    setSystemData(data.data as any);
    if (data.data.length > 0) {
      setSelectedSystem(data.data[0]);
        setTicketForm((prevForm) => ({ ...prevForm, workCompanySystemInfoId: data.data[0].id }));
    } else {
      setSelectedSystem(null);
      ticketForm.workCompanySystemInfoId = "";
    }
    dispatchBusy({ isBusy: false });
  }
};

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new UserApi(conf);
      const data = await api.apiUserGetAllUsersWitNameAssignGet(value);
      setSearchByName(data.data);
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchDetail = async () => {
    const conf = getConfiguration();
    const api = new TicketApi(conf);
    const subjectData = await api.apiTicketTicketSubjectGet();
    setsubjectHelp(subjectData.data as any);
    const slaData = await api.apiTicketTicketSLAGet();
    setSlaPlan(slaData.data as any);
    const typeData = await api.apiTicketTicketTypeGet();
    setTicketType(typeData.data as any);
    const priorityData = await api.apiTicketTicketPrioritiesGet();
    setTicketPriority(priorityData.data as any);
  };

  useEffect(() => {
    const initializeSolutionData = async () => {
      if (isSolveTicket && teamData.length === 0) {
        try {
          await Promise.all([fetchTeamData(), fetchDepartmentData(), fetchFlagBoolean()]);
        } catch (error) {
          console.error("Error initializing data:", error);
        }
      }
    };
    if (activeIndex === 2) {
      initializeSolutionData();
    }
  }, [activeIndex]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchTicketAndCompanyData(), fetchDetail(), fetchStatusData()]);
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchSystemData().catch(console.error);
    }
  }, [selectedCompany]);

  // ── Görevler sekmesi açılınca mevcut ticket'ın task'larını çek ──────────────
  useEffect(() => {
    if (activeIndex !== 1 || !id) return;
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        const api = new TicketApi(getConfiguration());
        const res = await api.apiTicketIdTasksGet(id);
        setExistingTasks(res.data ?? []);
      } catch (error) {
        dispatchAlert({ message: "Görevler yüklenemedi: " + error, type: "Error" });
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [activeIndex, id]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCreateTicket = async (isSend: boolean) => {
    try {
      dispatchBusy({ isBusy: true });
      setLoading(true);
      setIsSubmitting(true);

      if (!ticketForm.ticketSubject) { dispatchAlert({ message: "Yardım Konusu Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.ticketSLA) { dispatchAlert({ message: "SLA Planı Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.type) { dispatchAlert({ message: "Talep Tipi Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.priority) { dispatchAlert({ message: "Talep Önceliği Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.customerRefId) { dispatchAlert({ message: "Müşteri Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.userAppId) { dispatchAlert({ message: "Talep Atanacak Kullanıcı Seçilmedi..!", type: "Warning" }); return; }
      if (!ticketForm.workCompanyId) { dispatchAlert({ message: "Şirket Seçilmedi..!", type: "Warning" }); return; }
      if (!ticketForm.title) { dispatchAlert({ message: "Talep Başlığı Alanı Boş Bırakılmaz..!", type: "Warning" }); return; }

      const spaceCheck = encodedHtml.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/g, "").trim();
      if (!encodedHtml || spaceCheck === "") {
        dispatchAlert({ message: "Lütfen taleple ilgili açıklama ekleyiniz..!", type: "Warning" });
        return;
      }

      const normalizedAddedMailAddresses = normalizeEmails(ccEmails.join(" "));

      const conf = getConfiguration();
      const api = new TicketApi(conf);

      if (encodedHtml || newSelectedFiles.length > 0) {
        const fileDataArray = await Promise.all(newSelectedFiles.map(async (file) => ({ fileName: file.name, base64: await fileToBase64(file), fileType: file.type })));
        const newComment = { body: encodedHtml, files: fileDataArray };
        await api.apiTicketPost(1, null, { ...ticketForm, isFromEmail: false, isSend, ticketComment: [...ticketForm.ticketComment, newComment], addedMailAddresses: normalizedAddedMailAddresses, tasks: null });
      } else {
        await api.apiTicketPost(1, null, { ...ticketForm, isFromEmail: false, isSend, ticketComment: [], addedMailAddresses: normalizedAddedMailAddresses, tasks: null });
      }

      const taskMsg = "";
      dispatchAlert({ message: `Talep başarıyla oluşturuldu${taskMsg}`, type: "Success" });
      isSolveTicket ? navigate("/solveAllTicket/") : navigate("/tickets");
    } catch (error) {
      dispatchAlert({ message: "Talep oluşturulurken bir hata oluştu " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setUpdatedTicketForm({
      id,
      description: ticketForm.description,
      title: ticketForm.title,
      type: ticketForm.type,
      ticketSLA: ticketForm.ticketSLA,
      ticketSubject: ticketForm.ticketSubject,
      priority: ticketForm.priority,
      userAppId: ticketForm.userAppId,
      isSend: ticketForm.isSend,
      workCompanyId: ticketForm.workCompanyId,
      ticketCode: ticketForm.ticketCode,
      workCompanySystemInfoId: ticketForm.workCompanySystemInfoId,
      customerRefId: ticketForm.customerRefId,
    });
  }, [ticketForm]);

  const handleUpdateTicket = async (isSend?: boolean, isEdit?: boolean) => {
    try {
      dispatchBusy({ isBusy: true });

      if (!ticketForm.ticketSubject) { dispatchAlert({ message: "Yardım Konusu Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.ticketSLA) { dispatchAlert({ message: "SLA Planı Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.type) { dispatchAlert({ message: "Talep Tipi Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.priority) { dispatchAlert({ message: "Talep Önceliği Alanı Boş Bırakılamaz..!", type: "Warning" }); return; }
      if (!ticketForm.userAppId) { dispatchAlert({ message: "Talep Atanacak Kullanıcı Seçilmedi..!", type: "Warning" }); return; }
      if (!ticketForm.workCompanyId) { dispatchAlert({ message: "Şirket Seçilmedi..!", type: "Warning" }); return; }
      if (!ticketForm.title) { dispatchAlert({ message: "Talep Başlığı Alanı Boş Bırakılmaz..!", type: "Warning" }); return; }

      const conf = getConfiguration();
      const api = new TicketApi(conf);
      const normalizedAddedMailAddresses = normalizeEmails(ccEmails.join(" "));
      const baseDtoWithDept = { ...updatedTicketForm, isSend, ticketDepartmentId: selectedDepartment.id, addedMailAddresses: normalizedAddedMailAddresses };

      if (!isOpen && isSend) {
        await api.apiTicketUpdateStartTicketPost(1, false, baseDtoWithDept);
        dispatchAlert({ message: "Talep başarıyla güncellendi", type: "Success" });
      } else if (isOpen && isSend && isEdit) {
        await api.apiTicketUpdateStartTicketPost(1, true, baseDtoWithDept);
      } else if (isOpen == true && isSend == true && isEdit == true) {
        await api.apiTicketUpdateStartTicketPost(1, true, {
          ...updatedTicketForm,
          isSend: isSend,
          ticketDepartmentId: selectedDepartment.id,
          addedMailAddresses: normalizedAddedMailAddresses,
        });
        dispatchAlert({ message: "Talep başarıyla güncellendi", type: "Success" });
      } else if (isSend == false) {
        await api.apiTicketPut({
          ...updatedTicketForm,
          isSend: isSend,
          ticketDepartmentId: selectedDepartment.id,
          addedMailAddresses: normalizedAddedMailAddresses,
        });
        dispatchAlert({ message: "Talep başarıyla güncellendi", type: "Success" });
      }
    } catch (error) {
      dispatchAlert({ message: "Talep güncellenirken bir hata oluştu " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleChangeText = (value: string) => {
    setEncodedHtml(value);
    setNewCommentBody(value);
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ color: [] as string[] }, { background: [] as string[] }],
        [{ font: [] as string[] }],
        [{ align: [] as string[] }],
        ["clean"],
        ["link", "image"],
      ] as const,
    },
    clipboard: { matchVisual: false },
  };

  const formats = [
    "header", "bold", "italic", "underline", "strike",
    "blockquote", "code-block", "list", "bullet", "indent",
    "link", "image", "align", "direction", "color",
    "background", "font", "size", "script",
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const maxFileSize = 10 * 1024 * 1024;
      const validFiles: any[] = [];
      const oversizedFiles: any[] = [];
      Array.from(files).forEach((file) => {
        if (file.size <= maxFileSize) validFiles.push(file);
        else oversizedFiles.push(file);
      });
      if (oversizedFiles.length > 0) {
        dispatchAlert({ message: "Dosya boyutu çok büyük. Maksimum izin verilen boyut 10MB.", type: "Warning" });
      }
      if (validFiles.length > 0) {
        setNewSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
    event.target.value = "";
  };

  const handleDownload = async (file: any) => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketApi(conf);
      const base64response = await api.apiTicketGetFileGet(file.id);
      const byteCharacters = atob(base64response.data.base64);
      const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.fileType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      dispatchAlert({ message: "Dosya indirilirken bir hata oluştu " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleDeleteFile = (file: File) => {
    setNewSelectedFiles(newSelectedFiles.filter((f) => f !== file));
  };

  const sendComment = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const fileDataArray = await Promise.all(newSelectedFiles.map(async (file) => ({ fileName: file.name, base64: await fileToBase64(file), fileType: file.type })));
      const newComment: TicketCommentInsertDto = { body: encodedHtml, files: fileDataArray };
      const conf = getConfiguration();
      const api = new TicketApi(conf);
      await api.apiTicketAddCommentPost(id, newComment);
      dispatchAlert({ message: "Açıklama gönderildi", type: "Success" });
      setNewCommentBody("");
      await fetchTicketAndCompanyData();
    } catch (error) {
      dispatchAlert({ message: "Açıklama gönderirken bir hata oluştu " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const onChangeToCompany = async (companyId: any) => {
    const conf = getConfiguration();
    const systemApi = new WorkCompanySystemInfoApi(conf);
    const systemResponse = await systemApi.apiWorkCompanySystemInfoByCompanyIdIdGet(companyId);
    setSystemData(systemResponse.data);
    setSelectedSystem(null);
    setTicketForm({ ...ticketForm, workCompanySystemInfoId: null, customerRefId: companyId });
  };

  const getAssignHistory = async () => {
    const conf = getConfiguration();
    const ticketApi = new TicketApi(conf);
    const res = await ticketApi.apiTicketGetAssingListGet(id);
    res.data.forEach((item) => {
      item.createDate = format(new Date(item.createDate), "dd.MM.yyyy HH:mm:ss", { locale: tr });
    });
    setAssignHistory(res.data.reverse());
  };

  const downloadBase64File = (base64Data: string) => {
    const mimeType = "application/pdf";
    const fileName = `Talep#${selectedTicketNo}.pdf`;
    const base64String = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const byteCharacters = atob(base64String);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      byteArrays.push(new Uint8Array(Array.from(slice, (c) => c.charCodeAt(0))));
    }
    const blob = new Blob(byteArrays, { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api = new TicketApi(conf);
    const data = await api.apiTicketGetTicketPdfIdGet(id);
    downloadBase64File(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  const normalizeEmails = (value: string): string => {
    if (!value) return "";
    return value.trim().split(/\s+/).map((email) => email.trim()).filter(Boolean).join(";");
  };

  const denormalizeEmails = (value: string): string => {
    if (!value) return "";
    return value.split(";").map((email) => email.trim()).filter(Boolean).join(" ");
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddCcEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const trimmed = ccInputValue.trim();
      if (!validateEmail(trimmed)) {
        dispatchAlert({ message: "Lütfen geçerli bir e-posta adresi girin.", type: "Error" });
        return;
      }
      if (ccEmails.includes(trimmed)) {
        dispatchAlert({ message: "Girdiğiniz e-posta adresi zaten listede var.", type: "Error" });
        return;
      }
      setCcEmails((prev) => [...prev, trimmed]);
      setCcInputValue("");
    }
  };

  const removeCcEmail = (indexToRemove: number) => {
    setCcEmails((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // ── Helpers for Combobox options ──────────────────────────────────────────

  const toOpts = (arr: any[], valueKey: string, labelKey: string): ComboboxOption[] =>
    (arr ?? []).map((o) => ({ value: String(o[valueKey]), label: o[labelKey] ?? "" }));

  const statusComboboxOptions = useMemo((): ComboboxOption[] => {
    const base = toOpts(statusData, "id", "description");
    if (!selectedStatus) return base;
    const idStr = String(selectedStatus.id);
    if (base.some((o) => o.value === idStr)) return base;
    const fallbackLabel = selectedStatus.description ?? selectedStatus.name ?? idStr;
    return [...base, { value: idStr, label: fallbackLabel }];
  }, [statusData, selectedStatus]);

  // ── Render ────────────────────────────────────────────────────────────────

  const pageTitle = id
    ? `${t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailPageNo")}: ${selectedTicketNo}`
    : t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailNewTalep");

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-screen bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 px-3 pt-5 pb-12">

        {/* ── Main Card ── */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/70 bg-white shadow-[0_4px_40px_rgba(62,93,143,0.08)]">

          {/* Top gradient accent stripe */}
          <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />

          {/* ── Card Header ── */}
          <div className="px-6 pt-5 pb-0 border-b border-slate-100/80">
            <div className="flex items-start justify-between gap-4 mb-5">

              {/* Left: ticket meta + title */}
              <div className="flex flex-col gap-2 min-w-0">
                {id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3e5d8f]/8 px-3 py-1 text-[11px] font-bold text-[#3e5d8f] tracking-widest uppercase border border-[#3e5d8f]/12">
                      # {selectedTicketNo}
                    </span>
                    {selectedStatus && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border"
                        style={{
                          backgroundColor: `${getStatusColor(selectedStatus.id)}14`,
                          color: getStatusColor(selectedStatus.id),
                          borderColor: `${getStatusColor(selectedStatus.id)}28`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getStatusColor(selectedStatus.id) }}
                        />
                        {selectedStatus.name}
                      </span>
                    )}
                  </div>
                )}
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight truncate max-w-xl">
                  {pageTitle}
                </h1>
              </div>

              {/* Right: PDF download */}
              {id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  className="gap-2 h-9 border-slate-200 text-slate-600 hover:bg-[#3e5d8f]/5 hover:border-[#3e5d8f]/30 hover:text-[#3e5d8f] shrink-0 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailPdf")}
                </Button>
              )}
            </div>

            {/* Tab bar */}
            {showTabs && (
              <Tabs
                value={String(activeIndex)}
                onValueChange={(v) => setActiveIndex(Number(v))}
              >
                <TabsList variant="line" className="h-10 gap-1">
                  {tabItems.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="gap-2 px-5 text-[13px] font-medium transition-all data-[state=active]:text-[#3e5d8f] data-[state=active]:font-semibold"
                    >
                      {item.icon}
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Tab 0: Mevcut Talep                                            */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {activeIndex === 0 && (
            <div className="p-6 flex flex-col gap-5">

              {/* 3-column grid: left (1) | right (2) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: User & Company ── */}
                <SectionCard
                  title={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailHeaderProps.KullaniciVeIsOrtaklari")}
                  icon={<Users className="w-3.5 h-3.5" />}
                >
                  <div className="flex flex-col gap-4">
                    <FormField label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.Sirket")}>
                      <Combobox
                        options={toOpts(companyData, "id", "name")}
                        value={selectedCompany?.id ?? null}
                        onChange={(val) => {
                          if (!val) return;
                          const found = companyData.find((c) => c.id === val);
                          if (!found) return;
                          setTicketForm({ ...ticketForm, workCompanyId: found.id });
                          setSelectedCompany(found);
                        }}
                        placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.Sirket")}
                        disabled={isOpen || !hasPerm}
                      />
                    </FormField>

                    <FormField label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.Kullanici")}>
                      <UserSearchCombobox
                        value={selectedKullanici}
                        onChange={(user) => {
                          if (user) {
                            setTicketForm({ ...ticketForm, userAppId: user.userAppName ? user.userAppId : user.id });
                            setSelectedKullanici(user);
                          } else {
                            setTicketForm((prev) => ({ ...prev, userAppId: null }));
                            setSelectedKullanici(null);
                          }
                        }}
                        onSearch={handleSearchByName}
                        results={searchByName}
                        placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.Kullanici")}
                        disabled={isOpen || !hasPerm}
                      />
                    </FormField>

                    {!isSolveTicket && (
                      <FormField label="Bildirim E-posta Adresleri">
                        <CcEmailInput
                          emails={ccEmails}
                          inputValue={ccInputValue}
                          onInputChange={setCcInputValue}
                          onKeyDown={handleAddCcEmail}
                          onRemove={removeCcEmail}
                          disabled={isOpen}
                        />
                      </FormField>
                    )}
                  </div>
                </SectionCard>

                {/* ── Right col (2-span) ── */}
                <div className="lg:col-span-2 flex flex-col gap-5">

                  {/* Ticket title */}
                  <SectionCard>
                    <FormField
                      label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailHeaderProps.TalepBasligi")}
                      required
                    >
                      <Input
                        type="text"
                        disabled={isOpen}
                        value={ticketTitleText}
                        placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailHeaderProps.TalepBasligiPlaceholder")}
                        onChange={(e) => {
                          const trimText = e.target.value.trimStart();
                          setTicketTitleText(trimText);
                          setTicketForm({ ...ticketForm, title: trimText });
                        }}
                        onBlur={() => {
                          const trimmed = ticketTitleText.trim();
                          setTicketTitleText(trimmed);
                          setTicketForm({ ...ticketForm, title: trimmed });
                        }}
                        maxLength={55}
                        className="rounded-xl border-slate-200 bg-white focus-visible:border-[#3e5d8f]/40 focus-visible:ring-2 focus-visible:ring-[#3e5d8f]/8 text-base font-medium"
                      />
                    </FormField>
                  </SectionCard>

                  {/* Record & info options grid */}
                  <SectionCard
                    title={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailHeaderProps.KayitVeBilgiSecenekleri")}
                    icon={<Tag className="w-3.5 h-3.5" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <FormField
                        label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.YardimKonusu")}
                        required
                      >
                        <Combobox
                          options={toOpts(subjectHelp, "id", "description")}
                          value={selectedSubject ? String(selectedSubject.id) : null}
                          onChange={(val) => {
                            const found = subjectHelp.find((s) => String(s.id) === val);
                            if (found) { setTicketForm({ ...ticketForm, ticketSubject: found.id }); setSelectedSubject(found); }
                          }}
                          placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.YardimKonusu")}
                          disabled={isOpen ? !canEditTicket : false}
                        />
                      </FormField>

                      <FormField
                        label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.SLAPlani")}
                        required
                      >
                        <Combobox
                          options={toOpts(slaPlan, "id", "description")}
                          value={selectedTicketSLA ? String(selectedTicketSLA.id) : null}
                          onChange={(val) => {
                            const found = slaPlan.find((s) => String(s.id) === val);
                            if (found) { setTicketForm({ ...ticketForm, ticketSLA: found.id }); setSelectedTicketSLA(found); }
                          }}
                          placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.SLAPlani")}
                          disabled={isOpen ? !canEditTicket : false}
                        />
                      </FormField>

                      <FormField
                        label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.TalepTipi")}
                        required
                      >
                        <Combobox
                          options={toOpts(ticketType, "id", "description")}
                          value={selectedTicketType ? String(selectedTicketType.id) : null}
                          onChange={(val) => {
                            const found = ticketType.find((t) => String(t.id) === val);
                            if (found) { setTicketForm({ ...ticketForm, type: found.id }); setSelectedTicketType(found); }
                          }}
                          placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.TalepTipi")}
                          disabled={isOpen ? !canEditTicket : false}
                        />
                      </FormField>

                      <FormField
                        label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.TalepOnceligi")}
                        required
                      >
                        <Combobox
                          options={toOpts(ticketPriority, "id", "description")}
                          value={selectedTicketPriority ? String(selectedTicketPriority.id) : null}
                          onChange={(val) => {
                            const found = ticketPriority.find((p) => String(p.id) === val);
                            if (found) { setTicketForm({ ...ticketForm, priority: found.id }); setSelectedTicketPriority(found); }
                          }}
                          placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.TalepOnceligi")}
                          disabled={isOpen ? !canEditTicket : false}
                        />
                      </FormField>

                      <FormField
                        label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.Musteri")}
                        required
                      >
                        <Combobox
                          options={toOpts(companyData, "id", "name")}
                          value={selectedToCompany?.id ?? null}
                          onChange={(val) => {
                            const found = companyData.find((c) => c.id === val);
                            if (!found) return;
                            setTicketForm({ ...ticketForm, customerRefId: found.id });
                            setselectedToCompany(found);
                            onChangeToCompany(found.id);
                          }}
                          placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.Musteri")}
                          disabled={isOpen ? !canEditTicket : false}
                        />
                      </FormField>

                      <FormField label={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.MusteriSistemBilgileri")}>
                        <Combobox
                          options={toOpts(systemData, "id", "name")}
                          value={selectedSystem?.id ?? null}
                          onChange={(val) => {
                            const found = systemData.find((s) => s.id === val);
                            if (!found) return;
                            setTicketForm({ ...ticketForm, workCompanySystemInfoId: found.id });
                            setSelectedSystem(found);
                          }}
                          placeholder={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.MusteriSistemBilgileri")}
                          disabled={isOpen ? !canEditTicket : false}
                          noOptionsText={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.NoSystem")}
                        />
                      </FormField>
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* ── Existing ticket action buttons ── */}
              {!isLoading && id && (
                <div className="flex items-center justify-end gap-2.5 py-1">
                  {isOpen ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (checkApr) navigate("/approve");
                          else isSolveTicket ? navigate("/solveAllTicket/") : navigate("/tickets");
                        }}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-5"
                      >
                        {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.GeriDon")}
                      </Button>
                      {canEditTicket && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTicket(true, true)}
                          className="h-9 rounded-xl bg-[#3e5d8f] hover:bg-[#324d7a] text-white px-5 shadow-sm shadow-[#3e5d8f]/20 transition-all"
                        >
                          {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailNavBarProps.TalepGuncelleme")}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => isSolveTicket ? navigate("/solveAllTicket/") : navigate("/tickets")}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-5"
                      >
                        {t("ns1:TicketDetailPage.TicketDetailPage.Iptal")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTicket(false)}
                        className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-5"
                      >
                        {t("ns1:TicketDetailPage.TicketDetailPage.TaslakGuncelle")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTicket(true)}
                        className="h-9 rounded-xl bg-[#3e5d8f] hover:bg-[#324d7a] text-white px-5 shadow-sm shadow-[#3e5d8f]/20 transition-all"
                      >
                        {t("ns1:TicketDetailPage.TicketDetailPage.TalepGonder")}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* ── Yönlendirme Geçmişi (embedded collapsible) ── */}
              {id && (
                <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/30">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    aria-expanded={showHistory}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/60 transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3e5d8f]/10 text-[#3e5d8f] group-hover:bg-[#3e5d8f]/15 transition-colors">
                        <GitBranch className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailNavBarProps.YonlendirmeGecmisi")}
                      </span>
                      {assignHistory.length > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[#3e5d8f]/10 px-1.5 text-[11px] font-bold text-[#3e5d8f]">
                          {assignHistory.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        showHistory && "rotate-180"
                      )}
                    />
                  </button>

                  {showHistory && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      <AssignTimeline history={assignHistory} t={t as TFn} />
                    </div>
                  )}
                </div>
              )}

              {/* ── Comment history timeline ── */}
              {ticketForm.ticketComment?.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100/80">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3e5d8f]/8 text-[#3e5d8f]/70">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                      Açıklama Geçmişi
                    </span>
                    <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-slate-200/80 px-1.5 text-[10px] font-bold text-slate-500">
                      {ticketForm.ticketComment.length}
                    </span>
                  </div>
                  <div className="p-5">
                    <TimelineComponent
                      ticketFormComment={ticketForm.ticketComment}
                      handleDownload={handleDownload}
                    />
                  </div>
                </div>
              )}

              {/* ── Description (ReactQuill) ── */}
              {!review && (
                <SectionCard
                  title={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailHeaderProps.Aciklama")}
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  <ReactQuill
                    ref={quillRef}
                    className="custom-quill"
                    style={{ minHeight: "200px" }}
                    modules={modules}
                    formats={formats}
                    value={newCommentBody || ""}
                    onChange={handleChangeText}
                    theme="snow"
                  />
                </SectionCard>
              )}

              {/* ── File upload ── */}
              {!review && canEdit && (
                <SectionCard
                  title={t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.DosyaSec")}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpeg,.png,.pptx"
                        style={{ display: "none" }}
                        id="file-select"
                        onChange={handleFileSelect}
                      />
                      <label
                        htmlFor="file-select"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-600 transition-all hover:bg-white hover:border-[#3e5d8f]/40 hover:text-[#3e5d8f]"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.DosyaSec")}
                      </label>

                      {id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={sendComment}
                          disabled={!canEdit}
                          className="h-9 gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-[#3e5d8f]/30 hover:text-[#3e5d8f] px-4"
                        >
                          {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.AciklamaGonder")}
                        </Button>
                      )}
                    </div>

                    {newSelectedFiles.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                          {t("ns1:TicketDetailPage.TicketDetailPage.TicketDetailInputProps.SecilenDosyalar")}
                        </p>
                        {newSelectedFiles.map((file, index) => (
                          <FileItem
                            key={`new-file-${index}`}
                            name={file.name}
                            size={file.size}
                            onDelete={() => handleDeleteFile(file)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* ── New ticket action buttons ── */}
              {!id && (
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/tickets")}
                    className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-5"
                  >
                    {t("ns1:TicketDetailPage.TicketDetailPage.Iptal")}
                  </Button>
                  {!isOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateTicket(false)}
                      disabled={isSubmitting}
                      className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-5"
                    >
                      {t("ns1:TicketDetailPage.TicketDetailPage.TaslakOlarakKaydet")}
                    </Button>
                  )}
                  {!isOpen && (
                    <Button
                      size="sm"
                      onClick={() => handleCreateTicket(true)}
                      disabled={isSubmitting}
                      className="h-9 rounded-xl bg-[#3e5d8f] hover:bg-[#324d7a] text-white px-6 font-semibold shadow-md shadow-[#3e5d8f]/20 transition-all hover:shadow-lg hover:shadow-[#3e5d8f]/25"
                    >
                      {t("ns1:TicketDetailPage.TicketDetailPage.TalepOlustur")}
                    </Button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Tab 1: Görevler                                                 */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {activeIndex === 1 && (
            <div className="p-6">
              {id ? (
                <TaskList
                  mode="edit"
                  tasks={existingTasks}
                  loading={tasksLoading}
                  userSearchResults={searchByName}
                  onUserSearch={handleSearchByName}
                  assignDisabled={!canEdit}
                  onPatch={async (taskId, dto) => {
                    const api = new TicketApi(getConfiguration());
                    await api.apiTicketIdTasksTaskIdPatch(id, taskId, dto);
                    const res = await api.apiTicketIdTasksGet(id);
                    setExistingTasks(res.data ?? []);
                  }}
                  onDelete={async (taskId) => {
                    try {
                      const api = new TicketApi(getConfiguration());
                      await api.apiTicketIdTasksTaskIdDelete(id, taskId);
                      const res = await api.apiTicketIdTasksGet(id);
                      setExistingTasks(res.data ?? []);
                    } catch (error) {
                      dispatchAlert({ message: "Görev silinemedi: " + error, type: "Error" });
                    }
                  }}
                  onAdd={async (title, description, assigneeId) => {
                    const api = new TicketApi(getConfiguration());
                    await api.apiTicketIdTasksPost(id, { title, description: description ?? null, assigneeId: assigneeId ?? null });
                    const res = await api.apiTicketIdTasksGet(id);
                    setExistingTasks(res.data ?? []);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                  <CheckSquare className="w-10 h-10 text-slate-300" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-slate-500">Görev eklemek için önce talebi oluşturun</p>
                    <p className="text-xs text-slate-400">Talep kaydedildikten sonra bu sekmeden görev ekleyebilirsiniz.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* Tab 2: Talep Güncelleme (isSolveTicket)                        */}
          {/* ─────────────────────────────────────────────────────────────── */}
          {activeIndex === 2 && (
            <div className="p-6 flex flex-col gap-5">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* General assignment settings */}
                <SectionCard
                  title={t("ns1:TicketDetailPage.GenelAtalamalar.GenelAtalamalar")}
                  icon={<Settings2 className="w-3.5 h-3.5" />}
                >
                  <div className="flex flex-col gap-4">
                    <FormField label={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Departman")}>
                      <Combobox
                        options={toOpts(departmentData, "id", "departmentText")}
                        value={selectedDepartment ? String(selectedDepartment.id) : null}
                        onChange={(val) => {
                          const found = departmentData.find((d) => String(d.id) === val);
                          setSelectedDepartment(found ?? null);
                        }}
                        placeholder={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Departman")}
                        disabled={!flagBoolean}
                      />
                    </FormField>

                    <FormField label={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Status")}>
                      <Combobox
                        options={statusComboboxOptions}
                        value={selectedStatus ? String(selectedStatus.id) : null}
                        onChange={(val) => {
                          const found = statusData.find((s) => String(s.id) === val);
                          setSelectedStatus(found ?? null);
                        }}
                        placeholder={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Status")}
                      />
                    </FormField>

                    <FormField label="Tahmini Bitiş Tarihi">
                      <Input
                        type="date"
                        value={formatDateForInput(selectedDate)}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-xl border-slate-200 bg-white focus-visible:border-[#3e5d8f]/40 focus-visible:ring-2 focus-visible:ring-[#3e5d8f]/8"
                      />
                    </FormField>

                    <FormField label="Proje">
                      <Combobox
                        options={toOpts(projectData, "id", "name").map((o) => {
                          const proj = projectData.find((p) => String(p.id) === o.value);
                          return { ...o, label: proj?.subProjectName ? `${proj.name} - ${proj.subProjectName}` : proj?.name ?? o.label };
                        })}
                        value={selectedProject ? String(selectedProject.id ?? selectedProject) : null}
                        onChange={(val) => {
                          const found = projectData.find((p) => String(p.id) === val);
                          setSelectedProject(found ?? null);
                        }}
                        placeholder="Proje Seçiniz"
                      />
                    </FormField>
                  </div>
                </SectionCard>

                {/* Assignee */}
                <SectionCard
                  title={t("ns1:TicketDetailPage.GenelAtalamalar.AtanilanKisiYadaTakim")}
                  icon={<Users className="w-3.5 h-3.5" />}
                >
                  <div className="flex flex-col gap-4">
                    {nameOfAssigned && (
                      <div className="rounded-xl bg-[#3e5d8f]/5 border border-[#3e5d8f]/12 px-4 py-3">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-[#3e5d8f]/60 mb-1">
                          Mevcut Atama
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{nameOfAssigned}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id="showMenu"
                        checked={checkBox}
                        onCheckedChange={(checked) => setCheckBox(Boolean(checked))}
                        disabled={!flagBoolean}
                        className="data-[state=checked]:bg-[#3e5d8f] data-[state=checked]:border-[#3e5d8f]"
                      />
                      <Label htmlFor="showMenu" className="text-sm text-slate-600 cursor-pointer font-medium">
                        {t("ns1:TicketDetailPage.GenelAtalamalar.TakimAta")}
                      </Label>
                    </div>

                    {!checkBox ? (
                      <FormField label={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Kullanici")}>
                        <UserSearchCombobox
                          value={selectedPerson}
                          onChange={(user) => {
                            if (user) {
                              setSelectionPerson(user.userAppName ? user.userAppName : `${user.firstName} ${user.lastName}`);
                            }
                            setSelectedPerson(user);
                          }}
                          onSearch={handleSearchByName}
                          results={searchByName}
                          placeholder={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.KullaniciPlaceholder")}
                          disabled={!flagBoolean}
                        />
                      </FormField>
                    ) : (
                      <FormField label={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Takim")}>
                        <Combobox
                          options={toOpts(teamData, "id", "name")}
                          value={selectedTeam ? String(selectedTeam.id) : null}
                          onChange={(val) => {
                            const found = teamData.find((t) => String(t.id) === val);
                            setSelectedTeam(found ?? null);
                          }}
                          placeholder={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.TakimPlaceholder")}
                        />
                      </FormField>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* Update reason + related persons */}
              <SectionCard
                title={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.GuncellemeNedeni")}
                icon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                <div className="flex flex-col gap-4">
                  <Textarea
                    value={assingDesc}
                    placeholder={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.GuncellemeNedeniPlaceholder")}
                    onChange={(e) => setassingDesc(e.target.value)}
                    rows={5}
                    className="rounded-xl border-slate-200 bg-white focus-visible:border-[#3e5d8f]/40 focus-visible:ring-2 focus-visible:ring-[#3e5d8f]/8 resize-none"
                  />

                  <div>
                    <p className="mb-2 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                      {t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.IlgiliKisilerTicketGuncellendigindeBilgilendirmeGidecektir")}
                    </p>
                    <MultiUserSearchCombobox
                      values={selectedIlgiliPerson}
                      onChange={(users) => {
                        setSelectedIlgiliPerson(users);
                        setSelectionIlgiliPerson(users.map((u) => u.id));
                      }}
                      onSearch={handleSearchByName}
                      results={searchByName}
                      placeholder={t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.KullancilarPlaceholder")}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Tab 2 action buttons */}
              {canEdit && (
                <div className="flex items-center justify-end gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/solveAllTicket/")}
                    disabled={!canEdit}
                    className="h-9 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 px-5 transition-all"
                  >
                    {t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Iptal")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAssignTicket}
                    disabled={!canEdit}
                    className="h-9 rounded-xl bg-[#3e5d8f] hover:bg-[#324d7a] text-white px-6 font-semibold shadow-md shadow-[#3e5d8f]/20 transition-all hover:shadow-lg hover:shadow-[#3e5d8f]/25"
                  >
                    {t("ns1:TicketDetailPage.GenelAtalamalar.InputProps.Kaydet")}
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </DashboardLayout>
  );
}

export default CreateRequest;
