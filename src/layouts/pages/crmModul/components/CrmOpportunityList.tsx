import { useMemo, useState } from "react";

import { ListModuleDto } from "api/generated";

import { Button } from "components/ui/button";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "components/ui/collapsible";

import { Briefcase, ChevronDown, Columns3, Plus, Sparkles } from "lucide-react";

import { cn } from "lib/utils";

import { getOpportunityStageLabel, KANBAN_PRIMARY_COLUMNS } from "../constants";

import {

  emptyCrmOpportunityFormValues,

  type CrmOpportunityFormValues,

} from "../formMappers";

import type { TcmbExchangeRates } from "../tcmbExchangeRates";

import { buildKanbanCardsFromOpportunities } from "../utils";

import { CrmOpportunityCard } from "./CrmOpportunityCard";

import { CrmOpportunityKanbanBoard } from "./CrmOpportunityKanbanBoard";



type CrmOpportunityListProps = {

  opportunities: CrmOpportunityFormValues[];

  modules: ListModuleDto[];

  expandedKey: string | null;

  exchangeRates: TcmbExchangeRates | null;

  onExpandedKeyChange: (key: string | null) => void;

  onChange: (opportunity: CrmOpportunityFormValues, options?: { autoSave?: boolean }) => void;

  onDelete: (clientKey: string) => void;

  onAdd: () => void;

};



export const CrmOpportunityList = ({

  opportunities,

  modules,

  expandedKey,

  exchangeRates,

  onExpandedKeyChange,

  onChange,

  onDelete,

  onAdd,

}: CrmOpportunityListProps) => {

  const [kanbanOpen, setKanbanOpen] = useState(false);



  const kanbanCards = useMemo(

    () => buildKanbanCardsFromOpportunities(opportunities, modules),

    [opportunities, modules]

  );



  const stageCounts = useMemo(() => {

    const counts = new Map<number, number>();

    kanbanCards.forEach((card) => {

      counts.set(card.stage, (counts.get(card.stage) ?? 0) + 1);

    });

    return counts;

  }, [kanbanCards]);



  const activeStageSummary = KANBAN_PRIMARY_COLUMNS.filter(

    (stage) => (stageCounts.get(stage) ?? 0) > 0

  );



  return (

    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-indigo-50/30">

        <div className="flex items-center gap-2.5 min-w-0">

          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 shrink-0">

            <Briefcase className="size-4 text-indigo-600" strokeWidth={1.75} />

          </span>

          <h2 className="text-base font-bold text-slate-900">Fırsat Paketleri</h2>

          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md bg-indigo-600 text-xs font-bold text-white tabular-nums">

            {opportunities.length}

          </span>

        </div>

        <Button

          type="button"

          size="sm"

          onClick={onAdd}

          className="gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 shadow-sm shadow-indigo-200"

        >

          <Plus className="size-4" />

          Fırsat Ekle

        </Button>

      </div>



      <div className={opportunities.length === 0 ? "p-4" : "p-1.5 space-y-1"}>

        {opportunities.length === 0 ? (

          <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent opacity-60" />

            <div className="relative">

              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">

                <Sparkles className="size-6 text-slate-400" />

              </div>

              <p className="text-sm font-medium text-slate-600">Henüz fırsat paketi eklenmedi</p>

              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">

                Bir fırsat paketi oluşturun, içine modül kalemleri ekleyin. Pipeline durumu tüm paket için ortaktır.

              </p>

              <Button

                type="button"

                size="sm"

                onClick={onAdd}

                className="mt-5 gap-2 bg-slate-900 hover:bg-slate-800 text-white"

              >

                <Plus className="size-4" />

                İlk Fırsatı Oluştur

              </Button>

            </div>

          </div>

        ) : (

          opportunities.map((opportunity, index) => (

            <CrmOpportunityCard

              key={opportunity.clientKey}

              opportunity={opportunity}

              index={index}

              modules={modules}

              isOpen={expandedKey === opportunity.clientKey}

              exchangeRates={exchangeRates}

              onOpenChange={(open) =>

                onExpandedKeyChange(open ? opportunity.clientKey : null)

              }

              onChange={onChange}

              onDelete={() => onDelete(opportunity.clientKey)}

            />

          ))

        )}

      </div>



      {opportunities.length > 0 && (

        <Collapsible open={kanbanOpen} onOpenChange={setKanbanOpen}>

          <div className="border-t border-slate-100 bg-slate-50/50">

            <CollapsibleTrigger asChild>

              <button

                type="button"

                className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-100/60 transition-colors"

              >

                <Columns3 className="size-4 text-indigo-600 shrink-0" />

                <span className="text-sm font-semibold text-slate-800 shrink-0">Pipeline Kanban</span>

                {!kanbanOpen && activeStageSummary.length > 0 && (

                  <span className="hidden sm:flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-thin">

                    {activeStageSummary.map((stage) => (

                      <span

                        key={stage}

                        className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 shrink-0"

                      >

                        <span className="font-medium truncate max-w-[72px]">

                          {getOpportunityStageLabel(stage)}

                        </span>

                        <span className="font-bold text-indigo-600 tabular-nums">

                          {stageCounts.get(stage)}

                        </span>

                      </span>

                    ))}

                  </span>

                )}

                <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 shrink-0">

                  {kanbanOpen ? "Gizle" : "Göster"}

                  <ChevronDown

                    className={cn(

                      "size-4 transition-transform duration-200",

                      kanbanOpen && "rotate-180"

                    )}

                  />

                </span>

              </button>

            </CollapsibleTrigger>



            <CollapsibleContent>

              <div className="px-3 pb-3 pt-0">

                <p className="text-[10px] text-slate-400 mb-2 px-1">

                  Karta tıklayınca ilgili fırsat yukarıda açılır

                </p>

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

            </CollapsibleContent>

          </div>

        </Collapsible>

      )}

    </section>

  );

};



export const createNewOpportunity = (): CrmOpportunityFormValues =>

  emptyCrmOpportunityFormValues();



/** @deprecated createNewOpportunity kullanın */

export const createNewOpportunityItem = (): CrmOpportunityFormValues =>

  createNewOpportunity();


