import { useCallback, useEffect, useMemo, useState } from "react";
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

const ProjectStatisticsTab = () => {
  const dispatchAlert = useAlert();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<TicketProjectStatsDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns = useMemo(() => getProjectTypeColumns(), []);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchProjectStatistics();
      setProjects(data);
    } catch {
      dispatchAlert({ message: "Proje istatistikleri getirilirken hata oluştu.", type: "Error" });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatchAlert]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const groupedProjects = useMemo(() => {
    const groups = Object.fromEntries(
      columns.map((column) => [column.key, [] as TicketProjectStatsDto[]]),
    ) as Record<ProjectTypeColumnKey, TicketProjectStatsDto[]>;

    for (const project of projects) {
      const key = getProjectColumnKey(project.projectStatus);
      groups[key].push(project);
    }

    for (const key of Object.keys(groups) as ProjectTypeColumnKey[]) {
      groups[key].sort((a, b) =>
        (a.projectDescription ?? "").localeCompare(b.projectDescription ?? "", "tr"),
      );
    }

    return groups;
  }, [projects, columns]);

  const columnCounts = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.key, groupedProjects[column.key]?.length ?? 0]),
      ) as Record<ProjectTypeColumnKey, number>,
    [columns, groupedProjects],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <StatsSummarySkeleton columnCount={columns.length} />
        <BoardSkeleton columnCount={columns.length} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <StatsSummaryRow columns={columns} counts={columnCounts} />

      {isMobile ? (
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
  );
};

export default ProjectStatisticsTab;
