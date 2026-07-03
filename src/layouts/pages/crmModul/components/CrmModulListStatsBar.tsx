import {
  Building2,
  Clock,
  Layers,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";
import { cn } from "lib/utils";
import {
  convertCurrencyTotalsToEur,
  formatEurRounded,
  type TcmbExchangeRates,
} from "../tcmbExchangeRates";
import { formatCrmUpdatedBy, formatDateTimeTr, type CrmListPageStats } from "../utils";

type CrmModulListStatsBarProps = {
  stats: CrmListPageStats;
  isFiltered: boolean;
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
  onOpenCustomer?: (id: string) => void;
};

type StatTileProps = {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  subtext?: string;
  theme?: "indigo" | "emerald" | "amber" | "violet" | "sky" | "slate";
  className?: string;
  onClick?: () => void;
};

const THEME_STYLES = {
  indigo: "border-indigo-200/70 bg-indigo-50/40 text-indigo-950",
  emerald: "border-emerald-200/70 bg-emerald-50/40 text-emerald-950",
  amber: "border-amber-200/70 bg-amber-50/40 text-amber-950",
  violet: "border-violet-200/70 bg-violet-50/40 text-violet-950",
  sky: "border-sky-200/70 bg-sky-50/40 text-sky-950",
  slate: "border-slate-200/70 bg-slate-50/50 text-slate-950",
};

const ICON_THEME = {
  indigo: "text-indigo-600",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  violet: "text-violet-600",
  sky: "text-sky-600",
  slate: "text-slate-500",
};

const StatTile = ({
  label,
  icon,
  children,
  subtext,
  theme = "slate",
  className,
  onClick,
}: StatTileProps) => {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-2 text-left min-w-0",
        THEME_STYLES[theme],
        onClick && "hover:ring-1 hover:ring-indigo-200 transition-all cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className={cn("shrink-0", ICON_THEME[theme])}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide opacity-70 truncate">
          {label}
        </span>
      </div>
      <div className="text-base font-bold tabular-nums leading-tight truncate">{children}</div>
      {subtext && (
        <p className="text-[9px] mt-0.5 font-medium opacity-60 line-clamp-1 leading-snug">
          {subtext}
        </p>
      )}
    </Wrapper>
  );
};

const EurValue = ({
  totals,
  exchangeRates,
  exchangeRatesLoading,
}: {
  totals: { try: number; usd: number; eur: number };
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
}) => {
  if (exchangeRatesLoading) return <span className="text-sm opacity-60">...</span>;
  if (!exchangeRates) return <span className="text-[11px] font-semibold text-amber-700">Kur yok</span>;
  return (
    <span className="text-base font-bold tabular-nums leading-tight">
      {formatEurRounded(convertCurrencyTotalsToEur(totals, exchangeRates))}
    </span>
  );
};

export const CrmModulListStatsBar = ({
  stats,
  isFiltered,
  exchangeRates,
  exchangeRatesLoading,
  onOpenCustomer,
}: CrmModulListStatsBarProps) => {
  const customerLabel =
    isFiltered && stats.filteredCustomerCount !== stats.totalCustomerCount
      ? `${stats.filteredCustomerCount}/${stats.totalCustomerCount}`
      : String(stats.filteredCustomerCount);

  const lastUpdated = stats.lastUpdated;
  const canOpenLast = Boolean(lastUpdated?.id && onOpenCustomer);

  return (
    <div className="border-b border-slate-100 bg-slate-50/40 px-4 py-2 sm:px-6 shrink-0">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatTile
          label="Müşteri"
          theme="indigo"
          icon={<Building2 className="size-3" />}
          subtext={isFiltered ? "Filtre / toplam" : "Kayıtlı"}
        >
          {customerLabel}
        </StatTile>

        <StatTile
          label="Son Güncellenen"
          theme="violet"
          icon={<Clock className="size-3" />}
          className="col-span-2 sm:col-span-2 lg:col-span-2"
          subtext={
            lastUpdated
              ? `${formatDateTimeTr(lastUpdated.updatedDate)}${formatCrmUpdatedBy(lastUpdated.updatedBy) !== "—" ? ` · ${formatCrmUpdatedBy(lastUpdated.updatedBy)}` : ""}`
              : "—"
          }
          onClick={canOpenLast ? () => onOpenCustomer!(lastUpdated!.id!) : undefined}
        >
          <span className="text-sm font-bold leading-tight">
            {lastUpdated?.companyName ?? "—"}
          </span>
        </StatTile>

        <StatTile
          label="Fırsat Paketi"
          theme="sky"
          icon={<Layers className="size-3" />}
        >
          {stats.opportunityPackageCount}
        </StatTile>

        <StatTile
          label="Açık Fırsat"
          theme="emerald"
          icon={<Target className="size-3" />}
        >
          {stats.openPackageCount}
        </StatTile>

        <StatTile
          label="Kazanılan"
          theme="amber"
          icon={<Trophy className="size-3" />}
          subtext={`${stats.wonPackageCount} paket`}
        >
          <EurValue
            totals={stats.won}
            exchangeRates={exchangeRates}
            exchangeRatesLoading={exchangeRatesLoading}
          />
        </StatTile>

        <StatTile
          label="Pipeline"
          theme="indigo"
          icon={<Wallet className="size-3" />}
          subtext="EUR · açık"
        >
          <EurValue
            totals={stats.pipeline}
            exchangeRates={exchangeRates}
            exchangeRatesLoading={exchangeRatesLoading}
          />
        </StatTile>
      </div>
    </div>
  );
};
