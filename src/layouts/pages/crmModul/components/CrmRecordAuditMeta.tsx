import { Clock, UserRound } from "lucide-react";
import { cn } from "lib/utils";
import { formatCrmUpdatedBy, formatDateTimeTr } from "../utils";

type CrmRecordAuditMetaProps = {
  updatedDate?: string | null;
  updatedBy?: string | null;
  variant?: "banner" | "inline" | "compact";
  className?: string;
};

export const CrmRecordAuditMeta = ({
  updatedDate,
  updatedBy,
  variant = "banner",
  className,
}: CrmRecordAuditMetaProps) => {
  const dateLabel = formatDateTimeTr(updatedDate);
  const byLabel = formatCrmUpdatedBy(updatedBy);
  const hasAudit = dateLabel !== "—" || byLabel !== "—";

  if (!hasAudit && variant !== "banner") {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className={cn("text-xs text-slate-500", className)}>
        <span className="font-medium text-slate-600">Son güncelleme:</span>{" "}
        {dateLabel}
        {byLabel !== "—" && (
          <>
            {" "}
            · <span className="font-medium text-slate-600">{byLabel}</span>
          </>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600", className)}>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{dateLabel}</span>
        </span>
        {byLabel !== "—" && (
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{byLabel}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3 sm:px-5 sm:py-4",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
        Son Güncelleme
      </p>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums leading-none">
          {dateLabel}
        </p>
        {byLabel !== "—" && (
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Güncelleyen
            </p>
            <p className="text-lg sm:text-xl font-bold text-indigo-700 leading-tight mt-0.5">
              {byLabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
