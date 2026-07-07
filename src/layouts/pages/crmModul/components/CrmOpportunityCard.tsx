import { ListModuleDto } from "api/generated";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "components/ui/collapsible";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "lib/utils";
import {
  getOpportunityStageBadgeClass,
  getOpportunityStageLabel,
  getOpportunityStageProbability,
} from "../constants";
import {
  emptyCrmKalemFormValues,
  type CrmKalemFormValues,
  type CrmOpportunityFormValues,
} from "../formMappers";
import type { TcmbExchangeRates } from "../tcmbExchangeRates";
import { convertCurrencyTotalsToEur, formatEurRounded } from "../tcmbExchangeRates";
import {
  calculateOpportunityTotals,
  formatNonZeroCurrencyTotals,
  formatOpportunityCreatedLabel,
  getOpportunityDisplayTitle,
  hasOpportunityAmount,
} from "../utils";
import { CurrencyEuroConversion } from "./CurrencyEuroConversion";
import { CrmKalemGrid } from "./CrmKalemGrid";
import { CrmPipelineStageBar } from "./CrmPipelineStageBar";

type CrmOpportunityChangeOptions = {
  autoSave?: boolean;
};

type CrmOpportunityCardProps = {
  opportunity: CrmOpportunityFormValues;
  index: number;
  modules: ListModuleDto[];
  isOpen: boolean;
  exchangeRates: TcmbExchangeRates | null;
  onOpenChange: (open: boolean) => void;
  onChange: (opportunity: CrmOpportunityFormValues, options?: CrmOpportunityChangeOptions) => void;
  onDelete: () => void;
};

export const CrmOpportunityCard = ({
  opportunity,
  index,
  modules,
  isOpen,
  exchangeRates,
  onOpenChange,
  onChange,
  onDelete,
}: CrmOpportunityCardProps) => {
  const title = getOpportunityDisplayTitle(opportunity, modules);
  const kalemCount = opportunity.kalems.length;
  const totals = calculateOpportunityTotals(opportunity);
  const probability = getOpportunityStageProbability(opportunity.opportunityStage);
  const stageLabel = getOpportunityStageLabel(opportunity.opportunityStage);

  const primaryCloseDate = opportunity.kalems.find((k) => k.expectedCloseDate)?.expectedCloseDate;
  const closeLabel = primaryCloseDate
    ? format(primaryCloseDate, "dd.MM.yy", { locale: tr })
    : null;
  const createdLabel = formatOpportunityCreatedLabel(opportunity);

  const handleKalemChange = (kalem: CrmKalemFormValues) => {
    onChange({
      ...opportunity,
      kalems: opportunity.kalems.map((k) =>
        k.clientKey === kalem.clientKey ? kalem : k
      ),
    });
  };

  const handleAddKalem = () => {
    onChange({
      ...opportunity,
      kalems: [...opportunity.kalems, emptyCrmKalemFormValues()],
    });
  };

  const handleDeleteKalem = (clientKey: string) => {
    const nextKalems = opportunity.kalems.filter((k) => k.clientKey !== clientKey);
    onChange({
      ...opportunity,
      kalems: nextKalems.length > 0 ? nextKalems : [emptyCrmKalemFormValues()],
    });
  };

  const handleStageChange = (stage: typeof opportunity.opportunityStage) => {
    onChange({ ...opportunity, opportunityStage: stage }, { autoSave: true });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <article
        id={`opp-card-${opportunity.clientKey}`}
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-200",
          isOpen
            ? "border-slate-300 bg-white shadow-md ring-1 ring-slate-900/5"
            : "border-slate-200 bg-white hover:border-slate-300"
        )}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-0.5",
            isOpen ? "bg-amber-500" : "bg-slate-200 group-hover:bg-slate-300"
          )}
        />

        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 pl-2.5 pr-2 text-left",
              isOpen ? "py-2" : "py-1.5"
            )}
            aria-expanded={isOpen}
            aria-label={`${title} fırsat detayını ${isOpen ? "kapat" : "aç"}`}
          >
            <ChevronRight
              className={cn(
                "size-3.5 text-slate-400 shrink-0 transition-transform duration-200",
                isOpen && "rotate-90 text-amber-600"
              )}
            />

            <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0 w-5">
              {index + 1}
            </span>

            <div className="flex-1 min-w-0">
              {isOpen ? (
                <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{title}</p>
              ) : (
                <p className="text-sm leading-tight truncate">
                  <span className="font-semibold text-slate-900">{title}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {kalemCount} kalem
                    {createdLabel && ` · ${createdLabel}`}
                    {closeLabel && ` · Kap. ${closeLabel}`}
                  </span>
                </p>
              )}
            </div>

            {isOpen && (
              <div className="hidden lg:flex items-center gap-2 shrink-0 text-[10px] text-slate-400 tabular-nums">
                {createdLabel && <span>Oluşt. {createdLabel}</span>}
                {closeLabel && <span>Kap. {closeLabel}</span>}
                {probability > 0 && <span>%{probability}</span>}
              </div>
            )}

            <Badge
              className={cn(
                "shrink-0 px-2 text-[10px] font-semibold rounded border-0 shadow-none",
                isOpen ? "h-6" : "h-5",
                getOpportunityStageBadgeClass(opportunity.opportunityStage)
              )}
            >
              {stageLabel}
            </Badge>

            <div className={cn("shrink-0 text-right", isOpen ? "min-w-[88px]" : "min-w-[56px]")}>
              {hasOpportunityAmount(totals) ? (
                <>
                  <p
                    className={cn(
                      "font-bold text-slate-900 tabular-nums leading-tight",
                      isOpen
                        ? totals.hasMultipleCurrencies
                          ? "text-xs"
                          : "text-base leading-none"
                        : totals.hasMultipleCurrencies
                          ? "text-[10px]"
                          : "text-sm leading-none"
                    )}
                  >
                    {formatNonZeroCurrencyTotals(totals.currencyTotals)}
                  </p>
                  {isOpen && exchangeRates && (
                    totals.hasMultipleCurrencies ? (
                      <p className="text-[10px] font-semibold text-teal-800 tabular-nums mt-0.5">
                        {formatEurRounded(
                          convertCurrencyTotalsToEur(totals.currencyTotals, exchangeRates)
                        )}
                      </p>
                    ) : (
                      <CurrencyEuroConversion
                        amount={totals.primaryAmount}
                        currencyType={totals.primaryCurrency}
                        rates={exchangeRates}
                        className="text-[10px]"
                      />
                    )
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-300">—</p>
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100">
            <div className="px-3 py-2 border-b border-slate-100 bg-white">
              <Label htmlFor={`opp-name-${opportunity.clientKey}`} className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Fırsat Adı
              </Label>
              <Input
                id={`opp-name-${opportunity.clientKey}`}
                value={opportunity.name}
                onChange={(e) => onChange({ ...opportunity, name: e.target.value })}
                onBlur={(e) =>
                  onChange({ ...opportunity, name: e.target.value }, { autoSave: true })
                }
                placeholder="Örn. EC Lisans Paketi, 2026 Yenileme..."
                className="mt-1 h-9 bg-slate-50/50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 bg-slate-50/60 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <CrmPipelineStageBar
                  currentStage={opportunity.opportunityStage}
                  onStageChange={handleStageChange}
                  variant="pills"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 px-2 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] shrink-0"
              >
                <Trash2 className="size-3" />
                Sil
              </Button>
            </div>

            <div className="px-2 py-2">
              <CrmKalemGrid
                kalems={opportunity.kalems}
                modules={modules}
                onChange={handleKalemChange}
                onDelete={handleDeleteKalem}
                onAdd={handleAddKalem}
              />
            </div>
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  );
};
