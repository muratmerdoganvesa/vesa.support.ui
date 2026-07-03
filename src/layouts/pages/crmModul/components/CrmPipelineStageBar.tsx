import { OpportunityStage } from "api/generated";
import { Check } from "lucide-react";
import { cn } from "lib/utils";
import {
  getOpportunityStageLabel,
  getOpportunityStageProbability,
  PIPELINE_STAGE_FLOW,
} from "../constants";

type CrmPipelineStageBarProps = {
  currentStage: OpportunityStage;
  onStageChange: (stage: OpportunityStage) => void;
  variant?: "stepper" | "pills";
};

export const CrmPipelineStageBar = ({
  currentStage,
  onStageChange,
  variant = "pills",
}: CrmPipelineStageBarProps) => {
  const currentIndex = PIPELINE_STAGE_FLOW.indexOf(currentStage);
  const probability = getOpportunityStageProbability(currentStage);

  if (variant === "pills") {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 shrink-0 hidden sm:inline">
          Aşama
        </span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin min-w-0 flex-1">
          {PIPELINE_STAGE_FLOW.map((stage, index) => {
            const isCompleted = currentIndex > index;
            const isCurrent = currentStage === stage;
            const label = getOpportunityStageLabel(stage);

            return (
              <button
                key={stage}
                type="button"
                onClick={() => onStageChange(stage)}
                className={cn(
                  "inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors",
                  isCurrent && "bg-amber-500 text-white shadow-sm",
                  isCompleted && !isCurrent && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  !isCurrent && !isCompleted && "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
                )}
                aria-current={isCurrent ? "step" : undefined}
                title={label}
              >
                {isCompleted && !isCurrent && <Check className="size-3 shrink-0" strokeWidth={2.5} />}
                {label}
              </button>
            );
          })}
        </div>
        {probability > 0 && (
          <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0 hidden md:inline">
            %{probability}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Pipeline Durumu
        </p>
        {probability > 0 && (
          <span className="text-[11px] font-medium text-slate-500 tabular-nums">
            %{probability} olasılık
          </span>
        )}
      </div>

      <div className="relative">
        <div
          className="absolute top-[14px] left-[14px] right-[14px] h-[2px] bg-slate-200 rounded-full"
          aria-hidden
        />
        {currentIndex >= 0 && (
          <div
            className="absolute top-[14px] left-[14px] h-[2px] bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `calc(${(currentIndex / (PIPELINE_STAGE_FLOW.length - 1)) * 100}% - 28px * ${currentIndex / (PIPELINE_STAGE_FLOW.length - 1)})`,
              maxWidth: "calc(100% - 28px)",
            }}
            aria-hidden
          />
        )}

        <div className="relative flex items-start justify-between gap-0.5">
          {PIPELINE_STAGE_FLOW.map((stage, index) => {
            const isCompleted = currentIndex > index;
            const isCurrent = currentStage === stage;
            const isUpcoming = currentIndex < index;

            return (
              <button
                key={stage}
                type="button"
                onClick={() => onStageChange(stage)}
                className="group relative z-10 flex flex-1 flex-col items-center gap-1 min-w-0"
                aria-label={`${getOpportunityStageLabel(stage)} aşamasına geç`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 transition-all duration-300 size-7",
                    isCompleted &&
                      "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200",
                    isCurrent &&
                      "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-100",
                    isUpcoming &&
                      "border-slate-200 bg-white text-slate-300 group-hover:border-slate-300 group-hover:text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3" strokeWidth={2.5} />
                  ) : (
                    <span
                      className={cn(
                        "rounded-full bg-current size-1.5",
                        isCurrent && "bg-white"
                      )}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[9px] text-center leading-tight px-0.5 max-w-full truncate w-full",
                    isCurrent
                      ? "font-bold text-amber-700"
                      : isCompleted
                        ? "font-medium text-emerald-700"
                        : "text-slate-400 group-hover:text-slate-500"
                  )}
                >
                  {getOpportunityStageLabel(stage)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
