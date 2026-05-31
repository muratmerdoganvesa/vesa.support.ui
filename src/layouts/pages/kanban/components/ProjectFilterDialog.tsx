import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { cn } from "lib/utils";
import {
  Search,
  X,
  Check,
  Building2,
  Folder,
  Star,
  Clock,
  Loader2,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { TicketProjectsListDto, WorkCompanyDto } from "api/generated";
import { getProjectLabel, ProjectStats } from "../hooks/useProjectCatalog";

// ─── localStorage keys ───────────────────────────────────────────────────────

const LS_RECENT = "kanban_recent_projects";
const LS_FAVORITES = "kanban_favorite_projects";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_RECENT) ?? "[]"); } catch { return []; }
}
function saveRecent(ids: string[]) {
  localStorage.setItem(LS_RECENT, JSON.stringify(ids.slice(0, MAX_RECENT)));
}
function loadFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_FAVORITES) ?? "[]"); } catch { return []; }
}
function saveFavorites(ids: string[]) {
  localStorage.setItem(LS_FAVORITES, JSON.stringify(ids));
}

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortOption = "az" | "za" | "most-cards" | "most-done";

const SORT_LABELS: Record<SortOption, string> = {
  az: "A → Z",
  za: "Z → A",
  "most-cards": "En çok kart",
  "most-done": "En yüksek tamamlanma",
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ pct, active }: { pct: number; active: boolean }) => (
  <div className="mt-1.5 h-[3px] w-full rounded-full bg-slate-100 overflow-hidden">
    <div
      className={cn(
        "h-full rounded-full transition-all duration-500",
        active ? "bg-indigo-400" : pct === 100 ? "bg-emerald-400" : "bg-indigo-300/60",
      )}
      style={{ width: `${pct}%` }}
    />
  </div>
);

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ProjectFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: WorkCompanyDto[];
  projects: TicketProjectsListDto[];
  projectsLoading: boolean;
  taskStats: Map<string, ProjectStats>;
  noProjectStats: ProjectStats;
  totalCards: number;
  selectedFilter: string;
  onApply: (filterId: string, project?: TicketProjectsListDto | null) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProjectFilterDialog = ({
  open,
  onOpenChange,
  companies,
  projects,
  projectsLoading,
  taskStats,
  noProjectStats,
  totalCards,
  selectedFilter,
  onApply,
}: ProjectFilterDialogProps) => {
  const [localFilter, setLocalFilter] = useState<string>(selectedFilter);
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [companySearch, setCompanySearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("az");
  const [sortOpen, setSortOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLocalFilter(selectedFilter);
      setFavorites(loadFavorites());
      setRecentIds(loadRecent());
      setFocusedIdx(-1);
    }
  }, [open, selectedFilter]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filtered & sorted project list
  const displayedProjects = useMemo(() => {
    let list = projects;

    // Company filter
    if (companyFilter !== "All") {
      list = list.filter((p) => p.workCompany?.id === companyFilter || p.workCompanyId === companyFilter);
    }

    // Search
    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase();
      list = list.filter((p) => {
        const label = getProjectLabel(p).toLowerCase();
        const company = (p.workCompany?.name ?? "").toLowerCase();
        return label.includes(q) || company.includes(q);
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      const labelA = getProjectLabel(a);
      const labelB = getProjectLabel(b);
      if (sort === "az") return labelA.localeCompare(labelB, "tr");
      if (sort === "za") return labelB.localeCompare(labelA, "tr");
      const statsA = taskStats.get(a.id ?? "") ?? { total: 0, done: 0 };
      const statsB = taskStats.get(b.id ?? "") ?? { total: 0, done: 0 };
      if (sort === "most-cards") return statsB.total - statsA.total;
      if (sort === "most-done") {
        const pctA = statsA.total > 0 ? statsA.done / statsA.total : 0;
        const pctB = statsB.total > 0 ? statsB.done / statsB.total : 0;
        return pctB - pctA;
      }
      return 0;
    });

    return list;
  }, [projects, companyFilter, projectSearch, sort, taskStats]);

  // Recent projects that are still in the catalog
  const recentProjects = useMemo(() =>
    recentIds
      .map((id) => projects.find((p) => p.id === id))
      .filter(Boolean) as TicketProjectsListDto[],
    [recentIds, projects]
  );

  const filteredCompanies = useMemo(() =>
    companies.filter((c) =>
      !companySearch || c.name?.toLowerCase().includes(companySearch.toLowerCase())
    ),
    [companies, companySearch]
  );

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const handleApply = () => {
    const project = localFilter === "All" || localFilter === "__no_project__"
      ? null
      : projects.find((p) => p.id === localFilter) ?? null;

    if (localFilter !== "All" && localFilter !== "__no_project__") {
      setRecentIds((prev) => {
        const next = [localFilter, ...prev.filter((x) => x !== localFilter)];
        saveRecent(next);
        return next;
      });
    }

    onApply(localFilter, project);
    onOpenChange(false);
  };

  const handleClear = () => {
    setLocalFilter("All");
    setCompanyFilter("All");
    setProjectSearch("");
    setCompanySearch("");
  };

  // All unique flat rows (Tümü + catalog projects + Genel)
  const allRows = useMemo(() => {
    const rows: { id: string }[] = [{ id: "All" }, ...displayedProjects.map((p) => ({ id: p.id! }))];
    if (noProjectStats.total > 0) rows.push({ id: "__no_project__" });
    return rows;
  }, [displayedProjects, noProjectStats]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, allRows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      setLocalFilter(allRows[focusedIdx].id);
    }
  };

  const companyCardCount = (companyId: string) => {
    const compProjects = projects.filter(
      (p) => p.workCompany?.id === companyId || p.workCompanyId === companyId
    );
    return compProjects.reduce((sum, p) => sum + (taskStats.get(p.id ?? "")?.total ?? 0), 0);
  };

  const companyProjectCount = (companyId: string) =>
    projects.filter((p) => p.workCompany?.id === companyId || p.workCompanyId === companyId).length;

  const renderProjectRow = (p: TicketProjectsListDto, idx: number) => {
    const stats = taskStats.get(p.id ?? "") ?? { total: 0, done: 0 };
    const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    const isActive = localFilter === p.id;
    const isFav = favorites.includes(p.id ?? "");
    const isFocused = focusedIdx === idx;
    const companyName = p.workCompany?.name ?? "";

    return (
      <button
        key={p.id}
        type="button"
        tabIndex={0}
        onClick={() => setLocalFilter(p.id!)}
        className={cn(
          "group w-full text-left px-4 py-3 rounded-xl border transition-all duration-150",
          "focus:outline-none",
          isActive
            ? "bg-indigo-50 border-indigo-300 shadow-sm"
            : isFocused
              ? "bg-slate-50 border-slate-300"
              : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40",
        )}
      >
        <div className="flex items-start gap-3">
          <Folder
            className={cn(
              "w-4 h-4 shrink-0 mt-0.5",
              isActive ? "text-indigo-500" : "text-slate-400 group-hover:text-indigo-400"
            )}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <span className={cn(
                "text-sm font-medium flex-1 wrap-break-word leading-snug",
                isActive ? "text-indigo-700" : "text-slate-700"
              )}>
                {getProjectLabel(p)}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {stats.total > 0 && (
                  <span className={cn(
                    "text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {stats.total}
                  </span>
                )}
                {stats.total > 0 && (
                  <span className={cn(
                    "text-[10px] font-medium tabular-nums",
                    pct === 100 ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {pct}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(p.id!, e)}
                  className={cn(
                    "p-0.5 rounded transition-all",
                    isFav
                      ? "text-amber-400 hover:text-amber-500"
                      : "text-slate-300 hover:text-amber-400 opacity-0 group-hover:opacity-100"
                  )}
                  aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
                >
                  <Star className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
                </button>
              </div>
              {isActive && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden />}
            </div>
            {companyName && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="w-2.5 h-2.5 text-slate-300 shrink-0" aria-hidden />
                <span className="text-[11px] text-slate-400">{companyName}</span>
              </div>
            )}
            {stats.total > 0 && <ProgressBar pct={pct} active={isActive} />}
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl w-full p-0 gap-0 flex flex-col overflow-hidden"
        style={{ height: "min(720px, 92vh)" }}
      >
        <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-500" aria-hidden />
            Proje Filtrele
          </DialogTitle>
        </DialogHeader>

        {/* ── Two panel body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left: Company panel ── */}
          <div className="w-60 shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/60">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" aria-hidden />
                Şirketler
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Şirket ara..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="h-7 pl-7 pr-6 text-xs rounded-lg border-slate-200 bg-white focus-visible:ring-indigo-100"
                />
                {companySearch && (
                  <button type="button" onClick={() => setCompanySearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
              {/* Tümü */}
              <button
                type="button"
                onClick={() => setCompanyFilter("All")}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors",
                  companyFilter === "All"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-white hover:text-slate-800"
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  companyFilter === "All" ? "bg-indigo-500" : "bg-slate-300"
                )} />
                <span className="flex-1 truncate">Tüm Şirketler</span>
                <span className={cn(
                  "text-[10px] font-bold tabular-nums px-1 py-0.5 rounded-full shrink-0",
                  companyFilter === "All" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                )}>
                  {totalCards}
                </span>
              </button>

              {filteredCompanies.map((c) => {
                const isActive = companyFilter === c.id;
                const cnt = companyCardCount(c.id!);
                const projCnt = companyProjectCount(c.id!);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCompanyFilter(c.id!)}
                    className={cn(
                      "w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-800"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 mt-1",
                      isActive ? "bg-indigo-500" : "bg-slate-300"
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{c.name}</span>
                      <span className={cn(
                        "text-[10px]",
                        isActive ? "text-indigo-400" : "text-slate-400"
                      )}>
                        {projCnt} proje
                      </span>
                    </div>
                    {cnt > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold tabular-nums px-1 py-0.5 rounded-full shrink-0 mt-0.5",
                        isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredCompanies.length === 0 && companySearch && (
                <p className="px-2 py-4 text-xs text-slate-400 text-center">Şirket bulunamadı</p>
              )}
            </div>
          </div>

          {/* ── Right: Project list ── */}
          <div className="flex-1 min-w-0 flex flex-col" onKeyDown={handleKeyDown}>

            {/* Search + Sort bar */}
            <div className="px-5 pt-4 pb-3 shrink-0 flex items-center gap-2.5 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Proje ara... (ad, şirket)"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="h-8 pl-9 pr-8 text-xs rounded-lg border-slate-200 focus-visible:ring-indigo-100"
                  aria-label="Proje ara"
                />
                {projectSearch && (
                  <button type="button" onClick={() => setProjectSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative shrink-0" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  aria-label="Sıralama"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-9 z-50 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 text-xs">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setSort(opt); setSortOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 transition-colors hover:bg-slate-50",
                          sort === opt ? "text-indigo-600 font-semibold" : "text-slate-700"
                        )}
                      >
                        {sort === opt && <Check className="w-3 h-3 inline mr-1.5 text-indigo-500" />}
                        {SORT_LABELS[opt]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Project rows */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2">

              {projectsLoading ? (
                <div className="flex flex-col gap-2 pt-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Tüm Projeler row — only shown when no company filter active */}
                  {companyFilter === "All" && (
                    <button
                      type="button"
                      onClick={() => setLocalFilter("All")}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all duration-150",
                        localFilter === "All"
                          ? "bg-indigo-50 border-indigo-300 shadow-sm"
                          : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          localFilter === "All" ? "bg-indigo-100" : "bg-slate-100"
                        )}>
                          <Folder className={cn("w-4 h-4", localFilter === "All" ? "text-indigo-500" : "text-slate-400")} aria-hidden />
                        </div>
                        <div className="flex-1">
                          <span className={cn(
                            "text-sm font-semibold",
                            localFilter === "All" ? "text-indigo-700" : "text-slate-700"
                          )}>
                            Tüm Projeler
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">{projects.length} proje</span>
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs font-bold tabular-nums px-2 py-0.5 rounded-full shrink-0",
                          localFilter === "All" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {totalCards}
                        </span>
                        {localFilter === "All" && <Check className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden />}
                      </div>
                    </button>
                  )}

                  {/* Recent projects */}
                  {recentProjects.length > 0 && !projectSearch && companyFilter === "All" && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 px-1">
                        <Clock className="w-3 h-3" />
                        Son Kullanılanlar
                      </p>
                      <div className="space-y-1">
                        {recentProjects.slice(0, 3).map((p, i) => renderProjectRow(p, i + 1))}
                      </div>
                    </div>
                  )}

                  {/* Favorite projects */}
                  {favorites.length > 0 && !projectSearch && companyFilter === "All" && (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 px-1">
                        <Star className="w-3 h-3" />
                        Favoriler
                      </p>
                      <div className="space-y-1">
                        {projects
                          .filter((p) => favorites.includes(p.id ?? ""))
                          .map((p, i) => renderProjectRow(p, recentProjects.length + i + 1))}
                      </div>
                    </div>
                  )}

                  {/* All catalog projects */}
                  <div className={cn((recentProjects.length > 0 || favorites.length > 0) && !projectSearch && companyFilter === "All" ? "pt-1" : "")}>
                    {(recentProjects.length > 0 || favorites.length > 0) && !projectSearch && companyFilter === "All" && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 px-1">
                        <Folder className="w-3 h-3" />
                        Tüm Projeler
                      </p>
                    )}
                    <div className="space-y-1">
                      {displayedProjects.map((p, i) => renderProjectRow(p, i + 1))}
                    </div>
                  </div>

                  {/* Genel (no project) */}
                  {noProjectStats.total > 0 && companyFilter === "All" && (
                    <button
                      type="button"
                      onClick={() => setLocalFilter("__no_project__")}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all duration-150",
                        localFilter === "__no_project__"
                          ? "bg-slate-100 border-slate-300 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          localFilter === "__no_project__" ? "bg-slate-200" : "bg-slate-100"
                        )}>
                          <Folder className="w-4 h-4 text-slate-400" aria-hidden />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-600">Genel</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">Projeye atanmamış kartlar</p>
                        </div>
                        <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                          {noProjectStats.total}
                        </span>
                        {localFilter === "__no_project__" && <Check className="w-4 h-4 text-slate-500 shrink-0" />}
                      </div>
                    </button>
                  )}

                  {displayedProjects.length === 0 && projectSearch && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-500">Proje bulunamadı</p>
                      <p className="text-xs text-slate-400">"{projectSearch}" için sonuç yok</p>
                      <button
                        type="button"
                        onClick={() => setProjectSearch("")}
                        className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Temizle
                      </button>
                    </div>
                  )}

                  {displayedProjects.length === 0 && !projectSearch && companyFilter !== "All" && (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Folder className="w-7 h-7 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Bu şirkette proje bulunamadı</p>
                        <p className="text-xs text-slate-400 mt-0.5">Farklı bir şirket seçin veya filtreyi temizleyin</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCompanyFilter("All")}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                      >
                        Tüm şirketleri göster
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex-row items-center justify-between gap-3 rounded-b-xl mx-0 mb-0">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Filtreyi Temizle
          </button>

          <div className="flex items-center gap-2">
            {localFilter !== "All" && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                {localFilter === "__no_project__"
                  ? "Genel seçildi"
                  : (() => {
                      const p = projects.find((x) => x.id === localFilter);
                      return p ? `"${getProjectLabel(p)}" seçildi` : "";
                    })()
                }
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-4 text-xs"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              onClick={handleApply}
            >
              <Check className="w-3.5 h-3.5" />
              Uygula
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFilterDialog;
