import { memo, type KeyboardEvent } from "react";
import {
  CalendarClock,
  ChevronDown,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { ProjectTypes } from "api/generated";
import { cn } from "lib/utils";
import {
  getProjectTypeColumns,
  SIMULATED_PLAN_CARD_COLORS,
  UNASSIGNED_PROJECT_TYPE_KEY,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { StatsBoardItem } from "layouts/pages/ticketProjects/types";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import AskProjectStatusPanel from "./AskProjectStatusPanel";

const STATUS_COLUMNS = getProjectTypeColumns();

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
    "text-[10px] leading-snug",
    highlightPersonIds?.has(personId)
      ? "font-bold text-slate-900 dark:text-foreground"
      : highlightPersonIds
        ? "font-medium text-slate-400 dark:text-muted-foreground"
        : "font-medium text-slate-500 dark:text-muted-foreground",
  );

/** "Tibet - SuccessFactors..." gibi proje metninden baştaki müşteri tekrarını düş */
const stripLeadingCustomerName = (label: string, customerName: string): string => {
  const labelTrim = label.trim();
  const customer = customerName.trim();
  if (!labelTrim || !customer) return labelTrim;

  const escaped = customer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefix = new RegExp(`^${escaped}\\s*[-–—:]\\s*`, "i");
  return labelTrim.replace(prefix, "").trim() || labelTrim;
};

type ProjectTitleParts = {
  /** Proje yolu (müşteri öneki temizlenmiş) */
  projectPath: string;
  /** Kalem / adım adı — açık kartta gösterilir */
  stepName: string;
};

const buildProjectTitleParts = (item: StatsBoardItem): ProjectTitleParts => {
  const projectPath = stripLeadingCustomerName(
    (item.projectDescription || "").trim(),
    item.customerName ?? "",
  );
  const stepName =
    item.kind === "kalem" ? (item.kalemName?.trim() || "") : "";

  return { projectPath, stepName };
};

const DEFAULT_GANTT_CHART_PATH = "/projectmanagement/chart";

const openGanttChart = (item: StatsBoardItem, chartPath = DEFAULT_GANTT_CHART_PATH) => {
  const params = new URLSearchParams({
    cid: item.workCompanyId as string,
    pid: item.projectId,
  });
  if (item.customerName) params.set("wcn", item.customerName);
  if (item.projectDescription) params.set("pn", item.projectDescription);
  if (item.projectSubDescription) params.set("psn", item.projectSubDescription);

  window.open(`${chartPath}?${params.toString()}`, "_blank", "noopener,noreferrer");
};

type ProjectStatsKanbanCardProps = {
  item: StatsBoardItem;
  cardBorderClass: string;
  isExpanded: boolean;
  onToggleExpand: (itemId: string) => void;
  highlightPersonIds?: Set<string> | null;
  onEditSimulated?: (item: StatsBoardItem) => void;
  onDeleteSimulated?: (item: StatsBoardItem) => void;
  onChangeSimulatedStatus?: (
    item: StatsBoardItem,
    projectStatus: ProjectTypes | null,
  ) => void;
  onAskStatusSuccess?: (message: string) => void;
  onAskStatusError?: (message: string) => void;
  ganttChartPath?: string;
};

const ProjectStatsKanbanCard = ({
  item,
  cardBorderClass,
  isExpanded,
  onToggleExpand,
  highlightPersonIds,
  onEditSimulated,
  onDeleteSimulated,
  onChangeSimulatedStatus,
  onAskStatusSuccess,
  onAskStatusError,
  ganttChartPath = DEFAULT_GANTT_CHART_PATH,
}: ProjectStatsKanbanCardProps) => {
  const isSimulated = item.kind === "simulated";
  const customerName = item.customerName?.trim() || "";
  const { projectPath, stepName } = buildProjectTitleParts(item);
  const moduleNames = (item.modules ?? []).map((m) => String(m).trim()).filter(Boolean);
  const moduleLabel = moduleNames.join(", ");
  const hasModules = moduleNames.length > 0;
  const consultants = item.employees ?? [];
  const headline =
    [customerName, projectPath, hasModules ? moduleLabel : stepName]
      .filter(Boolean)
      .join(" · ") || "İsimsiz kart";

  const canNavigateToGantt = !isSimulated && Boolean(item.workCompanyId && item.projectId);
  const formattedDate = formatDate(item.createdDate);
  const simulatedStatusValue =
    item.projectStatus == null ? UNASSIGNED_PROJECT_TYPE_KEY : String(item.projectStatus);

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
          <span className="block truncate text-[13px] font-bold leading-5 text-slate-900 dark:text-foreground">
            {customerName || "İsimsiz müşteri"}
          </span>
          {consultants.length > 0 ? (
            <ul className="mt-0.5 flex flex-col gap-0" aria-label="Danışmanlar">
              {consultants.map((employee) => (
                <li
                  key={employee.id}
                  className={cn("truncate", getPersonNameClass(employee.id, highlightPersonIds))}
                >
                  {employee.fullName}
                </li>
              ))}
            </ul>
          ) : (
            <span className="mt-0.5 block text-[10px] font-medium text-slate-400 dark:text-muted-foreground">
              Danışman yok
            </span>
          )}
          {hasModules ? (
            <span
              className="mt-1 inline-flex max-w-full truncate rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
              title={`Modül: ${moduleLabel}`}
            >
              {moduleLabel}
            </span>
          ) : (
            <span
              className="mt-1 inline-flex max-w-full truncate text-[10px] font-semibold text-red-600 dark:text-red-400"
              title="Modül girilmemiş"
            >
              modul girilmemiş
            </span>
          )}
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
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
              <CalendarClock className="size-2.5 shrink-0" aria-hidden />
              {formattedDate}
            </span>
          </div>

          {projectPath ? (
            <div className="space-y-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Proje
              </span>
              <span
                className="block text-[11px] font-medium leading-snug text-slate-700 dark:text-foreground"
                title={projectPath}
              >
                {projectPath}
              </span>
            </div>
          ) : null}

          {stepName ? (
            <div className="space-y-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Görev
              </span>
              <span
                className="block text-[11px] font-medium leading-snug text-slate-700 dark:text-foreground"
                title={stepName}
              >
                {stepName}
              </span>
            </div>
          ) : null}

          {isSimulated && onChangeSimulatedStatus && (
            <div
              className="space-y-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Durum (kolon)
              </Label>
              <Select
                value={simulatedStatusValue}
                onValueChange={(value) => {
                  if (value == null) return;
                  const nextStatus =
                    value === UNASSIGNED_PROJECT_TYPE_KEY
                      ? null
                      : (Number(value) as ProjectTypes);
                  const currentStatus = item.projectStatus ?? null;
                  if (nextStatus === currentStatus) return;
                  onChangeSimulatedStatus(item, nextStatus);
                }}
              >
                <SelectTrigger className="h-8 w-full bg-white text-[11px] dark:bg-card">
                  <SelectValue placeholder="Kolon seçin" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="z-[1200] w-(--radix-select-trigger-width)"
                >
                  {STATUS_COLUMNS.map((column) => (
                    <SelectItem
                      key={String(column.key)}
                      value={
                        column.projectType == null
                          ? UNASSIGNED_PROJECT_TYPE_KEY
                          : String(column.projectType)
                      }
                      className="text-[11px]"
                    >
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  openGanttChart(item, ganttChartPath);
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

          {onAskStatusSuccess && onAskStatusError && (
            <AskProjectStatusPanel
              item={item}
              onSuccess={onAskStatusSuccess}
              onError={onAskStatusError}
            />
          )}
        </div>
      )}
    </article>
  );
};

export default memo(ProjectStatsKanbanCard);
