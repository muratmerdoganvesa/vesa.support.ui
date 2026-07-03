import { useMemo } from "react";
import { ListModuleDto } from "api/generated";
import { Columns3 } from "lucide-react";
import type { CrmOpportunityFormValues } from "../formMappers";
import { buildKanbanCardsFromOpportunities } from "../utils";
import { CrmOpportunityKanbanBoard } from "./CrmOpportunityKanbanBoard";

type CrmDetailPipelineKanbanProps = {
  opportunities: CrmOpportunityFormValues[];
  modules: ListModuleDto[];
  expandedKey: string | null;
  onExpandedKeyChange: (key: string | null) => void;
};

export const CrmDetailPipelineKanban = ({
  opportunities,
  modules,
  expandedKey,
  onExpandedKeyChange,
}: CrmDetailPipelineKanbanProps) => {
  const kanbanCards = useMemo(
    () => buildKanbanCardsFromOpportunities(opportunities, modules),
    [opportunities, modules]
  );

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-indigo-50/40">
        <div className="flex items-center gap-2 min-w-0">
          <Columns3 className="size-4 text-indigo-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-900">Pipeline Kanban</h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Karta tıklayınca fırsat detayı açılır
          </span>
        </div>
        <span className="text-xs font-semibold text-indigo-600 tabular-nums shrink-0">
          {kanbanCards.length} paket
        </span>
      </div>
      <div className="p-3">
        <CrmOpportunityKanbanBoard
          opportunities={kanbanCards}
          selectedCardId={expandedKey}
          density="compact"
          showColumnTotals={false}
          onOpenCard={(card) => {
            onExpandedKeyChange(card.id);
            const el = document.getElementById(`opp-card-${card.id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }}
        />
      </div>
    </section>
  );
};
