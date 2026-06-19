import { Check, Folder, User } from "lucide-react";
import { Badge } from "components/ui/badge";
import { cn } from "lib/utils";
import { getProjectStatusLabel } from "layouts/pages/ticketProjects/projectTypeHelpers";
import { ProjectWorkloadSummary } from "../types";

interface ProjectRowCardProps {
  project: ProjectWorkloadSummary;
  isSelected: boolean;
  onClick: (project: ProjectWorkloadSummary) => void;
}

const ProjectRowCard = ({ project, isSelected, onClick }: ProjectRowCardProps) => {
  const label = project.subProjectName
    ? `${project.projectName} – ${project.subProjectName}`
    : project.projectName;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onClick(project)}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border/30 px-4 py-3 text-left last:border-0",
        "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        !project.isActive && "opacity-60",
        isSelected
          ? "bg-indigo-50 dark:bg-indigo-950/40"
          : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Folder
        className={cn(
          "mt-0.5 size-4 shrink-0",
          isSelected ? "text-indigo-500" : project.isActive ? "text-muted-foreground" : "text-muted-foreground/50",
        )}
        aria-hidden
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "font-medium leading-snug",
              isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-foreground",
            )}
          >
            {label}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {!project.isActive && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                Pasif
              </Badge>
            )}
            {isSelected && (
              <Check className="size-3.5 text-indigo-500" aria-hidden />
            )}
          </div>
        </div>

        {project.managerName && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{project.managerName}</span>
          </div>
        )}

        <div className="mt-1.5">
          <Badge
            variant="secondary"
            className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
          >
            {getProjectStatusLabel(project.projectStatus)}
          </Badge>
        </div>

        {/* Mini progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                project.avgProgress >= 80
                  ? "bg-emerald-500"
                  : project.avgProgress >= 50
                    ? "bg-indigo-500"
                    : "bg-amber-400",
              )}
              style={{ width: `${project.avgProgress}%` }}
              aria-label={`${project.avgProgress}% tamamlandı`}
            />
          </div>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            {project.avgProgress}%
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground/60">
            {project.taskCount} görev
          </span>
        </div>
      </div>
    </button>
  );
};

export default ProjectRowCard;
