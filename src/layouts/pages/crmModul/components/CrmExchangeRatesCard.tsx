import { DollarSign, Euro, Landmark } from "lucide-react";
import { cn } from "lib/utils";
import { formatTryRate, type TcmbExchangeRates } from "../tcmbExchangeRates";

export type CrmExchangeRatesCardProps = {
  rates: TcmbExchangeRates | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
  themed?: boolean;
};

export const CrmExchangeRatesCard = ({
  rates,
  loading,
  error,
  compact = false,
  themed = false,
}: CrmExchangeRatesCardProps) => {
  if (compact) {
    return (
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              themed ? "text-sky-800/70" : "text-slate-400"
            )}
          >
            Kurlar
          </span>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg shrink-0",
              themed ? "bg-sky-100" : "bg-slate-100"
            )}
          >
            <Landmark className={cn("size-4", themed ? "text-sky-600" : "text-blue-700")} aria-hidden />
          </span>
        </div>
        {loading && <p className="text-base font-medium text-sky-900/50">...</p>}
        {!loading && error && <p className="text-sm font-semibold text-amber-700 truncate">{error}</p>}
        {!loading && rates && (
          <div className="space-y-1">
            <p className="text-sm font-bold text-sky-950 tabular-nums leading-tight flex items-center gap-1.5">
              <Euro className="size-4 text-sky-600 shrink-0" aria-hidden />
              {formatTryRate(rates.eurTry)} ₺
            </p>
            <p className="text-sm font-bold text-sky-950 tabular-nums leading-tight flex items-center gap-1.5">
              <DollarSign className="size-4 text-sky-600 shrink-0" aria-hidden />
              {formatTryRate(rates.usdTry)} ₺
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm min-w-0">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Landmark className="size-3.5 text-blue-700" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">Güncel Kurlar</span>
      </div>

      {loading && <p className="text-sm text-slate-400">Kurlar yükleniyor...</p>}
      {!loading && error && <p className="text-sm text-amber-700">{error}</p>}
      {!loading && rates && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800 tabular-nums">
            <Euro className="size-3.5 inline mr-1 text-slate-500" aria-hidden="true" />
            1 Euro = {formatTryRate(rates.eurTry)} ₺
          </p>
          <p className="text-sm font-semibold text-slate-800 tabular-nums">
            <DollarSign className="size-3.5 inline mr-1 text-slate-500" aria-hidden="true" />
            1 USD = {formatTryRate(rates.usdTry)} ₺
          </p>
        </div>
      )}
    </div>
  );
};
