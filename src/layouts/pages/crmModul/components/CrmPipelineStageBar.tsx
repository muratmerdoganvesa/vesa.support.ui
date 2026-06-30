import { OpportunityStage } from "api/generated";
import { Check } from "lucide-react";
import { cn } from "lib/utils";
import {
  getOpportunityStageLabel,
  PIPELINE_STAGE_FLOW,
} from "../constants";

type CrmPipelineStageBarProps = {
  currentStage: OpportunityStage;
  onStageChange: (stage: OpportunityStage) => void;
};

export const CrmPipelineStageBar = ({
  currentStage,
  onStageChange,
}: CrmPipelineStageBarProps) => {
  const currentIndex = PIPELINE_STAGE_FLOW.indexOf(currentStage);

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Bu Fırsatın Pipeline Aşaması
      </p>
      <div className="relative flex items-start justify-between gap-1">
        <div
          className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200"
          aria-hidden
        />
        {PIPELINE_STAGE_FLOW.map((stage, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentStage === stage;
          const isUpcoming = currentIndex < index;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => onStageChange(stage)}
              className="relative z-10 flex flex-1 flex-col items-center gap-2 min-w-0 group"
              aria-label={`${getOpportunityStageLabel(stage)} aşamasına geç`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                  isCurrent && "border-amber-500 bg-amber-500 text-white scale-110",
                  isUpcoming && "border-slate-300 bg-white text-slate-400 group-hover:border-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-xs text-center leading-tight px-0.5",
                  isCurrent ? "font-semibold text-amber-700" : "text-slate-500"
                )}
              >
                {getOpportunityStageLabel(stage)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
