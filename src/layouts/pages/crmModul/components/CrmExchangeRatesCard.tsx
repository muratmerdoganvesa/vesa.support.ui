import { DollarSign, Euro, Landmark } from "lucide-react";
import { formatTryRate, type TcmbExchangeRates } from "../tcmbExchangeRates";

type CrmExchangeRatesCardProps = {
  rates: TcmbExchangeRates | null;
  loading: boolean;
  error: string | null;
};

const RateRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
      {icon}
    </span>
    <p className="text-sm font-semibold text-slate-800 tabular-nums truncate">
      <span className="text-slate-500 font-medium">{label}</span> {value}
    </p>
  </div>
);

export const CrmExchangeRatesCard = ({ rates, loading, error }: CrmExchangeRatesCardProps) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm min-w-0">
    <div className="flex items-center gap-2 text-slate-500 mb-2">
      <Landmark className="size-3.5 text-blue-700" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wide">Güncel Kurlar</span>
    </div>

    {loading && <p className="text-sm text-slate-400">Kurlar yükleniyor...</p>}

    {!loading && error && <p className="text-sm text-amber-700">{error}</p>}

    {!loading && rates && (
      <div className="space-y-1.5">
        <RateRow
          icon={<Euro className="size-3.5" aria-hidden="true" />}
          label="1 Euro ="
          value={`${formatTryRate(rates.eurTry)} ₺`}
        />
        <RateRow
          icon={<DollarSign className="size-3.5" aria-hidden="true" />}
          label="1 USD ="
          value={`${formatTryRate(rates.usdTry)} ₺`}
        />
      </div>
    )}
  </div>
);
