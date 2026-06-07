import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { KANBAN_COLUMNS, TYPE_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./types/kanban.types";
import KanbanBoard from "./components/KanbanBoard";
import AllProjectsBoard from "./components/AllProjectsBoard";
import ProjectFilterDialog from "./components/ProjectFilterDialog";
import PeopleStatsView from "./components/PeopleStatsView";
// import KanbanCalendarView from "./components/KanbanCalendarView"; // takvim görünümü devre dışı
import KanbanStatsDialog from "./components/KanbanStatsDialog";
import { useProjectCatalog } from "./hooks/useProjectCatalog";
import { buildPersonStats } from "./utils/buildPersonStats";
import { isOverdue, isDueToday, isDueThisWeek, formatDueDate, getDueDateStatus } from "./utils/dueDateHelpers";

import {
  KanbanApi,
  KanbanTasksInsertDto,
  KanbanTasksListDto,
  KanbanTasksUpdateDto,
  UserApi,
  UserAppDtoWithoutPhoto,
  UserCalendarApi,
  TicketProjectsListDto,
} from "api/generated";
import { KanbanTasksListDtoFixed } from "./utils/fetchKanbanData";
import getConfiguration from "confiuration";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import { isGuid } from "./utils/kanbanHelpers";
import {
  Plus,
  Search,
  X,
  LayoutGrid,
  List,
  Layers,
  Users,
  Tag,
  SlidersHorizontal,
  AlertTriangle,
  User,
  Folder,
  Check,
  ChevronDown,
  ChevronUp,
  // CalendarDays, // takvim görünümü devre dışı
  CalendarClock,
  Clock,
  BarChart2,
} from "lucide-react";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";
import KanbanTaskPanel from "./components/KanbanTaskPanel";


// ─── Type colour map ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Task: "#3b82f6",
  "Proje Planlama": "#8b5cf6",
  Proje: "#8b5cf6",
  Destek: "#f59e0b",
  CR: "#6366f1",
  Bug: "#ef4444",
  Günlük: "#22c55e",
  Ticket: "#0ea5e9",
};

// ─── Priority colour map ──────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  "Release Breaker": "#dc2626",
  High: "#f59e0b",
  Normal: "#3b82f6",
  Low: "#22c55e",
};

// ─── Project label helper ─────────────────────────────────────────────────────

const getProjectLabel = (p: TicketProjectsListDto) =>
  p.subProjectName ? `${p.name} - ${p.subProjectName}` : p.name ?? "";


// ─── List-view table ──────────────────────────────────────────────────────────

type ListSortCol =
  | "Summary"
  | "Type"
  | "Priority"
  | "Status"
  | "Assignee"
  | "dueDate"
  | "createdDate"
  | "projectName";

type ListSortDir = "asc" | "desc";

const LIST_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const PRIORITY_SORT_ORDER: Record<string, number> = {
  "Release Breaker": 0,
  Critical: 1,
  High: 2,
  Normal: 3,
  Low: 4,
};

const ListView = ({
  data,
  showProjectName = false,
  onRowClick,
}: {
  data: KanbanTasksListDtoFixed[];
  showProjectName?: boolean;
  onRowClick?: (row: KanbanTasksListDtoFixed) => void;
}) => {
  const [sortCol, setSortCol] = useState<ListSortCol>("createdDate");
  const [sortDir, setSortDir] = useState<ListSortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  useEffect(() => { setPage(1); }, [data]);

  const handleSortCol = (col: ListSortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sorted = useMemo(() => [...data].sort((a, b) => {
    let cmp = 0;
    switch (sortCol) {
      case "Summary":     cmp = (a.Summary ?? "").localeCompare(b.Summary ?? "", "tr"); break;
      case "Type":        cmp = (a.Type ?? "").localeCompare(b.Type ?? "", "tr"); break;
      case "Priority":    cmp = (PRIORITY_SORT_ORDER[a.Priority] ?? 99) - (PRIORITY_SORT_ORDER[b.Priority] ?? 99); break;
      case "Status":      cmp = (a.Status ?? "").localeCompare(b.Status ?? "", "tr"); break;
      case "Assignee":    cmp = (a.Assignee ?? "").localeCompare(b.Assignee ?? "", "tr"); break;
      case "projectName": cmp = (a.projectName ?? "").localeCompare(b.projectName ?? "", "tr"); break;
      case "dueDate":     cmp = (a.dueDate ?? "").localeCompare(b.dueDate ?? ""); break;
      case "createdDate": cmp = (a.createdDate ?? "").localeCompare(b.createdDate ?? ""); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  }), [data, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);
  const colSpanCount = showProjectName ? 8 : 7;

  const getSortIcon = (col: ListSortCol) => {
    if (sortCol !== col)
      return <ChevronDown className="w-3 h-3 opacity-20" aria-hidden />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-indigo-500" aria-hidden />
      : <ChevronDown className="w-3 h-3 text-indigo-500" aria-hidden />;
  };

  const renderSortableTh = (col: ListSortCol, label: string) => (
    <th
      key={col}
      className="px-4 py-3 text-left cursor-pointer select-none hover:text-indigo-600 transition-colors"
      onClick={() => handleSortCol(col)}
      aria-sort={sortCol === col ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="inline-flex items-center gap-1 text-xs uppercase font-semibold tracking-wide">
        {label}
        {getSortIcon(col)}
      </span>
    </th>
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
              {renderSortableTh("Summary", "Özet")}
              {showProjectName && renderSortableTh("projectName", "Proje")}
              {renderSortableTh("Type", "Tür")}
              {renderSortableTh("Priority", "Öncelik")}
              {renderSortableTh("Status", "Durum")}
              {renderSortableTh("Assignee", "Atanan")}
              {renderSortableTh("dueDate", "Son Tarih")}
              {renderSortableTh("createdDate", "Oluşturulma")}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={colSpanCount} className="px-4 py-10 text-center text-slate-400 text-xs">
                  Görev bulunamadı
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const dueSt = getDueDateStatus(row);
                const rowOverdue = dueSt === "overdue";
                return (
                  <tr
                    key={row.Id}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => e.key === "Enter" && onRowClick?.(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    aria-label={onRowClick ? `${row.Summary} görevini düzenle` : undefined}
                    className={cn(
                      "border-b border-slate-100 transition-colors",
                      rowOverdue && "bg-red-50/40",
                      onRowClick && "hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:bg-indigo-50/60",
                    )}
                  >
                    <td className="px-4 py-3 text-slate-700 font-medium max-w-xs truncate">
                      {row.Summary}
                    </td>
                    {showProjectName && (
                      <td className="px-4 py-3">
                        {row.projectName ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap">
                            <Folder className="w-3 h-3 shrink-0" aria-hidden />
                            {row.projectName}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${TYPE_COLORS[row.Type] ?? "#94a3b8"}18`,
                          color: TYPE_COLORS[row.Type] ?? "#64748b",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[row.Type] ?? "#94a3b8" }}
                        />
                        {row.Type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: PRIORITY_COLORS[row.Priority] ?? "#64748b" }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: PRIORITY_COLORS[row.Priority] ?? "#94a3b8" }}
                        />
                        {row.Priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200">
                        {row.Status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {(row.Assignee ?? "?")[0]?.toUpperCase()}
                        </div>
                        <span className="text-slate-600 text-xs">{row.Assignee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.dueDate ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold",
                          dueSt === "overdue"  && "text-red-600",
                          dueSt === "dueToday" && "text-orange-500",
                          dueSt === "dueSoon"  && "text-amber-600",
                          dueSt === "ok"       && "text-slate-500",
                        )}>
                          {(dueSt === "overdue" || dueSt === "dueToday") && (
                            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden />
                          )}
                          {formatDueDate(row.dueDate)}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {row.createdDate
                        ? new Date(row.createdDate).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Sayfa başı:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              aria-label="Sayfa başı kayıt sayısı"
              className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {LIST_PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="text-slate-400 tabular-nums">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} / {sorted.length} görev
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="İlk sayfa"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >«</button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Önceki sayfa"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >‹</button>

            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p as number)}
                  aria-label={`Sayfa ${p}`}
                  aria-current={page === p ? "page" : undefined}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors border",
                    page === p
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >{p}</button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Sonraki sayfa"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >›</button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              aria-label="Son sayfa"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM = {
  Status: "Backlog",
  Type: "Task",
  Priority: "Normal",
  Assignee: "",
  AssigneeId: "",
  Summary: "",
  Description: "",
  Tags: "",
  RankId: "1",
  projectId: "",
  dueDate: "",
};

// ─── Selection step type ──────────────────────────────────────────────────────

// ─── View context type ────────────────────────────────────────────────────────

type ViewContext = "single" | "all-projects" | "no-project";

// ─── Page component ───────────────────────────────────────────────────────────

function KanbanPage() {
  const location = useLocation();
  const selectedRadioRef = useRef<number>(2);

  // ── Project filter dialog state ───────────────────────────────────────────
  const [projectFilterOpen, setProjectFilterOpen] = useState(false);

  // ── Project selection state ───────────────────────────────────────────────
  const [selectedTicketProject, setSelectedTicketProject] = useState<TicketProjectsListDto | null>(null);

  // ── Board data ────────────────────────────────────────────────────────────
  const [assigneeData, setAssigneeData] = useState<UserAppDtoWithoutPhoto[]>([]);
  const [allData, setAllData] = useState<KanbanTasksListDtoFixed[]>([]);
  const [filteredData, setFilteredData] = useState<KanbanTasksListDtoFixed[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>("All");
  const [currentPriorityFilter, setCurrentPriorityFilter] = useState<string>("All");
  const [currentAssigneeFilter, setCurrentAssigneeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRadio, setSelectedRadio] = useState<number>(2);
  const [hasPerm, setHasPerm] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "people">("kanban");
  const [viewContext] = useState<ViewContext>("all-projects");
  const [currentProjectFilter, setCurrentProjectFilter] = useState<string>("All");
  const [currentDueDateFilter, setCurrentDueDateFilter] = useState<"All" | "overdue" | "today" | "thisWeek" | "noDueDate">("All");
  const [isMobile, setIsMobile] = useState(false);

  // ── Assignee search in sidebar ────────────────────────────────────────────
  const [assigneeSearch, setAssigneeSearch] = useState<string>("");

  // ── Board area height ─────────────────────────────────────────────────────
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [boardAreaHeight, setBoardAreaHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (!boardAreaRef.current) return;
      const top = boardAreaRef.current.getBoundingClientRect().top;
      setBoardAreaHeight(Math.floor(window.innerHeight - top));
    };
    const raf = requestAnimationFrame(updateHeight);
    window.addEventListener("resize", updateHeight);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // ── Mobile sidebar state ──────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Stats dialog state ────────────────────────────────────────────────────
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  // ── Custom dialog state ───────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogForm, setDialogForm] = useState({ ...DEFAULT_FORM });
  const [editCardId, setEditCardId] = useState<string>("");
  const [editCardCreatorId, setEditCardCreatorId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [dialogErrors, setDialogErrors] = useState<Record<string, string>>({});

  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  // ── Keep ref in sync ──────────────────────────────────────────────────────

  useEffect(() => {
    selectedRadioRef.current = selectedRadio;
  }, [selectedRadio]);

  // ── Mobile detection ──────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 800);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Support navigating in with a pre-selected project (deep-link) ────────

  useEffect(() => {
    if (location.state?.selectedTicketProject) {
      const proj = location.state.selectedTicketProject as TicketProjectsListDto;
      setSelectedTicketProject(proj);
      if (proj?.id) setCurrentProjectFilter(proj.id);
    }
  }, [location.state]);

  // ── Permissions + current user identity ──────────────────────────────────

  useEffect(() => {
    const fetchHasPerm = async () => {
      try {
        const api = new UserCalendarApi(getConfiguration());
        const res = await api.apiUserCalendarCheckOtherDeptpermGet();
        setHasPerm(res.data.perm);
      } catch {}
    };
    const fetchIsManager = async () => {
      try {
        const api = new UserCalendarApi(getConfiguration());
        const res = await api.apiUserCalendarCheckUserIsManagerGet();
        setIsManager(res.data.perm);
      } catch {}
    };
    const fetchCurrentUser = async () => {
      try {
        const api = new UserApi(getConfiguration());
        const [userRes, adminRes] = await Promise.all([
          api.apiUserGetLoginUserGet(),
          api.apiUserCheckIsAdminGet(),
        ]);
        setCurrentUserId(userRes.data.id);
        setIsAdminUser(adminRes.data);
      } catch {}
    };
    fetchHasPerm();
    fetchIsManager();
    fetchCurrentUser();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const count = (status: string) => filteredData.filter((d) => d.Status === status).length;
    const total = filteredData.length;
    const doneCount = count("Done");
    const criticalCount = filteredData.filter(
      (d) => d.Priority === "Critical" || d.Priority === "Release Breaker"
    ).length;
    const overdueCount = filteredData.filter((d) => isOverdue(d)).length;
    return {
      toplam: total,
      backlog: count("Backlog"),
      realization: count("Realization"),
      uat: count("UAT"),
      preparation: count("Preparation"),
      done: doneCount,
      donePercent: total > 0 ? Math.round((doneCount / total) * 100) : 0,
      criticalCount,
      overdueCount,
    };
  }, [filteredData]);

  // ── allData pre-filtered by the active project filter (used for sidebar counts) ──

  const sidebarBaseData = useMemo(() => {
    if (currentProjectFilter === "All") return allData;
    if (currentProjectFilter === "__no_project__")
      return allData.filter((d) => !d.projectId);
    return allData.filter((d) => d.projectId === currentProjectFilter);
  }, [allData, currentProjectFilter]);

  // ── Unique types from loaded data ─────────────────────────────────────────

  const uniqueTypes = useMemo(() => {
    const types = new Set(sidebarBaseData.map((d) => d.Type).filter(Boolean));
    return Array.from(types);
  }, [sidebarBaseData]);

  // ── Data fetchers ─────────────────────────────────────────────────────────

  const fetchUsers = async (withBusy = true) => {
    try {
      if (withBusy) dispatchBusy({ isBusy: true });
      const api = new KanbanApi(getConfiguration());
      const res = await api.apiKanbanGetUsersByAdminAndManagerGet();
      setAssigneeData(res.data);
      if (withBusy) dispatchBusy({ isBusy: false });
    } catch (error) {
      console.log(error);
      if (withBusy) dispatchBusy({ isBusy: false });
    }
  };

  const fetchedKanbanData = async (withBusy = true, projectId?: string | null) => {
    try {
      if (withBusy) dispatchBusy({ isBusy: true });
      const api = new KanbanApi(getConfiguration());
      const response = await api.apiKanbanGet(selectedRadioRef.current, projectId ?? undefined);
      console.log("response.data", response.data);
      if (response.data.length > 0) {
        const fixedData = response.data.map((item: KanbanTasksListDto) => ({
          Id: item.id,
          Assignee: item.assignee.firstName + " " + item.assignee.lastName,
          AssigneeId: item.assignee.id,
          RankId: item.rankId,
          Priority: item.priority,
          Status: item.status,
          Tags: item.tags,
          Type: item.type,
          Description: item.description,
          Summary: item.summary,
          creatorId: item.creatorId,
          projectId: item.projectId,
          createdDate: item.createdDate ?? null,
          projectName: item.projectName ?? null,
          dueDate: item.dueDate ?? null,
        }));
        setAllData(fixedData);
        setFilteredData(fixedData);
      } else {
        setAllData([]);
        setFilteredData([]);
      }
      if (withBusy) dispatchBusy({ isBusy: false });
    } catch (error) {
      console.error("Error fetching kanban data:", error);
      if (withBusy) dispatchBusy({ isBusy: false });
    }
  };

  const deleteKanbanData = useCallback(async (id: string) => {
    if (!isGuid(id)) return false;
    try {
      dispatchBusy({ isBusy: true });
      const api = new KanbanApi(getConfiguration());
      await api.apiKanbanDelete(id);
      await fetchedKanbanData(false, selectedTicketProject?.id ?? null);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      console.error("Error deleting kanban data:", error);
      dispatchBusy({ isBusy: false });
    }
  }, [selectedTicketProject]);

  const updateKanbanData = useCallback(async (card: KanbanTasksListDtoFixed) => {
    const requiredFields: Record<string, string> = {
      Id: card.Id,
      Status: card.Status,
      Summary: card.Summary,
      Assignee: card.Assignee,
      creatorId: card.creatorId,
      Priority: card.Priority,
      RankId: card.RankId,
      Type: card.Type,
    };
    for (const [fieldName, fieldValue] of Object.entries(requiredFields)) {
      if (!fieldValue || fieldValue.trim() === "") {
        dispatchAlert({ message: `${fieldName} Boş olamaz`, type: "Error" });
        return;
      }
    }
    try {
      dispatchBusy({ isBusy: true });
      const api = new KanbanApi(getConfiguration());
      const fixedUpdateCard: KanbanTasksUpdateDto = {
        id: card.Id,
        assigneId: card.AssigneeId,
        rankId: card.RankId,
        priority: card.Priority,
        status: card.Status,
        tags: card.Tags,
        type: card.Type,
        description: card.Description,
        summary: card.Summary,
        creatorId: card.creatorId,
        dueDate: card.dueDate || null,
        projectId: card.Type === "Proje Planlama"
          ? (card.projectId || null)
          : selectedTicketProject?.id ?? null,
      };
      await api.apiKanbanPut(fixedUpdateCard);
      await fetchedKanbanData(false, selectedTicketProject?.id ?? null);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      console.error("Error updating kanban data:", error);
      dispatchBusy({ isBusy: false });
    }
  }, [selectedTicketProject]);

  const addKanbanData = useCallback(async (card: any) => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new KanbanApi(getConfiguration());
      const fixedCard: KanbanTasksInsertDto = {
        assigneId: card.AssigneeId,
        rankId: card.RankId,
        priority: card.Priority,
        status: card.Status,
        tags: card.Tags,
        type: card.Type,
        description: card.Description,
        summary: card.Summary,
        dueDate: card.dueDate || null,
        projectId: card.Type === "Proje Planlama"
          ? (card.projectId || null)
          : selectedTicketProject?.id ?? null,
      };
      await api.apiKanbanPost(fixedCard);
      await fetchedKanbanData(false, selectedTicketProject?.id ?? null);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      console.error("Error adding kanban data:", error);
      dispatchBusy({ isBusy: false });
    }
  }, [selectedTicketProject]);

  // ── Custom dialog helpers ─────────────────────────────────────────────────

  const openAddDialog = () => {
    setDialogForm({ ...DEFAULT_FORM });
    setEditCardId("");
    setEditCardCreatorId("");
    setDialogErrors({});
    setDialogMode("add");
    setDialogOpen(true);
  };

  const openEditDialog = (card: KanbanTasksListDtoFixed) => {
    setDialogForm({
      Status: card.Status || "Backlog",
      Type: card.Type || "Task",
      Priority: card.Priority || "Normal",
      Assignee: card.Assignee || "",
      AssigneeId: card.AssigneeId || "",
      Summary: card.Summary || "",
      Description: card.Description || "",
      Tags: card.Tags || "",
      RankId: String(card.RankId ?? 1),
      projectId: card.projectId ?? "",
      dueDate: card.dueDate ? card.dueDate.split("T")[0] : "",
    });
    setEditCardId(card.Id || "");
    setEditCardCreatorId(card.creatorId || "");
    setDialogErrors({});
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const validateDialogForm = () => {
    const required: (keyof typeof dialogForm)[] = [
      "Status", "Type", "Priority", "Assignee", "AssigneeId", "Summary",
    ];
    const errors: Record<string, string> = {};
    for (const key of required) {
      if (!dialogForm[key]?.trim()) errors[key] = `${key} zorunludur`;
    }
    setDialogErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDialogSave = async () => {
    if (!validateDialogForm()) return;
    if (dialogMode === "add") {
      await addKanbanData(dialogForm);
    } else {
      await updateKanbanData({
        Id: editCardId,
        creatorId: editCardCreatorId,
        RankId: dialogForm.RankId,
        ...dialogForm,
      } as KanbanTasksListDtoFixed);
    }
    setDialogOpen(false);
  };

  const handleDialogDelete = async () => {
    if (!editCardId || !isGuid(editCardId)) return;
    await deleteKanbanData(editCardId);
    setDialogOpen(false);
  };

  // ── Project filter dialog handler ─────────────────────────────────────────

  const handleProjectFilterApply = (filterId: string, project?: TicketProjectsListDto | null) => {
    setSelectedTicketProject(project ?? null);
    setCurrentProjectFilter(filterId);
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, filterId, currentDueDateFilter);
  };

  // ── Board handlers ────────────────────────────────────────────────────────

  const handleAddCard = () => openAddDialog();

  const handleCardStatusChange = async (card: KanbanTasksListDtoFixed) => {
    await updateKanbanData(card);
  };

  const handleCardClick = (card: KanbanTasksListDtoFixed) => {
    openEditDialog(card);
  };

  const handleFilterChange = useCallback(
    (filter: string) => {
      setCurrentFilter(filter);
      applyFilters(filter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, currentDueDateFilter);
    },
    [searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, currentDueDateFilter]
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(currentFilter, term, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, currentDueDateFilter);
  };

  const handlePriorityFilter = (priority: string) => {
    setCurrentPriorityFilter(priority);
    applyFilters(currentFilter, searchTerm, priority, currentAssigneeFilter, currentProjectFilter, currentDueDateFilter);
  };

  const handleAssigneeFilter = (assigneeId: string) => {
    setCurrentAssigneeFilter(assigneeId);
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, assigneeId, currentProjectFilter, currentDueDateFilter);
  };

  const handleProjectFilter = (projectId: string) => {
    setCurrentProjectFilter(projectId);
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, projectId, currentDueDateFilter);
  };

  const handleDueDateFilter = (dueDateFilter: "All" | "overdue" | "today" | "thisWeek" | "noDueDate") => {
    setCurrentDueDateFilter(dueDateFilter);
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, dueDateFilter);
  };

  const applyFilters = (
    filter: string,
    search: string,
    priority: string,
    assigneeId: string,
    projectFilter: string = "All",
    dueDateFilter: "All" | "overdue" | "today" | "thisWeek" | "noDueDate" = "All",
  ) => {
    if (!allData || allData.length === 0) return;
    let filtered = allData;
    if (filter !== "All" && filter !== "") {
      filtered = filtered.filter((item) => item.Type === filter);
    }
    if (priority !== "All") {
      filtered = filtered.filter((item) => item.Priority === priority);
    }
    if (assigneeId !== "All") {
      filtered = filtered.filter((item) => item.AssigneeId === assigneeId);
    }
    if (projectFilter === "__no_project__") {
      filtered = filtered.filter((item) => !item.projectId);
    } else if (projectFilter !== "All") {
      filtered = filtered.filter((item) => item.projectId === projectFilter);
    }
    if (dueDateFilter === "overdue") {
      filtered = filtered.filter((item) => isOverdue(item));
    } else if (dueDateFilter === "today") {
      filtered = filtered.filter((item) => isDueToday(item));
    } else if (dueDateFilter === "thisWeek") {
      filtered = filtered.filter((item) => isDueThisWeek(item));
    } else if (dueDateFilter === "noDueDate") {
      filtered = filtered.filter((item) => !item.dueDate);
    }
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.Summary.toLowerCase().includes(searchLower) ||
          item.Description?.toLowerCase().includes(searchLower) ||
          item.Tags.toLowerCase().includes(searchLower) ||
          item.Assignee.toLowerCase().includes(searchLower)
      );
    }
    setFilteredData(filtered);
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      dispatchBusy({ isBusy: true });
      await Promise.all([fetchUsers(false), fetchedKanbanData(false, null)]);
      dispatchBusy({ isBusy: false });
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, currentDueDateFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, currentDueDateFilter, allData, selectedRadio]);

  useEffect(() => {
    const fetchData = async () => {
      dispatchBusy({ isBusy: true });
      await fetchedKanbanData(false, null);
      dispatchBusy({ isBusy: false });
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRadio]);

  // ── Sidebar filter items ──────────────────────────────────────────────────

  const radioItems = [
    { value: 1, label: "Kendim" },
    ...(isAdminUser || isManager || hasPerm ? [{ value: 2, label: "Ekibim" }] : []),
    ...(isAdminUser ? [{ value: 3, label: "Herkes" }] : []),
  ];

  const typeItems = ["All", ...uniqueTypes];
  const priorityItems = ["All", ...PRIORITY_OPTIONS];

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of sidebarBaseData) {
      if (d.AssigneeId && d.Assignee) map.set(d.AssigneeId, d.Assignee);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sidebarBaseData]);

  const personStats = useMemo(() => buildPersonStats(filteredData), [filteredData]);

  const handlePersonClick = useCallback(
    (userId: string) => {
      setCurrentAssigneeFilter(userId);
      applyFilters(currentFilter, searchTerm, currentPriorityFilter, userId, currentProjectFilter, currentDueDateFilter);
      setViewMode("kanban");
    },
    [currentFilter, searchTerm, currentPriorityFilter, currentProjectFilter, currentDueDateFilter]
  );


  // ── Project catalog (for filter dialog) ──────────────────────────────────
  const { projects: catalogProjects, companies: catalogCompanies, loading: catalogLoading, taskStats, noProjectStats } = useProjectCatalog(allData);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 156px)" }}>

        {/* ── Kanban board ──────────────────────────────────────────────── */}
        <div className="flex h-full w-full overflow-hidden">

              {/* ── Mobile backdrop ── */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* ── Left sidebar ── */}
              <aside
                className={cn(
                  "flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out",
                  "fixed inset-y-0 left-0 z-50 w-72 shadow-xl",
                  sidebarOpen ? "translate-x-0" : "-translate-x-full",
                  "lg:translate-x-0 lg:sticky lg:top-0 lg:self-start lg:w-52 lg:shrink-0 lg:shadow-none lg:z-auto lg:inset-y-auto lg:left-auto"
                )}
                style={{ height: "100%" }}
              >
           

                {/* Filter sections */}
                <div className="mt-1 flex-1 overflow-y-auto pt-3 space-y-5 px-2">

                  {/* ARAMA */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Görev ara..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      aria-label="Görevlerde ara"
                      className="w-full h-8 pl-9 pr-8 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => handleSearch("")}
                        aria-label="Aramayı temizle"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* EKİPLER */}
                  <div>
                      <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Ekipler
                      </p>
                      <div className="space-y-0.5">
                        {radioItems.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSelectedRadio(value)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                              selectedRadio === value
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {selectedRadio === value && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            )}
                            {label}
                          </button>
                        ))}
                      </div>
                  </div>

                  {/* TÜR */}
                  <div>
                    <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Tür
                    </p>
                    <div className="space-y-0.5">
                      {typeItems.map((type) => {
                        const color = TYPE_COLORS[type];
                        const isActive = currentFilter === type;
                        const typeCount = type === "All"
                          ? sidebarBaseData.length
                          : sidebarBaseData.filter((d) => d.Type === type).length;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleFilterChange(type)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                              isActive
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {type !== "All" ? (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: color ?? "#94a3b8" }}
                              />
                            ) : (
                              <span className="w-2 h-2 rounded-full shrink-0 bg-slate-300" />
                            )}
                            <span className="flex-1 truncate">{type === "All" ? "Tümü" : type}</span>
                            <span className={cn(
                              "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
                              isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                            )}>
                              {typeCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ÖNCELİK */}
                  <div>
                    <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      Öncelik
                    </p>
                    <div className="space-y-0.5">
                      {priorityItems.map((priority) => {
                        const color = PRIORITY_COLORS[priority];
                        const isActive = currentPriorityFilter === priority;
                        const pCount = priority === "All"
                          ? sidebarBaseData.length
                          : sidebarBaseData.filter((d) => d.Priority === priority).length;
                        return (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => handlePriorityFilter(priority)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                              isActive
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {priority !== "All" ? (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: color ?? "#94a3b8" }}
                              />
                            ) : (
                              <span className="w-2 h-2 rounded-full shrink-0 bg-slate-300" />
                            )}
                            <span className="flex-1 truncate">{priority === "All" ? "Tümü" : priority}</span>
                            <span className={cn(
                              "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
                              isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                            )}>
                              {pCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ATANAN KİŞİ */}
                  {uniqueAssignees.length > 0 && (
                    <div>
                      <div className="px-2 mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          Atanan
                        </p>
                        {currentAssigneeFilter !== "All" && (
                          <button
                            type="button"
                            onClick={() => handleAssigneeFilter("All")}
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                            aria-label="Atanan filtresini temizle"
                          >
                            Temizle
                          </button>
                        )}
                      </div>

                      <div className="relative mx-1 mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Kişi ara..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          className="w-full h-7 pl-7 pr-6 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                        />
                        {assigneeSearch && (
                          <button
                            type="button"
                            onClick={() => setAssigneeSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="Aramayı temizle"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleAssigneeFilter("All")}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                            currentAssigneeFilter === "All"
                              ? "bg-indigo-50 text-indigo-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                            ∗
                          </span>
                          <span className="flex-1 truncate">Tümü</span>
                          <span className={cn(
                            "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
                            currentAssigneeFilter === "All" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {sidebarBaseData.length}
                          </span>
                        </button>

                        {(() => {
                          const filtered = uniqueAssignees.filter(({ name }) =>
                            !assigneeSearch || name.toLowerCase().includes(assigneeSearch.toLowerCase())
                          );
                          const visible = assigneeSearch ? filtered.slice(0, 3) : filtered.slice(0, 2);
                          const hiddenCount = assigneeSearch ? 0 : filtered.length - 2;

                          return (
                            <>
                              {visible.map(({ id, name }) => {
                                const isActive = currentAssigneeFilter === id;
                                const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
                                const aCount = sidebarBaseData.filter((d) => d.AssigneeId === id).length;
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={() => handleAssigneeFilter(id)}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                                      isActive
                                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                                        : "text-slate-600 hover:bg-slate-50"
                                    )}
                                  >
                                    <span className={cn(
                                      "w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ring-1 ring-white",
                                      isActive ? "bg-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-600"
                                    )}>
                                      {initials || "?"}
                                    </span>
                                    <span className="flex-1 truncate text-xs">{name}</span>
                                    <span className={cn(
                                      "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
                                      isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                      {aCount}
                                    </span>
                                  </button>
                                );
                              })}

                              {hiddenCount > 0 && (
                                <div
                                  className="px-3 pt-1 pb-0.5 flex items-center gap-1.5 cursor-default"
                                  title={filtered.slice(2).map((a) => a.name).join("\n")}
                                >
                                  <div className="flex -space-x-1.5 shrink-0">
                                    {filtered.slice(2, 5).map(({ id, name }) => {
                                      const ini = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
                                      return (
                                        <span
                                          key={id}
                                          className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[8px] font-bold flex items-center justify-center ring-1 ring-white shrink-0"
                                        >
                                          {ini || "?"}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    +{hiddenCount} kişi daha
                                  </span>
                                  <span className="text-[10px] text-slate-300">· aramayı kullan</span>
                                </div>
                              )}

                              {assigneeSearch && filtered.length === 0 && (
                                <p className="px-3 py-2.5 text-xs text-slate-400 text-center">
                                  Kişi bulunamadı
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* SON TARİH */}
                  <div>
                    <div className="px-2 mb-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarClock className="w-3 h-3" />
                        Son Tarih
                      </p>
                      {currentDueDateFilter !== "All" && (
                        <button
                          type="button"
                          onClick={() => handleDueDateFilter("All")}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                          aria-label="Tarih filtresini temizle"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {([
                        { key: "All",       label: "Tümü",          icon: null,          count: sidebarBaseData.length },
                        { key: "overdue",   label: "Gecikmiş",      icon: "red",         count: sidebarBaseData.filter((d) => isOverdue(d)).length },
                        { key: "today",     label: "Bugün",         icon: "orange",      count: sidebarBaseData.filter((d) => isDueToday(d)).length },
                        { key: "thisWeek",  label: "Bu Hafta",      icon: "amber",       count: sidebarBaseData.filter((d) => isDueThisWeek(d)).length },
                        { key: "noDueDate", label: "Tarihsiz",      icon: "slate",       count: sidebarBaseData.filter((d) => !d.dueDate).length },
                      ] as const).map(({ key, label, icon, count }) => {
                        const isActive = currentDueDateFilter === key;
                        const dotColor = icon === "red" ? "bg-red-400" : icon === "orange" ? "bg-orange-400" : icon === "amber" ? "bg-amber-400" : "bg-slate-300";
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleDueDateFilter(key as typeof currentDueDateFilter)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                              isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
                            <span className="flex-1 truncate">{label}</span>
                            <span className={cn(
                              "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
                              isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                            )}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </aside>

              {/* ── Main content ── */}
              <div className="flex-1 min-w-0 flex flex-col bg-slate-50 overflow-hidden">

                {/* Top header bar */}
                <div className="sticky top-0 z-10 shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">

                  {/* Mobile: filter toggle */}
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    aria-label="Filtreleri göster"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  {/* Project chip + stats */}
                  <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none">

                    {/* Proje Filtre chip — dialog trigger */}
                    <button
                      type="button"
                      onClick={() => setProjectFilterOpen(true)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setProjectFilterOpen(true)}
                      aria-label="Proje filtrele"
                      className="shrink-0 flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    >
                      <Folder className="w-3 h-3" aria-hidden />
                      <span className="max-w-[160px] truncate">
                        {currentProjectFilter === "All"
                          ? "Tüm Projeler"
                          : currentProjectFilter === "__no_project__"
                            ? "Genel"
                            : selectedTicketProject
                              ? getProjectLabel(selectedTicketProject)
                              : "Proje Seçili"}
                      </span>
                      <span className="text-[10px] font-bold tabular-nums text-indigo-400">
                        · {filteredData.length}
                      </span>
                      <ChevronDown className="w-3 h-3 text-indigo-400 shrink-0" aria-hidden />
                    </button>

                    <span className="hidden sm:block w-px h-6 bg-slate-200 shrink-0" />

                    {/* ── Mini stat chips ── */}
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="flex flex-col items-center min-w-[36px]">
                        <span className="text-base font-extrabold leading-none tabular-nums text-slate-700">{stats.toplam}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Toplam</span>
                      </span>
                      <span className="w-px h-6 bg-slate-100" />
                      <span className="flex flex-col items-center min-w-[36px]">
                        <span className="text-base font-extrabold leading-none tabular-nums text-emerald-600">{stats.donePercent}<span className="text-[10px] font-semibold text-slate-400">%</span></span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Tamam</span>
                      </span>
                    </div>

                    {/* ── Stats dialog trigger ── */}
                    <button
                      type="button"
                      onClick={() => setStatsDialogOpen(true)}
                      aria-label="İstatistikleri göster"
                      className="relative flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs font-semibold shadow-sm"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">İstatistikler</span>
                      {(stats.overdueCount > 0 || stats.criticalCount > 0) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-white" />
                      )}
                    </button>

                    {stats.overdueCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDueDateFilter(currentDueDateFilter === "overdue" ? "All" : "overdue")}
                        className={cn(
                          "hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 transition-colors",
                          currentDueDateFilter === "overdue"
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                        )}
                        aria-label="Gecikmiş görevleri filtrele"
                      >
                        <Clock className="w-3 h-3" />
                        {stats.overdueCount} Gecikmiş
                      </button>
                    )}
                  </div>

                  {/* View toggle + Add */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">

                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode("kanban")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 transition-colors font-medium",
                          viewMode === "kanban"
                            ? "bg-slate-800 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Kanban
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 transition-colors font-medium border-l border-slate-200",
                          viewMode === "list"
                            ? "bg-slate-800 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <List className="w-3.5 h-3.5" />
                        Liste
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("people")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 transition-colors font-medium border-l border-slate-200",
                          viewMode === "people"
                            ? "bg-slate-800 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Kişiler
                      </button>
                      {/* Takvim görünümü şu an devre dışı
                      <button
                        type="button"
                        onClick={() => setViewMode("calendar")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 transition-colors font-medium border-l border-slate-200",
                          viewMode === "calendar"
                            ? "bg-slate-800 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Takvim
                      </button>
                      */}
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddCard}
                      className="h-8 px-3 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Görev Ekle
                    </Button>
                  </div>
                </div>


                {/* Board / List area */}
                <div
                  ref={boardAreaRef}
                  className="p-4 overflow-y-auto flex-1"
                  style={boardAreaHeight > 0 ? { height: boardAreaHeight } : undefined}
                >
                  {/* Takvim görünümü şu an devre dışı
                  {viewMode === "calendar" ? (
                    <KanbanCalendarView tasks={filteredData} onTaskClick={handleCardClick} />
                  ) : */ viewMode === "list" ? (
                    <ListView data={filteredData} showProjectName={viewContext !== "no-project"} onRowClick={handleCardClick} />
                  ) : viewMode === "people" ? (
                    <PeopleStatsView stats={personStats} onPersonClick={handlePersonClick} />
                  ) : viewContext === "all-projects" ? (
                    filteredData.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-16">Görev bulunamadı</p>
                    ) : (
                      <AllProjectsBoard
                        data={filteredData}
                        columns={KANBAN_COLUMNS}
                        isMobile={isMobile}
                        onCardStatusChange={handleCardStatusChange}
                        onCardClick={handleCardClick}
                      />
                    )
                  ) : (
                    <KanbanBoard
                      data={filteredData}
                      columns={KANBAN_COLUMNS}
                      isMobile={isMobile}
                      onCardStatusChange={handleCardStatusChange}
                      onCardClick={handleCardClick}
                    />
                  )}
                </div>
              </div>
        </div>
      </div>

      {/* ── Stats Dialog ── */}
      <KanbanStatsDialog
        open={statsDialogOpen}
        onOpenChange={setStatsDialogOpen}
        stats={stats}
        filteredData={filteredData}
        personStats={personStats}
      />

      {/* ── Project Filter Dialog ── */}
      <ProjectFilterDialog
        open={projectFilterOpen}
        onOpenChange={setProjectFilterOpen}
        companies={catalogCompanies}
        projects={catalogProjects}
        projectsLoading={catalogLoading}
        taskStats={taskStats}
        noProjectStats={noProjectStats}
        totalCards={allData.length}
        selectedFilter={currentProjectFilter}
        onApply={handleProjectFilterApply}
      />

      {/* ── Task Slide-over Panel ── */}
      <KanbanTaskPanel
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        form={dialogForm}
        setForm={setDialogForm}
        errors={dialogErrors}
        setErrors={setDialogErrors}
        assigneeData={assigneeData}
        catalogProjects={catalogProjects}
        catalogLoading={catalogLoading}
        canDelete={dialogMode === "edit" && (isAdminUser || currentUserId === editCardCreatorId)}
        onSave={handleDialogSave}
        onDelete={handleDialogDelete}
      />

    </DashboardLayout>
  );
}

export default KanbanPage;
