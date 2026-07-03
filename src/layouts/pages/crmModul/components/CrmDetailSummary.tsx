import { ArrowLeft, Save, Sparkles, Target, TrendingUp, Trophy, Wallet } from "lucide-react";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { cn } from "lib/utils";
import { getLeadSourceLabel } from "../constants";
import { type CrmModulFormValues, type CrmOpportunityFormValues } from "../formMappers";
import {
  convertCurrencyTotalsToEur,
  formatEurRounded,
  type TcmbExchangeRates,
} from "../tcmbExchangeRates";
import {
  calculateCrmDetailStatsFromOpportunities,
  getCompanyInitials,
} from "../utils";
import { CrmExchangeRatesCard } from "./CrmExchangeRatesCard";

type CrmDetailSummaryProps = {
  modulValues: CrmModulFormValues;
  opportunities: CrmOpportunityFormValues[];
  uniqNumber?: number;
  isEditMode: boolean;
  canSave: boolean;
  canAiRapor?: boolean;
  isAiRaporLoading?: boolean;
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
  exchangeRatesError: string | null;
  onBack: () => void;
  onSave: () => void;
  onAiRapor?: () => void;
};

type StatTheme = "emerald" | "sky" | "indigo" | "amber" | "teal";

const STAT_THEME_STYLES: Record<
  StatTheme,
  { card: string; accent: string; iconWrap: string; icon: string; label: string; value: string }
> = {
  emerald: {
    card: "bg-emerald-50/80 border-emerald-200/80",
    accent: "bg-emerald-500",
    iconWrap: "bg-emerald-100",
    icon: "text-emerald-600",
    label: "text-emerald-800/70",
    value: "text-emerald-950",
  },
  sky: {
    card: "bg-sky-50/80 border-sky-200/80",
    accent: "bg-sky-500",
    iconWrap: "bg-sky-100",
    icon: "text-sky-600",
    label: "text-sky-800/70",
    value: "text-sky-950",
  },
  indigo: {
    card: "bg-indigo-50/80 border-indigo-200/80",
    accent: "bg-indigo-500",
    iconWrap: "bg-indigo-100",
    icon: "text-indigo-600",
    label: "text-indigo-800/70",
    value: "text-indigo-950",
  },
  amber: {
    card: "bg-amber-50/80 border-amber-200/80",
    accent: "bg-amber-500",
    iconWrap: "bg-amber-100",
    icon: "text-amber-600",
    label: "text-amber-800/70",
    value: "text-amber-950",
  },
  teal: {
    card: "bg-teal-50/80 border-teal-200/80",
    accent: "bg-teal-500",
    iconWrap: "bg-teal-100",
    icon: "text-teal-600",
    label: "text-teal-800/70",
    value: "text-teal-950",
  },
};

const StatCard = ({
  label,
  icon,
  children,
  subtext,
  theme,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  subtext?: string;
  theme: StatTheme;
}) => {
  const t = STAT_THEME_STYLES[theme];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-3.5 py-3 min-w-0 shadow-sm",
        t.card
      )}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-1", t.accent)} />
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", t.label)}>
          {label}
        </span>
        <span className={cn("flex size-8 items-center justify-center rounded-lg shrink-0", t.iconWrap)}>
          <span className={t.icon}>{icon}</span>
        </span>
      </div>
      <div className={cn("text-2xl font-bold tabular-nums leading-none", t.value)}>{children}</div>
      {subtext && <p className={cn("text-[10px] mt-1.5 font-medium", t.label)}>{subtext}</p>}
    </div>
  );
};

const EurTotalValue = ({
  totals,
  exchangeRates,
  exchangeRatesLoading,
  valueClassName,
}: {
  totals: { try: number; usd: number; eur: number };
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
  valueClassName?: string;
}) => {
  if (exchangeRatesLoading) {
    return <span className="text-base font-medium opacity-60">...</span>;
  }

  if (!exchangeRates) {
    return <span className="text-sm font-semibold text-amber-700">Kur gerekli</span>;
  }

  const totalEur = convertCurrencyTotalsToEur(totals, exchangeRates);

  return (
    <span className={cn("text-2xl font-bold tabular-nums leading-none", valueClassName)}>
      {formatEurRounded(totalEur)}
    </span>
  );
};

export const CrmDetailSummary = ({
  modulValues,
  opportunities,
  uniqNumber,
  isEditMode,
  canSave,
  canAiRapor = false,
  isAiRaporLoading = false,
  exchangeRates,
  exchangeRatesLoading,
  exchangeRatesError,
  onBack,
  onSave,
  onAiRapor,
}: CrmDetailSummaryProps) => {
  const stats = calculateCrmDetailStatsFromOpportunities(opportunities);
  const companyName = modulValues.companyName.trim() || "Yeni Müşteri";
  const initials = getCompanyInitials(companyName);
  const leadLabel = getLeadSourceLabel(modulValues.leadSource);
  const recordId = uniqNumber ? `#${uniqNumber}` : isEditMode ? "" : "Yeni kayıt";
  const skyTheme = STAT_THEME_STYLES.sky;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-amber-500" />

      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
              <span className="text-lg font-bold text-white tracking-wide">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 truncate">{companyName}</h1>
                {recordId && (
                  <Badge className="bg-indigo-100 text-indigo-800 border-0 font-semibold text-xs px-2">
                    {recordId}
                  </Badge>
                )}
                {leadLabel !== "—" && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 font-medium text-xs">
                    {leadLabel}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">Müşteri Kaydı · CRM Detay</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="gap-2 border-slate-300 bg-white h-10 text-sm px-4 font-medium hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" />
              Geri
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-sm font-bold px-6 shadow-md shadow-indigo-200"
            >
              <Save className="size-4" />
              Kaydet
            </Button>
            {onAiRapor && (
              <Button
                type="button"
                onClick={onAiRapor}
                disabled={!canAiRapor || isAiRaporLoading}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white h-10 text-sm font-semibold px-4 shadow-md shadow-violet-200"
                aria-label="AI raporu al"
              >
                <Sparkles className="size-4" />
                {isAiRaporLoading ? "Hazırlanıyor..." : "AI Rapor"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-4 bg-slate-50/40">
        <StatCard
          label="Açık Fırsat"
          theme="emerald"
          icon={<Target className="size-4" />}
        >
          {stats.openOpportunityCount}
        </StatCard>

        <div
          className={cn(
            "relative overflow-hidden rounded-xl border px-3.5 py-3 min-w-0 shadow-sm col-span-2 sm:col-span-1",
            skyTheme.card
          )}
        >
          <div className={cn("absolute top-0 left-0 right-0 h-1", skyTheme.accent)} />
          <CrmExchangeRatesCard
            rates={exchangeRates}
            loading={exchangeRatesLoading}
            error={exchangeRatesError}
            compact
            themed
          />
        </div>

        <StatCard label="Pipeline" theme="indigo" icon={<Wallet className="size-4" />}>
          <EurTotalValue
            totals={stats.pipeline}
            exchangeRates={exchangeRates}
            exchangeRatesLoading={exchangeRatesLoading}
          />
        </StatCard>

        <StatCard
          label="Tahmin"
          theme="amber"
          icon={<TrendingUp className="size-4" />}
          subtext="Aşama olasılığı"
        >
          <EurTotalValue
            totals={stats.weightedForecast}
            exchangeRates={exchangeRates}
            exchangeRatesLoading={exchangeRatesLoading}
          />
        </StatCard>

        <StatCard label="Kazanılan" theme="teal" icon={<Trophy className="size-4" />}>
          <EurTotalValue
            totals={stats.won}
            exchangeRates={exchangeRates}
            exchangeRatesLoading={exchangeRatesLoading}
          />
        </StatCard>
      </div>
    </div>
  );
};
