import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, Users } from "lucide-react";
import { cn } from "lib/utils";
import { fetchProjectStatistics } from "layouts/pages/ticketProjects/api/fetchProjectStatistics";
import { fetchUserDepartmentMap } from "layouts/pages/ticketProjects/api/fetchUsersForStats";
import { fetchProjectCompanyMap } from "layouts/pages/ticketProjects/api/fetchProjectCompanyMap";
import {
  fetchPersonDetailMap,
  type PersonDetailInfo,
} from "layouts/pages/ticketProjects/api/fetchPersonDetailMap";
import {
  getProjectTypeColumns,
  getProjectTypeColumnColors,
  getStatsBoardColumnKey,
  type ProjectTypeColumnDef,
  type ProjectTypeColumnKey,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { StatsBoardItem } from "layouts/pages/ticketProjects/types";
import { buildProjectPersonStats } from "layouts/pages/ticketProjects/utils/buildProjectPersonStats";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Skeleton } from "components/ui/skeleton";
import ProjectStatsKanbanColumn from "./ProjectStatsKanbanColumn";
import ProjectStatsKanbanCard from "./ProjectStatsKanbanCard";
import ProjectStatisticsFilterBar from "./ProjectStatisticsFilterBar";
import ProjectStatsPeopleView from "./ProjectStatsPeopleView";
import { useProjectStatisticsFilters } from "../hooks/useProjectStatisticsFilters";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

type StatisticsViewTab = "kanban" | "people";

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
  <div className="flex flex-wrap items-stretch gap-2 rounded-lg  bg-white px-3 py-2 dark:border-border dark:bg-card">
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

type MobileBoardProps = {
  columns: ProjectTypeColumnDef[];
  groupedItems: Record<ProjectTypeColumnKey, StatsBoardItem[]>;
  highlightPersonIds?: Set<string> | null;
};

const MobileBoard = ({ columns, groupedItems, highlightPersonIds }: MobileBoardProps) => {
  const [activeCol, setActiveCol] = useState<ProjectTypeColumnKey>(columns[0]?.key);

  const activeColumn = columns.find((col) => col.key === activeCol) ?? columns[0];
  const activeItems = activeColumn ? groupedItems[activeColumn.key] ?? [] : [];
  const activeColors = activeColumn ? getProjectTypeColumnColors(activeColumn.label) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="scrollbar-none flex items-center gap-1 overflow-x-auto pb-1">
        {columns.map((column) => {
          const count = groupedItems[column.key]?.length ?? 0;
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
        {activeItems.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-border">
            <span className="text-xs text-slate-400 dark:text-muted-foreground">Bu kolonda kart yok</span>
          </div>
        ) : (
          activeItems.map((item) => (
            <ProjectStatsKanbanCard
              key={item.id}
              item={item}
              cardBorderClass={activeColors?.cardBorder ?? "border-l-slate-300"}
              highlightPersonIds={highlightPersonIds}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ViewTabSwitcher = ({
  activeTab,
  onTabChange,
}: {
  activeTab: StatisticsViewTab;
  onTabChange: (tab: StatisticsViewTab) => void;
}) => (
  <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-border">
    <button
      type="button"
      onClick={() => onTabChange("kanban")}
      aria-pressed={activeTab === "kanban"}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors",
        activeTab === "kanban"
          ? "bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
          : "text-slate-600 hover:bg-slate-50 dark:text-muted-foreground dark:hover:bg-muted",
      )}
    >
      <LayoutGrid className="size-3.5" aria-hidden />
      Kanban
    </button>
    <button
      type="button"
      onClick={() => onTabChange("people")}
      aria-pressed={activeTab === "people"}
      className={cn(
        "flex items-center gap-1.5 border-l border-slate-200 px-3 py-1.5 font-medium transition-colors dark:border-border",
        activeTab === "people"
          ? "bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
          : "text-slate-600 hover:bg-slate-50 dark:text-muted-foreground dark:hover:bg-muted",
      )}
    >
      <Users className="size-3.5" aria-hidden />
      Kişi
    </button>
  </div>
);

const sortBoardItems = (a: StatsBoardItem, b: StatsBoardItem): number => {
  const projectCmp = (a.projectDescription ?? "").localeCompare(b.projectDescription ?? "", "tr");
  if (projectCmp !== 0) return projectCmp;
  if (a.kind === "project" && b.kind === "project") return 0;
  if (a.kind === "project") return -1;
  if (b.kind === "project") return 1;
  return (a.kalemName ?? "").localeCompare(b.kalemName ?? "", "tr");
};

const ProjectStatisticsTab = () => {
  const dispatchAlert = useAlert();
  const isMobile = useIsMobile();
  const [boardItems, setBoardItems] = useState<StatsBoardItem[]>([]);
  const [userDepartmentById, setUserDepartmentById] = useState<Map<string, string>>(new Map());
  const [personDetailsById, setPersonDetailsById] = useState<Map<string, PersonDetailInfo>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<StatisticsViewTab>("kanban");

  const columns = useMemo(() => getProjectTypeColumns(), []);

  const userLevelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const [userId, detail] of personDetailsById) {
      if (detail.levelLabel) map.set(userId, detail.levelLabel);
    }
    return map;
  }, [personDetailsById]);

  const filters = useProjectStatisticsFilters(boardItems, userDepartmentById, userLevelById);

  const highlightPersonIds = useMemo(() => {
    const ids = new Set<string>();

    if (filters.selectedPersonId !== "All") {
      ids.add(filters.selectedPersonId);
    }

    if (filters.selectedDepartment !== "All") {
      for (const [userId, department] of userDepartmentById) {
        if (department === filters.selectedDepartment) {
          ids.add(userId);
        }
      }
    }

    if (filters.selectedLevel !== "All") {
      for (const [userId, level] of userLevelById) {
        if (level === filters.selectedLevel) {
          ids.add(userId);
        }
      }
    }

    return ids.size > 0 ? ids : null;
  }, [
    filters.selectedPersonId,
    filters.selectedDepartment,
    filters.selectedLevel,
    userDepartmentById,
    userLevelById,
  ]);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, departmentMap, companyMap, personDetailMap] = await Promise.all([
        fetchProjectStatistics(),
        fetchUserDepartmentMap().catch(() => new Map<string, string>()),
        fetchProjectCompanyMap().catch(() => new Map<string, string>()),
        fetchPersonDetailMap().catch(() => new Map<string, PersonDetailInfo>()),
      ]);
      setBoardItems(
        data
          .filter((item) => item.isActive !== false)
          .map((item) => ({
            ...item,
            workCompanyId: companyMap.get(item.projectId) ?? null,
          })),
      );
      setUserDepartmentById(departmentMap);
      setPersonDetailsById(personDetailMap);
      setHasLoaded(true);
    } catch {
      dispatchAlert({ message: "Proje istatistikleri getirilirken hata oluştu.", type: "Error" });
      setBoardItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatchAlert]);

  useEffect(() => {
    if (hasLoaded) return;
    loadStatistics();
  }, [hasLoaded, loadStatistics]);

  const groupedItems = useMemo(() => {
    const groups = Object.fromEntries(
      columns.map((column) => [column.key, [] as StatsBoardItem[]]),
    ) as Record<ProjectTypeColumnKey, StatsBoardItem[]>;

    for (const item of filters.filteredItems) {
      const key = getStatsBoardColumnKey(item);
      groups[key].push(item);
    }

    for (const column of columns) {
      groups[column.key].sort(sortBoardItems);
    }

    return groups;
  }, [filters.filteredItems, columns]);

  const columnCounts = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.key, groupedItems[column.key]?.length ?? 0]),
      ) as Record<ProjectTypeColumnKey, number>,
    [columns, groupedItems],
  );

  const personStats = useMemo(
    () => buildProjectPersonStats(filters.filteredItemsIgnoringSearch),
    [filters.filteredItemsIgnoringSearch],
  );

  const visiblePersonStats = useMemo(() => {
    const query = filters.searchTerm.trim().toLowerCase();
    if (!query) return personStats;
    return personStats.filter((person) => person.name.toLowerCase().includes(query));
  }, [personStats, filters.searchTerm]);

  const handlePersonCardClick = useCallback(
    (personId: string) => {
      filters.handlePersonSelect(personId);
      setActiveTab("kanban");
    },
    [filters.handlePersonSelect],
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="flex flex-col gap-3">
        <ProjectStatisticsFilterBar
          isLoading={isLoading}
          searchTerm={filters.searchTerm}
          onSearchChange={filters.handleSearchChange}
          uniqueStatuses={filters.uniqueStatuses}
          selectedStatus={filters.selectedStatus}
          onStatusSelect={filters.handleStatusSelect}
          uniqueDepartments={filters.uniqueDepartments}
          selectedDepartment={filters.selectedDepartment}
          onDepartmentSelect={filters.handleDepartmentSelect}
          departmentAllCount={filters.departmentAllCount}
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
          uniqueLevels={filters.uniqueLevels}
          selectedLevel={filters.selectedLevel}
          onLevelSelect={filters.handleLevelSelect}
          totalCount={filters.totalCount}
          filteredCount={filters.filteredCount}
          isMobileFilterOpen={filters.isMobileFilterOpen}
          setIsMobileFilterOpen={filters.setIsMobileFilterOpen}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-3 flex items-center gap-3">
            {isLoading ? (
              <StatsSummarySkeleton columnCount={columns.length} />
            ) : (
              <div className="flex-1">
                <StatsSummaryRow columns={columns} counts={columnCounts} />
              </div>
            )}

            {!isLoading && <ViewTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />}
          </div>

          {isLoading ? (
            <BoardSkeleton columnCount={columns.length} />
          ) : activeTab === "people" ? (
            <ProjectStatsPeopleView
              stats={visiblePersonStats}
              onPersonClick={handlePersonCardClick}
              personDetailsById={personDetailsById}
            />
          ) : isMobile ? (
            <MobileBoard
              columns={columns}
              groupedItems={groupedItems}
              highlightPersonIds={highlightPersonIds}
            />
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
                    items={groupedItems[column.key] ?? []}
                    highlightPersonIds={highlightPersonIds}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectStatisticsTab;
