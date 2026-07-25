import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, LayoutGrid, RefreshCw, Plus, Users } from "lucide-react";
import { cn } from "lib/utils";
import { fetchProjectStatistics } from "layouts/pages/ticketProjects/api/fetchProjectStatistics";
import { fetchProjectCompanyMap } from "layouts/pages/ticketProjects/api/fetchProjectCompanyMap";
import {
  fetchPersonDetailData,
  type PersonDetailInfo,
} from "layouts/pages/ticketProjects/api/fetchPersonDetailMap";
import {
  createSimulatedProjectPlan,
  deleteSimulatedProjectPlan,
  fetchSimulatedProjectPlans,
  updateSimulatedProjectPlan,
  type SimulatedProjectPlanPayload,
} from "layouts/pages/ticketProjects/api/simulatedProjectPlanApi";
import {
  getProjectTypeColumns,
  getProjectTypeColumnColors,
  getStatsBoardColumnKey,
  type ProjectTypeColumnDef,
  type ProjectTypeColumnKey,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { StatsBoardItem } from "layouts/pages/ticketProjects/types";
import { buildProjectPersonStats } from "layouts/pages/ticketProjects/utils/buildProjectPersonStats";
import { buildProjectModuleStats } from "layouts/pages/ticketProjects/utils/buildProjectModuleStats";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Skeleton } from "components/ui/skeleton";
import { Button } from "components/ui/button";
import ProjectStatsKanbanColumn from "./ProjectStatsKanbanColumn";
import ProjectStatsKanbanCard from "./ProjectStatsKanbanCard";
import ProjectStatisticsFilterBar from "./ProjectStatisticsFilterBar";
import ProjectStatsPeopleView from "./ProjectStatsPeopleView";
import ProjectStatsModulesView from "./ProjectStatsModulesView";
import SimulatedProjectPlanDialog from "./SimulatedProjectPlanDialog";
import { useProjectStatisticsFilters } from "../hooks/useProjectStatisticsFilters";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

type StatisticsViewTab = "kanban" | "people" | "modules";

export const getStatisticsSearchCopy = (activeTab: StatisticsViewTab) => {
  if (activeTab === "people") {
    return { placeholder: "Kişi ara...", ariaLabel: "Kişilerde ara" };
  }
  if (activeTab === "modules") {
    return { placeholder: "Modül ara...", ariaLabel: "Modüllerde ara" };
  }
  return { placeholder: "Proje, müşteri, kişi ara...", ariaLabel: "Projelerde ara" };
};

const MOBILE_BREAKPOINT = 767;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
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
          className="flex min-w-14 flex-col items-center justify-center px-2 py-1"
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
  selectedStatus: ProjectTypeColumnKey | "All";
  expandedCardId: string | null;
  onToggleExpand: (itemId: string) => void;
  highlightPersonIds?: Set<string> | null;
  onEditSimulated?: (item: StatsBoardItem) => void;
  onDeleteSimulated?: (item: StatsBoardItem) => void;
};

export const MobileBoard = ({
  columns,
  groupedItems,
  selectedStatus,
  expandedCardId,
  onToggleExpand,
  highlightPersonIds,
  onEditSimulated,
  onDeleteSimulated,
}: MobileBoardProps) => {
  const [activeCol, setActiveCol] = useState<ProjectTypeColumnKey>(columns[0]?.key);

  useEffect(() => {
    if (selectedStatus === "All") return;
    if (!columns.some((column) => column.key === selectedStatus)) return;

    setActiveCol(selectedStatus);
  }, [columns, selectedStatus]);

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
              <span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-bold dark:bg-muted">
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
              isExpanded={expandedCardId === item.id}
              onToggleExpand={onToggleExpand}
              highlightPersonIds={highlightPersonIds}
              onEditSimulated={onEditSimulated}
              onDeleteSimulated={onDeleteSimulated}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const StatisticsLoadError = ({ onRetry }: { onRetry: () => void }) => (
  <div
    className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-6 py-12 text-center dark:border-red-900/60 dark:bg-red-950/20"
    role="alert"
  >
    <span className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
      <AlertTriangle className="size-6" aria-hidden />
    </span>
    <div>
      <p className="font-semibold text-red-900 dark:text-red-200">
        Proje istatistikleri yüklenemedi
      </p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        Bağlantınızı kontrol edip tekrar deneyin.
      </p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
    >
      <RefreshCw className="size-4" aria-hidden />
      Tekrar dene
    </button>
  </div>
);

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
    <button
      type="button"
      onClick={() => onTabChange("modules")}
      aria-pressed={activeTab === "modules"}
      className={cn(
        "flex items-center gap-1.5 border-l border-slate-200 px-3 py-1.5 font-medium transition-colors dark:border-border",
        activeTab === "modules"
          ? "bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
          : "text-slate-600 hover:bg-slate-50 dark:text-muted-foreground dark:hover:bg-muted",
      )}
    >
      <Boxes className="size-3.5" aria-hidden />
      Modül
    </button>
  </div>
);

const sortBoardItems = (a: StatsBoardItem, b: StatsBoardItem): number => {
  // Simülasyon kartları kolon içinde üstte dursun (planlama görünürlüğü)
  if (a.kind === "simulated" && b.kind !== "simulated") return -1;
  if (b.kind === "simulated" && a.kind !== "simulated") return 1;

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatisticsViewTab>("kanban");
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlanItem, setEditingPlanItem] = useState<StatsBoardItem | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((itemId: string) => {
    setExpandedCardId((current) => (current === itemId ? null : itemId));
  }, []);

  const columns = useMemo(() => getProjectTypeColumns(), []);
  const searchCopy = getStatisticsSearchCopy(activeTab);

  const userLevelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const [userId, detail] of personDetailsById) {
      if (detail.levelLabel) map.set(userId, detail.levelLabel);
    }
    return map;
  }, [personDetailsById]);

  const filters = useProjectStatisticsFilters(boardItems, userDepartmentById, userLevelById);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [statisticsResult, simulatedPlansResult, companyResult, personDetailResult] =
        await Promise.allSettled([
          fetchProjectStatistics(),
          fetchSimulatedProjectPlans(),
          fetchProjectCompanyMap(),
          fetchPersonDetailData(),
        ]);

      if (statisticsResult.status === "rejected") {
        throw statisticsResult.reason;
      }

      const data = statisticsResult.value;
      const simulatedPlans =
        simulatedPlansResult.status === "fulfilled" ? simulatedPlansResult.value : [];
      const companyMap =
        companyResult.status === "fulfilled" ? companyResult.value : new Map<string, string>();
      const personDetailData =
        personDetailResult.status === "fulfilled"
          ? personDetailResult.value
          : { detailsById: new Map<string, PersonDetailInfo>(), unavailableMetadata: [] };
      const departmentMap = new Map<string, string>();

      for (const [personId, detail] of personDetailData.detailsById) {
        if (detail.department) {
          departmentMap.set(personId, detail.department);
        }
      }

      const realItems = data
        .filter((item) => item.isActive !== false)
        .map((item) => ({
          ...item,
          workCompanyId: companyMap.get(item.projectId) ?? null,
        }));
      const planItems = simulatedPlans.filter((item) => item.isActive !== false);
      setBoardItems([...planItems, ...realItems]);
      setUserDepartmentById(departmentMap);
      setPersonDetailsById(personDetailData.detailsById);

      const unavailableFeatures: string[] = [];
      if (simulatedPlansResult.status === "rejected") {
        unavailableFeatures.push("simülasyon planları");
      }
      if (companyResult.status === "rejected") {
        unavailableFeatures.push("Gantt bağlantıları");
      }
      if (personDetailResult.status === "rejected") {
        unavailableFeatures.push("departman, seviye ve kişi detayları");
      } else {
        if (personDetailData.unavailableMetadata.includes("positions")) {
          unavailableFeatures.push("pozisyon bilgileri");
        }
        if (personDetailData.unavailableMetadata.includes("levels")) {
          unavailableFeatures.push("seviye bilgileri");
        }
      }

      if (unavailableFeatures.length > 0) {
        dispatchAlert({
          message: `${unavailableFeatures.join(", ")} geçici olarak kullanılamıyor.`,
          type: "Warning",
        });
      }
    } catch {
      dispatchAlert({ message: "Proje istatistikleri getirilirken hata oluştu.", type: "Error" });
      setBoardItems([]);
      setLoadError("Proje istatistikleri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [dispatchAlert]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const handleRetryStatistics = useCallback(() => {
    void loadStatistics();
  }, [loadStatistics]);

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

  /** `personStats` kalem/proje bazlı süzülür; ama bir kalem birden çok kişiyi içerebildiği için
   * kişiye özel nitelikler (departman, seviye, seçili kişi) burada ayrıca uygulanır. Böylece
   * örn. seviye filtresinde sadece o seviyedeki kişiler listelenir, aynı kaleme dahil diğer
   * kişiler kartlarda görünmez. */
  const visiblePersonStats = useMemo(() => {
    let list = personStats;

    if (filters.selectedPersonId !== "All") {
      list = list.filter((person) => person.personId === filters.selectedPersonId);
    }

    if (filters.selectedDepartment !== "All") {
      list = list.filter(
        (person) => userDepartmentById.get(person.personId) === filters.selectedDepartment,
      );
    }

    if (filters.selectedLevel !== "All") {
      list = list.filter((person) => userLevelById.get(person.personId) === filters.selectedLevel);
    }

    const query = filters.searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter((person) => person.name.toLowerCase().includes(query));
    }

    return list;
  }, [
    personStats,
    filters.selectedPersonId,
    filters.selectedDepartment,
    filters.selectedLevel,
    filters.searchTerm,
    userDepartmentById,
    userLevelById,
  ]);

  const moduleStats = useMemo(
    () => buildProjectModuleStats(filters.filteredItemsIgnoringSearch),
    [filters.filteredItemsIgnoringSearch],
  );

  const visibleModuleStats = useMemo(() => {
    let list = moduleStats;

    if (filters.selectedModule !== "All") {
      list = list.filter((module) => module.moduleName === filters.selectedModule);
    }

    const query = filters.searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter((module) => module.moduleName.toLowerCase().includes(query));
    }

    return list;
  }, [moduleStats, filters.selectedModule, filters.searchTerm]);

  const handlePersonCardClick = useCallback(
    (personId: string) => {
      filters.handlePersonSelect(personId);
      setActiveTab("kanban");
    },
    [filters.handlePersonSelect],
  );

  const handleModuleCardClick = useCallback(
    (moduleName: string) => {
      filters.handleModuleSelect(moduleName);
      setActiveTab("kanban");
    },
    [filters.handleModuleSelect],
  );

  const handleOpenCreatePlan = useCallback(() => {
    setEditingPlanItem(null);
    setIsPlanDialogOpen(true);
  }, []);

  const handleEditSimulated = useCallback((item: StatsBoardItem) => {
    setEditingPlanItem(item);
    setIsPlanDialogOpen(true);
  }, []);

  const handleDeleteSimulated = useCallback(
    async (item: StatsBoardItem) => {
      if (!window.confirm(`"${item.customerName} — ${item.projectDescription}" plan kartı silinsin mi?`)) {
        return;
      }
      try {
        await deleteSimulatedProjectPlan(item.id);
        setBoardItems((prev) => prev.filter((x) => x.id !== item.id));
        dispatchAlert({ message: "Plan kartı silindi.", type: "Success" });
      } catch {
        dispatchAlert({ message: "Plan kartı silinirken hata oluştu.", type: "Error" });
      }
    },
    [dispatchAlert],
  );

  const handlePlanSubmit = useCallback(
    async (payload: SimulatedProjectPlanPayload) => {
      try {
        if (editingPlanItem) {
          const updated = await updateSimulatedProjectPlan({
            ...payload,
            id: editingPlanItem.id,
            isActive: true,
          });
          setBoardItems((prev) =>
            prev.map((item) => (item.id === editingPlanItem.id ? updated : item)),
          );
          dispatchAlert({ message: "Plan kartı güncellendi.", type: "Success" });
        } else {
          const created = await createSimulatedProjectPlan(payload);
          setBoardItems((prev) => [created, ...prev]);
          dispatchAlert({ message: "Plan kartı eklendi.", type: "Success" });
        }
      } catch {
        dispatchAlert({
          message: editingPlanItem
            ? "Plan kartı güncellenirken hata oluştu."
            : "Plan kartı eklenirken hata oluştu.",
          type: "Error",
        });
        throw new Error("plan-save-failed");
      }
    },
    [dispatchAlert, editingPlanItem],
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="flex flex-col gap-3">
        <ProjectStatisticsFilterBar
          isLoading={isLoading}
          searchTerm={filters.searchTerm}
          onSearchChange={filters.handleSearchChange}
          searchPlaceholder={searchCopy.placeholder}
          searchAriaLabel={searchCopy.ariaLabel}
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
          planVisibility={filters.planVisibility}
          onPlanVisibilitySelect={filters.handlePlanVisibilitySelect}
          planVisibilityCounts={filters.planVisibilityCounts}
          totalCount={filters.totalCount}
          filteredCount={filters.filteredCount}
          isMobileFilterOpen={filters.isMobileFilterOpen}
          setIsMobileFilterOpen={filters.setIsMobileFilterOpen}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          {loadError && !isLoading ? (
            <StatisticsLoadError onRetry={handleRetryStatistics} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {isLoading ? (
                  <StatsSummarySkeleton columnCount={columns.length} />
                ) : (
                  <div className="min-w-0 flex-1">
                    <StatsSummaryRow columns={columns} counts={columnCounts} />
                  </div>
                )}

                {!isLoading && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenCreatePlan}
                      className="bg-rose-600 text-white hover:bg-rose-700"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Plan Ekle
                    </Button>
                    <ViewTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
                  </div>
                )}
              </div>

              {isLoading ? (
                <BoardSkeleton columnCount={columns.length} />
              ) : activeTab === "people" ? (
                <ProjectStatsPeopleView
                  stats={visiblePersonStats}
                  onPersonClick={handlePersonCardClick}
                  personDetailsById={personDetailsById}
                />
              ) : activeTab === "modules" ? (
                <ProjectStatsModulesView
                  stats={visibleModuleStats}
                  onModuleClick={handleModuleCardClick}
                />
              ) : isMobile ? (
                <MobileBoard
                  columns={columns}
                  groupedItems={groupedItems}
                  selectedStatus={filters.selectedStatus}
                  expandedCardId={expandedCardId}
                  onToggleExpand={handleToggleExpand}
                  highlightPersonIds={filters.highlightPersonIds}
                  onEditSimulated={handleEditSimulated}
                  onDeleteSimulated={handleDeleteSimulated}
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
                        expandedCardId={expandedCardId}
                        onToggleExpand={handleToggleExpand}
                        highlightPersonIds={filters.highlightPersonIds}
                        onEditSimulated={handleEditSimulated}
                        onDeleteSimulated={handleDeleteSimulated}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SimulatedProjectPlanDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        editingItem={editingPlanItem}
        onSubmit={handlePlanSubmit}
      />
    </DashboardLayout>
  );
};

export default ProjectStatisticsTab;
