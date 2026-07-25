import { memo, type KeyboardEvent } from "react";
import {
  CalendarClock,
  ChevronDown,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "lib/utils";
import {
  getProjectStatusLabel,
  SIMULATED_PLAN_CARD_COLORS,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { StatsBoardItem } from "layouts/pages/ticketProjects/types";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";

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

const buildProjectLabel = (item: StatsBoardItem): string => {
  const projectPart = item.projectSubDescription
    ? `${item.projectDescription} — ${item.projectSubDescription}`
    : item.projectDescription;

  if (item.kind === "project" || item.kind === "simulated") {
    return projectPart?.trim() || "";
  }

  const kalemPart = item.kalemName?.trim();
  if (projectPart && kalemPart) return `${projectPart} — ${kalemPart}`;
  return (projectPart || kalemPart || "").trim();
};

/** Kapalı kartta tek satır: Müşteri · Proje */
const buildHeadline = (item: StatsBoardItem): string => {
  const customer = item.customerName?.trim() || "";
  const project = buildProjectLabel(item);

  if (customer && project) return `${customer} · ${project}`;
  return customer || project || "—";
};

const openGanttChart = (item: StatsBoardItem) => {
  const params = new URLSearchParams({
    cid: item.workCompanyId as string,
    pid: item.projectId,
  });
  if (item.customerName) params.set("wcn", item.customerName);
  if (item.projectDescription) params.set("pn", item.projectDescription);
  if (item.projectSubDescription) params.set("psn", item.projectSubDescription);

  window.open(`/projectmanagement/chart?${params.toString()}`, "_blank", "noopener,noreferrer");
};

type ProjectStatsKanbanCardProps = {
  item: StatsBoardItem;
  cardBorderClass: string;
  isExpanded: boolean;
  onToggleExpand: (itemId: string) => void;
  highlightPersonIds?: Set<string> | null;
  onEditSimulated?: (item: StatsBoardItem) => void;
  onDeleteSimulated?: (item: StatsBoardItem) => void;
};

const ProjectStatsKanbanCard = ({
  item,
  cardBorderClass,
  isExpanded,
  onToggleExpand,
  highlightPersonIds,
  onEditSimulated,
  onDeleteSimulated,
}: ProjectStatsKanbanCardProps) => {
  const isSimulated = item.kind === "simulated";
  const headline = buildHeadline(item);
  const projectLabel = buildProjectLabel(item);
  const statusLabel =
    item.kind === "project"
      ? "Seçilmedi"
      : item.projectStatus == null
        ? "Seçilmedi"
        : getProjectStatusLabel(item.projectStatus);

  const canNavigateToGantt = !isSimulated && Boolean(item.workCompanyId && item.projectId);
  const formattedDate = formatDate(item.createdDate);

  const handleToggle = () => {
    onToggleExpand(item.id);
  };

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <article
      className={cn(
        "group min-w-0 w-full overflow-hidden rounded-md border border-slate-200/80 border-l-[3px] bg-white shadow-sm transition-shadow duration-150 dark:border-border dark:bg-card",
        isSimulated
          ? cn(
              SIMULATED_PLAN_CARD_COLORS.cardBorder,
              isExpanded ? SIMULATED_PLAN_CARD_COLORS.cardBg : "hover:bg-rose-50/50 dark:hover:bg-rose-950/20",
            )
          : cn(cardBorderClass, isExpanded && "shadow-md", "hover:bg-slate-50/80 dark:hover:bg-muted/40"),
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleToggle}
        onKeyDown={handleHeaderKeyDown}
        className={cn(
          "flex min-h-10 w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        )}
        aria-label={`${headline} kartını ${isExpanded ? "daralt" : "genişlet"}`}
        title={headline}
      >
        {isSimulated && (
          <span
            className="size-1.5 shrink-0 rounded-full bg-rose-500"
            title="Plan"
            aria-hidden
          />
        )}

        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-snug text-slate-800 dark:text-foreground">
          {headline}
        </p>

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
          aria-hidden
        />
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-2 border-t border-slate-100 px-2.5 pb-2.5 pt-2 dark:border-border">
            {item.customerName?.trim() && projectLabel && (
              <div className="space-y-0.5">
                <p className="break-words text-[12px] font-bold leading-snug text-slate-900 dark:text-foreground">
                  {item.customerName.trim()}
                </p>
                <p className="break-words text-[11px] font-medium leading-snug text-slate-600 dark:text-muted-foreground">
                  {projectLabel}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              {isSimulated && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                    SIMULATED_PLAN_CARD_COLORS.badge,
                  )}
                >
                  Plan
                </span>
              )}
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                {statusLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
                <CalendarClock className="size-2.5 shrink-0" aria-hidden />
                {formattedDate}
              </span>
            </div>

            {item.modules.length > 0 && (
              <div className="space-y-1">
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
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Danışmanlar
                </p>
                <ul className="flex flex-col gap-0.5" aria-label="Danışman listesi">
                  {item.employees.map((employee) => (
                    <li
                      key={employee.id}
                      className={getPersonNameClass(employee.id, highlightPersonIds)}
                    >
                      {employee.fullName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.projectManager && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Proje Yöneticisi
                </p>
                <p className={getPersonNameClass(item.projectManager.id, highlightPersonIds)}>
                  {item.projectManager.fullName}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {canNavigateToGantt && (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="h-7 gap-1 text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    openGanttChart(item);
                  }}
                >
                  <ExternalLink className="size-3" aria-hidden />
                  Gantt
                </Button>
              )}

              {isSimulated && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                    aria-label="Plan kartını düzenle"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSimulated?.(item);
                    }}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                    aria-label="Plan kartını sil"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSimulated?.(item);
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default memo(ProjectStatsKanbanCard);
