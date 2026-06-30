import { LeadSource } from "api/generated";
import { ArrowLeft, Save, Target, TrendingUp, Wallet } from "lucide-react";
import { Button } from "components/ui/button";
import { getLeadSourceLabel } from "../constants";
import { type CrmModulFormValues } from "../formMappers";
import {
  calculateCrmDetailStats,
  formatCurrencyTotalsBlock,
  formatMoney,
  getCompanyInitials,
  type CrmSubItemFormValues,
} from "../utils";

type CrmDetailSummaryProps = {
  modulValues: CrmModulFormValues;
  subItems: CrmSubItemFormValues[];
  uniqNumber?: number;
  isEditMode: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
};

const StatCard = ({
  label,
  icon,
  children,
  subtext,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  subtext?: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm min-w-0">
    <div className="flex items-center gap-2 text-slate-500 mb-2">
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <div className="space-y-0.5">{children}</div>
    {subtext && <p className="text-[10px] text-slate-400 mt-1.5">{subtext}</p>}
  </div>
);

const CurrencyLines = ({ lines }: { lines: string[] }) => (
  <>
    {lines.map((line) => (
      <p key={line} className="text-base font-bold text-slate-800 tabular-nums leading-snug">
        {line}
      </p>
    ))}
  </>
);

export const CrmDetailSummary = ({
  modulValues,
  subItems,
  uniqNumber,
  isEditMode,
  canSave,
  onBack,
  onSave,
}: CrmDetailSummaryProps) => {
  const stats = calculateCrmDetailStats(subItems);
  const companyName = modulValues.partnerCompanyName.trim() || "Yeni Müşteri";
  const initials = getCompanyInitials(companyName);
  const leadLabel = getLeadSourceLabel(modulValues.leadSource);
  const recordId = uniqNumber ? `#${uniqNumber}` : isEditMode ? "" : "Yeni kayıt";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="size-14 rounded-xl bg-teal-800 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-lg font-bold text-white tracking-wide">{initials}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{companyName}</h1>
              <p className="text-sm text-slate-500 mt-1">
                Müşteri Kaydı
                {recordId && ` · ${recordId}`}
                {leadLabel !== "—" && ` · Lead kaynağı: ${leadLabel}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="gap-1.5 border-slate-300"
            >
              <ArrowLeft className="size-4" />
              Geri
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="gap-1.5 bg-teal-800 hover:bg-teal-900 text-white"
            >
              <Save className="size-4" />
              Kaydet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
          <StatCard
            label="Açık Fırsat"
            icon={<Target className="size-3.5 text-emerald-600" />}
          >
            <p className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats.openOpportunityCount}
            </p>
          </StatCard>

          <StatCard
            label="Toplam Pipeline"
            icon={<Wallet className="size-3.5 text-teal-700" />}
          >
            <CurrencyLines lines={formatCurrencyTotalsBlock(stats.pipeline)} />
          </StatCard>

          <StatCard
            label="Ağırlıklı Tahmin"
            icon={<TrendingUp className="size-3.5 text-amber-600" />}
            subtext="Aşama olasılığına göre"
          >
            <CurrencyLines lines={formatCurrencyTotalsBlock(stats.weightedForecast)} />
          </StatCard>

          <StatCard
            label="Kazanılan"
            icon={<TrendingUp className="size-3.5 text-emerald-600" />}
          >
            <CurrencyLines
              lines={[
                formatMoney(stats.won.try, "₺"),
                formatMoney(stats.won.usd, "$"),
                formatMoney(stats.won.eur, "€"),
              ]}
            />
          </StatCard>
        </div>
      </div>
    </div>
  );
};
