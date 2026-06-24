import { useCallback, useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "lib/utils";
import { fetchProjectStatistics } from "layouts/pages/ticketProjects/api/fetchProjectStatistics";
import {
  getProjectColumnKey,
  getProjectTypeColumnColors,
  getProjectTypeColumns,
  type ProjectTypeColumnDef,
  type ProjectTypeColumnKey,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { TicketProjectStatsDto } from "layouts/pages/ticketProjects/types";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Skeleton } from "components/ui/skeleton";
import ProjectStatsKanbanColumn from "./ProjectStatsKanbanColumn";
import ProjectStatsKanbanCard from "./ProjectStatsKanbanCard";
import ProjectStatisticsFilterSidebar from "./ProjectStatisticsFilterSidebar";
import { useProjectStatisticsFilters } from "../hooks/useProjectStatisticsFilters";

const MOBILE_BREAKPOINT = 800;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
};

const StatsSummaryRow = ({
  columns,
  counts,
}: {
  columns: ProjectTypeColumnDef[];
  counts: Record<ProjectTypeColumnKey, number>;
}) => (
  <div className="flex flex-wrap items-stretch gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 shadow-sm dark:border-border dark:bg-card">
    {columns.map((column) => {
      const colors = getProjectTypeColumnColors(column.label);
      const count = counts[column.key] ?? 0;
      return (
        <div
          key={String(column.key)}
          className="flex min-w-[56px] flex-col items-center justify-center px-2 py-1"
        >
          <span className="text-base font-extrabold leading-none tabular-nums text-slate-700 dark:text-foreground">
            {count}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
            <span className={cn("size-1.5 rounded-full", colors.dot)} aria-hidden />
            {column.label}
          </span>
        </div>
      );
    })}
  </div>
);

const StatsSummarySkeleton = ({ columnCount }: { columnCount: number }) => (
  <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 dark:border-border dark:bg-card">
    {Array.from({ length: columnCount }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-14 rounded-md" />
    ))}
  </div>
);

const BoardSkeleton = ({ columnCount }: { columnCount: number }) => (
  <div className="overflow-x-auto pb-1">
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(210px, 1fr))`,
        minWidth: `${columnCount * 220}px`,
      }}
    >
      {Array.from({ length: columnCount }).map((_, index) => (
        <Skeleton key={index} className="h-64 rounded-lg" />
      ))}
    </div>
  </div>
);

type MobileProjectBoardProps = {
  columns: ProjectTypeColumnDef[];
  groupedProjects: Record<ProjectTypeColumnKey, TicketProjectStatsDto[]>;
};

const MobileProjectBoard = ({ columns, groupedProjects }: MobileProjectBoardProps) => {
  const [activeCol, setActiveCol] = useState<ProjectTypeColumnKey>(columns[0]?.key);

  const activeColumn = columns.find((col) => col.key === activeCol) ?? columns[0];
  const activeProjects = activeColumn ? groupedProjects[activeColumn.key] ?? [] : [];
  const activeColors = activeColumn ? getProjectTypeColumnColors(activeColumn.label) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="scrollbar-none flex items-center gap-1 overflow-x-auto pb-1">
        {columns.map((column) => {
          const count = groupedProjects[column.key]?.length ?? 0;
          const colors = getProjectTypeColumnColors(column.label);
          const isActive = activeCol === column.key;
          return (
            <button
              key={String(column.key)}
              type="button"
              onClick={() => setActiveCol(column.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                isActive
                  ? cn("border-b-2 bg-white shadow-sm dark:bg-card", colors.tab)
                  : "border-transparent bg-transparent text-slate-400 hover:text-slate-600",
              )}
            >
              {column.label}
              <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-bold dark:bg-muted">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {activeProjects.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-border">
            <span className="text-xs text-slate-400 dark:text-muted-foreground">Bu kolonda proje yok</span>
          </div>
        ) : (
          activeProjects.map((project) => (
            <ProjectStatsKanbanCard
              key={project.id}
              project={project}
              cardBorderClass={activeColors?.cardBorder ?? "border-l-slate-300"}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ProjectStatisticsTab = ({ isActive }: { isActive: boolean }) => {
  const dispatchAlert = useAlert();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<TicketProjectStatsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const columns = useMemo(() => getProjectTypeColumns(), []);

  const filters = useProjectStatisticsFilters(projects);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchProjectStatistics();
      setProjects(data);
      setHasLoaded(true);
    } catch {
      dispatchAlert({ message: "Proje istatistikleri getirilirken hata oluştu.", type: "Error" });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatchAlert]);

  useEffect(() => {
    if (!isActive || hasLoaded) return;
    loadStatistics();
  }, [isActive, hasLoaded, loadStatistics]);

  const groupedProjects = useMemo(() => {
    const groups = Object.fromEntries(
      columns.map((column) => [column.key, [] as TicketProjectStatsDto[]]),
    ) as Record<ProjectTypeColumnKey, TicketProjectStatsDto[]>;

    for (const project of filters.filteredProjects) {
      const key = getProjectColumnKey(project.projectStatus);
      groups[key].push(project);
    }

    for (const key of Object.keys(groups) as ProjectTypeColumnKey[]) {
      groups[key].sort((a, b) =>
        (a.projectDescription ?? "").localeCompare(b.projectDescription ?? "", "tr"),
      );
    }

    return groups;
  }, [filters.filteredProjects, columns]);

  const columnCounts = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.key, groupedProjects[column.key]?.length ?? 0]),
      ) as Record<ProjectTypeColumnKey, number>,
    [columns, groupedProjects],
  );

  return (
    <div className="flex gap-0 overflow-hidden rounded-xl">
      {/* ── Mobile backdrop ── */}
      {filters.sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => filters.setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Left sidebar ── */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-border dark:bg-card",
          "fixed inset-y-0 left-0 z-50 w-72 shadow-xl",
          filters.sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:inset-y-auto lg:left-auto lg:w-52 lg:shrink-0 lg:shadow-none lg:max-h-[740px]",
        )}
        aria-label="Filtre paneli"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-border">
          <p className="text-xs font-semibold text-slate-600 dark:text-foreground">Filtreler</p>
          <div className="flex items-center gap-1.5">
            {filters.activeFilterCount > 0 && (
              <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-indigo-100 px-1 text-[10px] font-bold text-indigo-600">
                {filters.activeFilterCount}
              </span>
            )}
            {/* Close button — mobile only */}
            <button
              type="button"
              onClick={() => filters.setSidebarOpen(false)}
              className="lg:hidden flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Filtreleri kapat"
            >
              ✕
            </button>
          </div>
        </div>

        <ProjectStatisticsFilterSidebar
          isLoading={isLoading}
          searchTerm={filters.searchTerm}
          onSearchChange={filters.handleSearchChange}
          uniqueStatuses={filters.uniqueStatuses}
          selectedStatus={filters.selectedStatus}
          onStatusSelect={filters.handleStatusSelect}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateFromChange={filters.handleDateFromChange}
          onDateToChange={filters.handleDateToChange}
          onDateClear={filters.handleDateClear}
          uniquePersons={filters.uniquePersons}
          selectedPersonId={filters.selectedPersonId}
          onPersonSelect={filters.handlePersonSelect}
          personSearch={filters.personSearch}
          onPersonSearchChange={filters.setPersonSearch}
          uniqueCustomers={filters.uniqueCustomers}
          selectedCustomer={filters.selectedCustomer}
          onCustomerSelect={filters.handleCustomerSelect}
          uniqueModules={filters.uniqueModules}
          selectedModule={filters.selectedModule}
          onModuleSelect={filters.handleModuleSelect}
          totalCount={filters.totalCount}
          filteredCount={filters.filteredCount}
        />
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Top bar: mobile filter toggle + summary */}
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => filters.setSidebarOpen(true)}
            aria-label="Filtreleri göster"
            className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {isLoading ? (
            <StatsSummarySkeleton columnCount={columns.length} />
          ) : (
            <div className="flex-1">
              <StatsSummaryRow columns={columns} counts={columnCounts} />
            </div>
          )}
        </div>

        {/* Board */}
        {isLoading ? (
          <BoardSkeleton columnCount={columns.length} />
        ) : isMobile ? (
          <MobileProjectBoard columns={columns} groupedProjects={groupedProjects} />
        ) : (
          <div className="overflow-x-auto pb-1">
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(210px, 1fr))`,
                minWidth: `${columns.length * 220}px`,
              }}
            >
              {columns.map((column) => (
                <ProjectStatsKanbanColumn
                  key={String(column.key)}
                  column={column}
                  projects={groupedProjects[column.key] ?? []}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStatisticsTab;
