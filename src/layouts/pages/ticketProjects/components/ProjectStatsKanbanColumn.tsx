import { InboxIcon } from "lucide-react";
import { cn } from "lib/utils";
import {
  getProjectTypeColumnColors,
  type ProjectTypeColumnDef,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { TicketProjectStatsDto } from "layouts/pages/ticketProjects/types";
import ProjectStatsKanbanCard from "./ProjectStatsKanbanCard";

type ProjectStatsKanbanColumnProps = {
  column: ProjectTypeColumnDef;
  projects: TicketProjectStatsDto[];
  highlightPersonIds?: Set<string> | null;
};

const ProjectStatsKanbanColumn = ({
  column,
  projects,
  highlightPersonIds,
}: ProjectStatsKanbanColumnProps) => {
  const colors = getProjectTypeColumnColors(column.label);

  return (
    <div
      className={cn(
        "flex min-w-[210px] w-full flex-col overflow-hidden border border-t-[3px] shadow-sm",
        colors.header,
        "border-slate-200/80 bg-white/40 backdrop-blur-sm dark:border-border dark:bg-card/40",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/60 px-3 py-2.5 dark:border-border dark:bg-card/60">
        <span className={cn("size-2 shrink-0 rounded-full", colors.dot)} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-foreground">
          {column.label}
          <span className="ml-1 font-normal text-slate-400">({projects.length})</span>
        </h3>
        <span
          className={cn(
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
            colors.badge,
          )}
        >
          {projects.length}
        </span>
      </div>

      <div
        className="flex flex-col gap-2 overflow-y-auto bg-gray-50 p-2 dark:bg-muted/20"
        style={{ maxHeight: "calc(100vh - 380px)", minHeight: "625px" }}
      >
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectStatsKanbanCard
              key={project.id}
              project={project}
              cardBorderClass={colors.cardBorder}
              highlightPersonIds={highlightPersonIds}
            />
          ))
        ) : (
          <div className="flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200/80 bg-slate-50/40 dark:border-border dark:bg-muted/10">
            <InboxIcon className="size-4 text-slate-300 dark:text-muted-foreground/40" aria-hidden />
            <span className="text-[11px] font-medium text-slate-400 dark:text-muted-foreground">
              Kart yok
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStatsKanbanColumn;
