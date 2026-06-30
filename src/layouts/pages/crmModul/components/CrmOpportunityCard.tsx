import { ListModuleDto } from "api/generated";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "components/ui/collapsible";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronRight, Trash2 } from "lucide-react";
import { cn } from "lib/utils";
import {
  getCurrencySymbol,
  getOpportunityStageBadgeClass,
  getOpportunityStageLabel,
  getOpportunityStageProbability,
} from "../constants";
import {
  calculateEstimatedValueString,
  formatEstimatedValueDisplay,
  type CrmSubItemFormValues,
} from "../formMappers";
import { getOpportunityTitle } from "../utils";
import { CrmPipelineStageBar } from "./CrmPipelineStageBar";
import { CrmSubItemFormFields } from "./CrmSubItemFormFields";

type CrmOpportunityCardProps = {
  item: CrmSubItemFormValues;
  modules: ListModuleDto[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (values: CrmSubItemFormValues) => void;
  onDelete: () => void;
};

export const CrmOpportunityCard = ({
  item,
  modules,
  isOpen,
  onOpenChange,
  onChange,
  onDelete,
}: CrmOpportunityCardProps) => {
  const title = getOpportunityTitle(item, modules);
  const kalemCount = item.solutionModuleIds.length;
  const estimated = calculateEstimatedValueString(item.unitPrice, item.personCount);
  const symbol = getCurrencySymbol(item.currencyType);
  const probability = getOpportunityStageProbability(item.opportunityStage);
  const closeLabel = item.expectedCloseDate
    ? format(item.expectedCloseDate, "dd.MM.yyyy", { locale: tr })
    : "—";

  const metaParts = [
    kalemCount > 0 ? `${kalemCount} kalem` : "Modül seçilmedi",
    `Kapanış: ${closeLabel}`,
    `%${probability} olasılık`,
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <article className="bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
            aria-expanded={isOpen}
            aria-label={`${title} fırsat detayını ${isOpen ? "kapat" : "aç"}`}
          >
            <ChevronRight
              className={cn(
                "size-4 text-slate-400 shrink-0 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-slate-900 truncate leading-snug">{title}</p>
              <p className="text-sm text-slate-500 mt-1 truncate">{metaParts.join(" · ")}</p>
            </div>
            <Badge
              className={cn(
                "shrink-0 h-8 px-3.5 text-sm font-semibold rounded-full border-0 shadow-none",
                getOpportunityStageBadgeClass(item.opportunityStage)
              )}
            >
              {getOpportunityStageLabel(item.opportunityStage)}
            </Badge>
            <span className="text-xl font-bold text-slate-950 tabular-nums shrink-0 min-w-[140px] text-right tracking-tight">
              {formatEstimatedValueDisplay(estimated, symbol)}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100 px-5 py-5 space-y-6 bg-slate-50/30">
            <CrmPipelineStageBar
              currentStage={item.opportunityStage}
              onStageChange={(stage) => onChange({ ...item, opportunityStage: stage })}
            />

            <CrmSubItemFormFields values={item} modules={modules} onChange={onChange} />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Fırsat Değeri:{" "}
                <span className="font-semibold text-emerald-700 tabular-nums">
                  {formatEstimatedValueDisplay(estimated, symbol)}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="size-4" />
                Fırsatı Sil
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  );
};
