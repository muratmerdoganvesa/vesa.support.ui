import { OpportunityStage } from "api/generated";
import { CalendarDays, Layers } from "lucide-react";
import { cn } from "lib/utils";
import {
  getCurrencySymbol,
  getOpportunityStageLabel,
  getOpportunityStageProbability,
  KANBAN_PRIMARY_COLUMNS,
  KANBAN_PIPELINE_COLUMNS,
} from "../constants";
import { formatEstimatedValueDisplay } from "../formMappers";
import type { CrmKanbanOpportunity } from "../utils";
import { formatDateTr, getCompanyInitials } from "../utils";

const COLUMN_STYLES: Record<OpportunityStage, { header: string; dot: string }> = {
  [OpportunityStage.NUMBER_0]: {
    header: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  [OpportunityStage.NUMBER_1]: {
    header: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  [OpportunityStage.NUMBER_2]: {
    header: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  [OpportunityStage.NUMBER_3]: {
    header: "bg-indigo-50 text-indigo-800 border-indigo-200",
    dot: "bg-indigo-500",
  },
  [OpportunityStage.NUMBER_4]: {
    header: "bg-violet-50 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  [OpportunityStage.NUMBER_5]: {
    header: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  [OpportunityStage.NUMBER_6]: {
    header: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [OpportunityStage.NUMBER_7]: {
    header: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  [OpportunityStage.NUMBER_8]: {
    header: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const KanbanCard = ({
  card,
  showCompany,
  isSelected,
  compact,
  onOpen,
}: {
  card: CrmKanbanOpportunity;
  showCompany: boolean;
  isSelected?: boolean;
  compact?: boolean;
  onOpen: () => void;
}) => {
  const symbol = getCurrencySymbol(card.primaryCurrency);
  const amountLabel =
    card.primaryAmount > 0
      ? formatEstimatedValueDisplay(String(card.primaryAmount), symbol)
      : null;
  const closeLabel = card.expectedCloseDate ? formatDateTr(card.expectedCloseDate) : null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full text-left rounded-md border bg-white px-2 py-1.5 transition-all",
          isSelected
            ? "border-amber-400 ring-1 ring-amber-200"
            : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
        )}
      >
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
            {card.title}
          </p>
          {amountLabel && (
            <span className="text-[10px] font-bold text-indigo-700 tabular-nums shrink-0">
              {amountLabel}
            </span>
          )}
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5 truncate">
          {card.kalemCount} kalem
          {closeLabel && closeLabel !== "—" ? ` · ${closeLabel}` : ""}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full text-left rounded-lg border bg-white p-3 shadow-sm transition-all",
        isSelected
          ? "border-amber-400 ring-2 ring-amber-200 shadow-md"
          : "border-slate-200 hover:border-indigo-300 hover:shadow-md hover:ring-2 hover:ring-indigo-100"
      )}
    >
      {showCompany && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700 shrink-0">
            {getCompanyInitials(card.companyName)}
          </span>
          <span className="text-xs font-semibold text-slate-600 truncate">{card.companyName}</span>
        </div>
      )}
      <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{card.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Layers className="size-3.5" />
          {card.kalemCount} kalem
        </span>
        {closeLabel && closeLabel !== "—" && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {closeLabel}
          </span>
        )}
      </div>
      {amountLabel && (
        <p className="mt-2 text-sm font-bold text-indigo-700 tabular-nums">
          {amountLabel}
          {card.hasMultipleCurrencies && (
            <span className="text-[10px] font-normal text-slate-400 ml-1">(çoklu PB)</span>
          )}
        </p>
      )}
    </button>
  );
};

export type CrmOpportunityKanbanBoardProps = {
  opportunities: CrmKanbanOpportunity[];
  showCompany?: boolean;
  selectedCardId?: string | null;
  density?: "default" | "compact";
  maxHeightClass?: string;
  showColumnTotals?: boolean;
  onOpenCard: (card: CrmKanbanOpportunity) => void;
};

export const CrmOpportunityKanbanBoard = ({
  opportunities,
  showCompany = false,
  selectedCardId = null,
  density = "default",
  maxHeightClass,
  showColumnTotals = true,
  onOpenCard,
}: CrmOpportunityKanbanBoardProps) => {
  const compact = density === "compact";
  const resolvedMaxHeight =
    maxHeightClass ?? (compact ? "max-h-[168px]" : "max-h-[calc(100vh-320px)]");
  const columnWidth = compact ? "w-[148px]" : "w-[260px]";
  const columnGap = compact ? "gap-2" : "gap-3";
  const byStage = KANBAN_PIPELINE_COLUMNS.reduce(
    (acc, stage) => {
      acc[stage] = opportunities.filter((o) => o.stage === stage);
      return acc;
    },
    {} as Record<OpportunityStage, CrmKanbanOpportunity[]>
  );

  const displayColumns = [
    ...KANBAN_PRIMARY_COLUMNS,
    ...KANBAN_PIPELINE_COLUMNS.filter(
      (stage) =>
        !KANBAN_PRIMARY_COLUMNS.includes(stage) && (byStage[stage]?.length ?? 0) > 0
    ),
  ];

  return (
    <div className="overflow-x-auto">
      <div className={cn("flex min-w-max items-start", columnGap)}>
        {displayColumns.map((stage) => {
          const cards = byStage[stage] ?? [];
          const styles = COLUMN_STYLES[stage];
          const probability = getOpportunityStageProbability(stage);
          const columnTotal = cards.reduce((sum, c) => sum + c.primaryAmount, 0);

          return (
            <div
              key={stage}
              className={cn(
                columnWidth,
                "shrink-0 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col",
                resolvedMaxHeight
              )}
            >
              <div
                className={cn(
                  "shrink-0 border-b rounded-t-lg",
                  compact ? "px-2 py-1.5" : "px-3 py-2.5",
                  styles.header
                )}
                title={compact && probability > 0 ? `%${probability} olasılık` : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("rounded-full shrink-0", compact ? "size-1.5" : "size-2", styles.dot)} />
                  <span className={cn("font-bold truncate", compact ? "text-[10px]" : "text-sm")}>
                    {getOpportunityStageLabel(stage)}
                  </span>
                  <span
                    className={cn(
                      "ml-auto font-bold tabular-nums opacity-80",
                      compact ? "text-[9px]" : "text-xs"
                    )}
                  >
                    {cards.length}
                  </span>
                </div>
                {!compact && probability > 0 && (
                  <p className="text-[10px] mt-0.5 opacity-70 pl-4">%{probability} olasılık</p>
                )}
              </div>

              <div
                className={cn(
                  "flex-1 overflow-y-auto space-y-1.5",
                  compact ? "p-1.5 min-h-[52px]" : "p-2 space-y-2 min-h-[120px]"
                )}
              >
                {cards.length === 0 ? (
                  <p
                    className={cn(
                      "text-slate-400 text-center",
                      compact ? "text-[9px] py-3 px-1" : "text-xs py-6 px-2"
                    )}
                  >
                    Boş
                  </p>
                ) : (
                  cards.map((card) => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      showCompany={showCompany}
                      isSelected={selectedCardId === card.id}
                      compact={compact}
                      onOpen={() => onOpenCard(card)}
                    />
                  ))
                )}
              </div>

              {showColumnTotals &&
                !compact &&
                (() => {
                const currencies = new Set(
                  cards.map((c) => c.primaryCurrency).filter((c) => c !== 0)
                );
                if (columnTotal <= 0 || currencies.size !== 1) return null;
                return (
                  <div className="shrink-0 px-3 py-2 border-t border-slate-200/80 text-xs text-slate-500 bg-white/60 rounded-b-xl">
                    Toplam:{" "}
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {formatEstimatedValueDisplay(
                        String(columnTotal),
                        getCurrencySymbol(cards[0].primaryCurrency)
                      )}
                    </span>
                  </div>
                );
                })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
