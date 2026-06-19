import { useMemo } from "react";
import { Building2, CalendarClock } from "lucide-react";
import { cn } from "lib/utils";
import { getProjectStatusLabel } from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { TicketProjectStatsDto } from "layouts/pages/ticketProjects/types";
import { ProjectPersonAvatar } from "layouts/pages/ticketProjects/components/ProjectPersonAvatar";
import { AvatarGroup, AvatarGroupCount } from "components/ui/avatar";
import { Badge } from "components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const MAX_VISIBLE_CONSULTANTS = 6;

type ProjectStatsKanbanCardProps = {
  project: TicketProjectStatsDto;
  cardBorderClass: string;
};

const ProjectStatsKanbanCard = ({ project, cardBorderClass }: ProjectStatsKanbanCardProps) => {
  const sortedEmployees = useMemo(
    () =>
      [...project.employees].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, "tr", { sensitivity: "base" }),
      ),
    [project.employees],
  );

  const visibleEmployees = sortedEmployees.slice(0, MAX_VISIBLE_CONSULTANTS);
  const hiddenEmployees = sortedEmployees.slice(MAX_VISIBLE_CONSULTANTS);
  const hiddenEmployeeCount = hiddenEmployees.length;

  const displayName = project.projectSubDescription
    ? `${project.projectDescription} — ${project.projectSubDescription}`
    : project.projectDescription;

  return (
    <article
      className={cn(
        "group bg-white border-l-[3px] p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-card",
        cardBorderClass,
      )}
      aria-label={`${displayName} proje kartı`}
    >
      <p className="mb-2 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 dark:text-foreground">
        {displayName || "—"}
      </p>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
          {getProjectStatusLabel(project.projectStatus)}
        </span>
      </div>

      <div className="mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
          <CalendarClock className="size-2.5 shrink-0" aria-hidden />
          {formatDate(project.createdDate)}
        </span>
      </div>

      {project.modules.length > 0 && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Modüller
          </p>
          <div className="flex flex-wrap gap-1">
            {project.modules.map((moduleName) => (
              <Badge
                key={moduleName}
                variant="secondary"
                className="rounded-full px-2 py-0 text-[10px] font-medium"
              >
                {moduleName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {sortedEmployees.length > 0 && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Danışmanlar
          </p>
          <TooltipProvider delayDuration={150}>
            <AvatarGroup className="justify-start">
              {visibleEmployees.map((employee) => (
                <ProjectPersonAvatar
                  key={employee.id}
                  fullName={employee.fullName}
                  profilePhoto={employee.profilePhoto}
                  size="sm"
                />
              ))}
              {hiddenEmployeeCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AvatarGroupCount
                      className="relative z-10 cursor-default"
                      aria-label={`${hiddenEmployeeCount} danışman daha`}
                    >
                      +{hiddenEmployeeCount}
                    </AvatarGroupCount>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4}>
                    {hiddenEmployees.map((e) => e.fullName).join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </AvatarGroup>
          </TooltipProvider>
        </div>
      )}

      {project.projectManager && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Proje Yöneticisi
          </p>
          <div className="flex items-center gap-2">
            <ProjectPersonAvatar
              fullName={project.projectManager.fullName}
              profilePhoto={project.projectManager.profilePhoto}
              size="sm"
              showTooltip={false}
            />
            <span className="truncate text-[11px] font-medium text-slate-700 dark:text-foreground">
              {project.projectManager.fullName}
            </span>
          </div>
        </div>
      )}

      {project.customerName && (
        <div className="flex items-center gap-1 border-t border-slate-100 pt-2 dark:border-border/60">
          <Building2 className="size-3 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
            {project.customerName}
          </span>
        </div>
      )}
    </article>
  );
};

export default ProjectStatsKanbanCard;
