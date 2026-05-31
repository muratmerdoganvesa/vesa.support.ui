import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { KANBAN_COLUMNS, TYPE_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./types/kanban.types";
import KanbanBoard from "./components/KanbanBoard";
import AllProjectsBoard from "./components/AllProjectsBoard";
import ProjectFilterDialog from "./components/ProjectFilterDialog";
import { useProjectCatalog } from "./hooks/useProjectCatalog";

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
  Trash2,
  Save,
  SlidersHorizontal,
  AlertTriangle,
  User,
  Folder,
  Check,
  ChevronDown,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { cn } from "lib/utils";


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

// ─── Stat card with mini progress bar ────────────────────────────────────────

const StatCard = ({
  value,
  label,
  color,
  barColor,
  total,
}: {
  value: number;
  label: string;
  color: string;
  barColor: string;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col min-w-[52px] gap-0.5">
      <span className={cn("text-xl font-bold leading-none tabular-nums", color)}>
        {value}
      </span>
      <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
      <div className="mt-1 h-[3px] w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── List-view table ──────────────────────────────────────────────────────────

const ListView = ({
  data,
  showProjectName = false,
}: {
  data: KanbanTasksListDtoFixed[];
  showProjectName?: boolean;
}) => {
  const colSpanCount = showProjectName ? 7 : 6;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
            <th className="px-4 py-3 text-left">Özet</th>
            {showProjectName && <th className="px-4 py-3 text-left">Proje</th>}
            <th className="px-4 py-3 text-left">Tür</th>
            <th className="px-4 py-3 text-left">Öncelik</th>
            <th className="px-4 py-3 text-left">Durum</th>
            <th className="px-4 py-3 text-left">Atanan</th>
            <th className="px-4 py-3 text-left">Oluşturulma</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={colSpanCount} className="px-4 py-10 text-center text-slate-400 text-xs">
                Görev bulunamadı
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.Id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
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
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {row.createdDate
                    ? new Date(row.createdDate).toLocaleDateString("tr-TR")
                    : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [viewContext] = useState<ViewContext>("all-projects");
  const [currentProjectFilter, setCurrentProjectFilter] = useState<string>("All");
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
    return {
      toplam: total,
      backlog: count("Backlog"),
      realization: count("Realization"),
      uat: count("UAT"),
      preparation: count("Preparation"),
      done: doneCount,
      donePercent: total > 0 ? Math.round((doneCount / total) * 100) : 0,
      criticalCount,
    };
  }, [filteredData]);

  // ── Unique types from loaded data ─────────────────────────────────────────

  const uniqueTypes = useMemo(() => {
    const types = new Set(allData.map((d) => d.Type).filter(Boolean));
    return Array.from(types);
  }, [allData]);

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
        projectId: card.projectId ?? selectedTicketProject?.id ?? null,
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
        projectId: selectedTicketProject?.id ?? null,
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
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, filterId);
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
      applyFilters(filter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter);
    },
    [searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter]
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(currentFilter, term, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter);
  };

  const handlePriorityFilter = (priority: string) => {
    setCurrentPriorityFilter(priority);
    applyFilters(currentFilter, searchTerm, priority, currentAssigneeFilter, currentProjectFilter);
  };

  const handleAssigneeFilter = (assigneeId: string) => {
    setCurrentAssigneeFilter(assigneeId);
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, assigneeId, currentProjectFilter);
  };

  const handleProjectFilter = (projectId: string) => {
    setCurrentProjectFilter(projectId);
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, projectId);
  };

  const applyFilters = (
    filter: string,
    search: string,
    priority: string,
    assigneeId: string,
    projectFilter: string = "All",
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
    applyFilters(currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter);
  }, [currentFilter, searchTerm, currentPriorityFilter, currentAssigneeFilter, currentProjectFilter, allData, selectedRadio]);

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
    for (const d of allData) {
      if (d.AssigneeId && d.Assignee) map.set(d.AssigneeId, d.Assignee);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allData]);

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
                <div className="mt-1 flex-1 overflow-y-auto pt-4 space-y-5 px-2">

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
                          ? allData.length
                          : allData.filter((d) => d.Type === type).length;
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
                          ? allData.length
                          : allData.filter((d) => d.Priority === priority).length;
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
                            {allData.length}
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
                                const aCount = allData.filter((d) => d.AssigneeId === id).length;
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

                    <StatCard value={stats.toplam}      label="Toplam"      color="text-slate-700"   barColor="bg-slate-400"    total={stats.toplam} />
                    <StatCard value={stats.backlog}     label="Backlog"     color="text-slate-500"   barColor="bg-slate-400"    total={stats.toplam} />
                    <span className="hidden sm:block"><StatCard value={stats.realization} label="Realization" color="text-blue-600"    barColor="bg-blue-400"    total={stats.toplam} /></span>
                    <span className="hidden sm:block"><StatCard value={stats.uat}         label="UAT"         color="text-violet-600" barColor="bg-violet-400"  total={stats.toplam} /></span>
                    <span className="hidden md:block"><StatCard value={stats.preparation} label="Preparation" color="text-amber-600"  barColor="bg-amber-400"   total={stats.toplam} /></span>
                    <StatCard value={stats.done}        label="Done"        color="text-emerald-600" barColor="bg-emerald-400"  total={stats.toplam} />

                    <span className="hidden sm:block w-px h-8 bg-slate-200 shrink-0" />

                    <div className="hidden sm:flex flex-col items-center min-w-[44px] gap-0.5">
                      <span className="text-xl font-bold leading-none tabular-nums text-emerald-600">
                        {stats.donePercent}
                        <span className="text-sm font-semibold text-slate-400">%</span>
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">Tamamlandı</span>
                    </div>

                    {stats.criticalCount > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold shrink-0 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        {stats.criticalCount} Kritik
                      </span>
                    )}
                  </div>

                  {/* View toggle + Search + Add */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">

                    <div className="relative hidden sm:block w-48 lg:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full h-8 pl-9 pr-8 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => handleSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

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
                  {viewMode === "list" ? (
                    <ListView data={filteredData} showProjectName={viewContext !== "no-project"} />
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

      {/* ── Add / Edit dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Yeni Görev Ekle" : "Görevi Düzenle"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Durum <span className="text-red-500">*</span>
              </label>
              <select
                value={dialogForm.Status}
                onChange={(e) => setDialogForm((f) => ({ ...f, Status: e.target.value }))}
                className={cn(
                  "h-9 w-full rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300",
                  dialogErrors.Status ? "border-red-400" : "border-slate-300"
                )}
              >
                {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {dialogErrors.Status && <span className="text-xs text-red-500">{dialogErrors.Status}</span>}
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Tür <span className="text-red-500">*</span>
              </label>
              {dialogMode === "edit" && dialogForm.Type === "Ticket" ? (
                <div className="flex flex-col gap-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 cursor-not-allowed select-none">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-sky-400" aria-hidden />
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${TYPE_COLORS["Ticket"]}18`, color: TYPE_COLORS["Ticket"] }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS["Ticket"] }} />
                      Ticket
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">Ticket tarafından oluşturuldu</span>
                </div>
              ) : (
                <select
                  value={dialogForm.Type}
                  onChange={(e) => setDialogForm((f) => ({ ...f, Type: e.target.value }))}
                  className={cn(
                    "h-9 w-full rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300",
                    dialogErrors.Type ? "border-red-400" : "border-slate-300"
                  )}
                >
                  {TYPE_OPTIONS.filter((o) => o !== "Ticket").map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
              {dialogErrors.Type && <span className="text-xs text-red-500">{dialogErrors.Type}</span>}
            </div>

            {/* Priority */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Öncelik <span className="text-red-500">*</span>
              </label>
              <select
                value={dialogForm.Priority}
                onChange={(e) => setDialogForm((f) => ({ ...f, Priority: e.target.value }))}
                className={cn(
                  "h-9 w-full rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300",
                  dialogErrors.Priority ? "border-red-400" : "border-slate-300"
                )}
              >
                {PRIORITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {dialogErrors.Priority && <span className="text-xs text-red-500">{dialogErrors.Priority}</span>}
            </div>

            {/* Assignee */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Atanan <span className="text-red-500">*</span>
              </label>
              <select
                value={dialogForm.Assignee}
                onChange={(e) => {
                  const opt = e.target.selectedOptions[0];
                  const id = opt?.getAttribute("data-id") ?? "";
                  setDialogForm((f) => ({ ...f, Assignee: e.target.value, AssigneeId: id }));
                  setDialogErrors((prev) => ({ ...prev, Assignee: "", AssigneeId: "" }));
                }}
                className={cn(
                  "h-9 w-full rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300",
                  dialogErrors.Assignee ? "border-red-400" : "border-slate-300"
                )}
              >
                <option value="">Kişi seçin</option>
                {assigneeData.map((u) => {
                  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                  return <option key={u.id} value={name} data-id={u.id}>{name || "Bilinmeyen"}</option>;
                })}
              </select>
              {dialogErrors.Assignee && <span className="text-xs text-red-500">{dialogErrors.Assignee}</span>}
            </div>

            {/* Summary */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Özet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Görev özeti girin"
                value={dialogForm.Summary}
                onChange={(e) => {
                  setDialogForm((f) => ({ ...f, Summary: e.target.value }));
                  setDialogErrors((prev) => ({ ...prev, Summary: "" }));
                }}
                className={cn(
                  "h-9 w-full rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300",
                  dialogErrors.Summary ? "border-red-400" : "border-slate-300"
                )}
              />
              {dialogErrors.Summary && <span className="text-xs text-red-500">{dialogErrors.Summary}</span>}
            </div>

            {/* Description */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Açıklama</label>
              <textarea
                rows={3}
                placeholder="Detaylı açıklama girin"
                value={dialogForm.Description}
                onChange={(e) => setDialogForm((f) => ({ ...f, Description: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Tags */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Etiketler (virgülle ayırın)</label>
              <input
                type="text"
                placeholder="örn. Frontend, Bug, Kritik"
                value={dialogForm.Tags}
                onChange={(e) => setDialogForm((f) => ({ ...f, Tags: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

          </div>

          <DialogFooter className="flex items-center gap-2 pt-2">
            {dialogMode === "edit" && (isAdminUser || currentUserId === editCardCreatorId) && (
              <Button
                type="button"
                variant="destructive"
                className="mr-auto h-8 px-3 text-xs gap-1.5"
                onClick={handleDialogDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sil
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              onClick={handleDialogSave}
            >
              <Save className="w-3.5 h-3.5" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}

export default KanbanPage;
