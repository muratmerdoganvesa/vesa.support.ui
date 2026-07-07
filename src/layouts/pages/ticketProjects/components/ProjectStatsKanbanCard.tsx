import { memo, type KeyboardEvent } from "react";
import { Building2, CalendarClock } from "lucide-react";
import { cn } from "lib/utils";
import { getProjectStatusLabel } from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { StatsBoardItem } from "layouts/pages/ticketProjects/types";
import { Badge } from "components/ui/badge";

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getPersonNameClass = (personId: string, highlightPersonIds?: Set<string> | null) =>
  cn(
    "text-[11px] leading-snug",
    highlightPersonIds?.has(personId)
      ? "font-bold text-slate-900 dark:text-foreground"
      : highlightPersonIds
        ? "font-medium text-slate-400 dark:text-muted-foreground"
        : "font-medium text-slate-700 dark:text-foreground",
  );

const buildDisplayName = (item: StatsBoardItem): string => {
  const projectPart = item.projectSubDescription
    ? `${item.projectDescription} — ${item.projectSubDescription}`
    : item.projectDescription;

  if (item.kind === "project") {
    return projectPart || "—";
  }

  const kalemPart = item.kalemName?.trim();
  if (projectPart && kalemPart) return `${projectPart} — ${kalemPart}`;
  return projectPart || kalemPart || "—";
};

type ProjectStatsKanbanCardProps = {
  item: StatsBoardItem;
  cardBorderClass: string;
  highlightPersonIds?: Set<string> | null;
};

const ProjectStatsKanbanCard = ({
  item,
  cardBorderClass,
  highlightPersonIds,
}: ProjectStatsKanbanCardProps) => {
  const displayName = buildDisplayName(item);
  const statusLabel =
    item.kind === "project" ? "Seçilmedi" : getProjectStatusLabel(item.projectStatus);

  const canNavigateToGantt = Boolean(item.workCompanyId && item.projectId);

  const handleCardClick = () => {
    if (!canNavigateToGantt) return;

    const params = new URLSearchParams({
      cid: item.workCompanyId as string,
      pid: item.projectId,
    });
    if (item.customerName) params.set("wcn", item.customerName);
    if (item.projectDescription) params.set("pn", item.projectDescription);
    if (item.projectSubDescription) params.set("psn", item.projectSubDescription);

    window.open(`/projectmanagement/chart?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canNavigateToGantt) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      role={canNavigateToGantt ? "button" : undefined}
      tabIndex={canNavigateToGantt ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group min-w-0 w-full bg-white border-l-[3px] p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-card",
        cardBorderClass,
        canNavigateToGantt &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      aria-label={
        canNavigateToGantt
          ? `${displayName} kartı, gantt chart tablosunu yeni sekmede açmak için tıklayın`
          : `${displayName} kartı`
      }
    >
      {item.customerName && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <Building2 className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <p className="break-words text-[13px] font-bold leading-snug text-slate-900 dark:text-foreground">
            {item.customerName}
          </p>
        </div>
      )}

      <p className="mb-2 break-words text-[12px] font-medium leading-snug text-slate-600 dark:text-muted-foreground">
        {displayName}
      </p>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
          {statusLabel}
        </span>
      </div>

      <div className="mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
          <CalendarClock className="size-2.5 shrink-0" aria-hidden />
          {formatDate(item.createdDate)}
        </span>
      </div>

      {item.modules.length > 0 && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Modüller
          </p>
          <div className="flex flex-wrap gap-1">
            {item.modules.map((moduleName) => (
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

      {item.employees.length > 0 && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Danışmanlar
          </p>
          <ul className="flex flex-col gap-0.5" aria-label="Danışman listesi">
            {item.employees.map((employee) => (
              <li key={employee.id} className={getPersonNameClass(employee.id, highlightPersonIds)}>
                {employee.fullName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.projectManager && (
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Proje Yöneticisi
          </p>
          <p className={getPersonNameClass(item.projectManager.id, highlightPersonIds)}>
            {item.projectManager.fullName}
          </p>
        </div>
      )}
    </article>
  );
};

export default memo(ProjectStatsKanbanCard);
