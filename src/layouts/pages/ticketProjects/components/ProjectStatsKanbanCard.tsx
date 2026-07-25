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
    return (projectPart || "").trim();
  }

  const kalemPart = item.kalemName?.trim();
  if (projectPart && kalemPart) return `${projectPart} — ${kalemPart}`;
  return (projectPart || kalemPart || "").trim();
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
  const customerName = item.customerName?.trim() || "";
  const projectLabel = buildProjectLabel(item);
  const headline =
    customerName && projectLabel
      ? `${customerName} · ${projectLabel}`
      : customerName || projectLabel || "İsimsiz kart";

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
        "w-full rounded-md border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card",
        "border-l-[3px]",
        isSimulated
          ? cn(
              SIMULATED_PLAN_CARD_COLORS.cardBorder,
              isExpanded && SIMULATED_PLAN_CARD_COLORS.cardBg,
            )
          : cn(cardBorderClass, isExpanded && "ring-1 ring-slate-200 dark:ring-border"),
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleToggle}
        onKeyDown={handleHeaderKeyDown}
        className="flex w-full cursor-pointer items-start gap-2 px-2.5 py-2 text-left hover:bg-slate-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:hover:bg-muted/40"
        aria-label={`${headline} kartını ${isExpanded ? "daralt" : "genişlet"}`}
        title={headline}
      >
        <div className="min-w-0 flex-1">
          {/* Soft UI global `p` stillerinden kaçınmak için span */}
          <span className="block truncate text-[13px] font-bold leading-5 text-slate-900 dark:text-foreground">
            {customerName || projectLabel || "İsimsiz kart"}
            {customerName && projectLabel ? (
              <span className="font-semibold text-slate-600 dark:text-muted-foreground">
                {" · "}
                {projectLabel}
              </span>
            ) : null}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-slate-400 transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
          aria-hidden
        />
      </div>

      {isExpanded && (
        <div className="space-y-2 border-t border-slate-100 px-2.5 pb-2.5 pt-2 dark:border-border">
          {customerName && projectLabel && (
            <div className="space-y-0.5">
              <span className="block text-[12px] font-bold leading-snug text-slate-900 dark:text-foreground">
                {customerName}
              </span>
              <span className="block text-[11px] font-medium leading-snug text-slate-600 dark:text-muted-foreground">
                {projectLabel}
              </span>
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
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Modüller
              </span>
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
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Danışmanlar
              </span>
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
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Proje Yöneticisi
              </span>
              <span className={getPersonNameClass(item.projectManager.id, highlightPersonIds)}>
                {item.projectManager.fullName}
              </span>
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
      )}
    </article>
  );
};

export default memo(ProjectStatsKanbanCard);
