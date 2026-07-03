import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { getLeadSourceLabel } from "../constants";
import { type CrmModulFormValues, type CrmOpportunityFormValues } from "../formMappers";
import {
  convertCurrencyTotalsToEur,
  formatEurRounded,
  type TcmbExchangeRates,
} from "../tcmbExchangeRates";
import { calculateCrmDetailStatsFromOpportunities, getCompanyInitials } from "../utils";
import { CrmRecordAuditMeta } from "./CrmRecordAuditMeta";

type CrmDetailSummaryProps = {
  modulValues: CrmModulFormValues;
  opportunities: CrmOpportunityFormValues[];
  uniqNumber?: number;
  isEditMode: boolean;
  canSave: boolean;
  canAiRapor?: boolean;
  isAiRaporLoading?: boolean;
  updatedDate?: string | null;
  updatedBy?: string | null;
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
  onBack: () => void;
  onSave: () => void;
  onAiRapor?: () => void;
};

const PipelineEurTotal = ({
  opportunities,
  exchangeRates,
  exchangeRatesLoading,
}: {
  opportunities: CrmOpportunityFormValues[];
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
}) => {
  const stats = calculateCrmDetailStatsFromOpportunities(opportunities);

  if (exchangeRatesLoading) {
    return <span className="text-2xl font-bold text-slate-400">...</span>;
  }

  if (!exchangeRates) {
    return <span className="text-lg font-semibold text-amber-700">Kur yüklenemedi</span>;
  }

  const totalEur = convertCurrencyTotalsToEur(stats.pipeline, exchangeRates);

  return (
    <span className="text-3xl sm:text-4xl font-bold text-indigo-700 tabular-nums leading-none">
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
  updatedDate,
  updatedBy,
  exchangeRates,
  exchangeRatesLoading,
  onBack,
  onSave,
  onAiRapor,
}: CrmDetailSummaryProps) => {
  const companyName = modulValues.companyName.trim() || "Yeni Müşteri";
  const initials = getCompanyInitials(companyName);
  const leadLabel = getLeadSourceLabel(modulValues.leadSource);
  const recordId = uniqNumber ? `#${uniqNumber}` : isEditMode ? "" : "Yeni kayıt";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-amber-500" />

      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/30">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-800 font-medium text-xs"
                  >
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 p-4 bg-slate-50/40">
        <CrmRecordAuditMeta
          updatedDate={updatedDate}
          updatedBy={updatedBy}
          variant="banner"
        />

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 text-right min-w-[200px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/80 mb-2">
            Pipeline Toplamı
          </p>
          <PipelineEurTotal
            opportunities={opportunities}
            exchangeRates={exchangeRates}
            exchangeRatesLoading={exchangeRatesLoading}
          />
          <p className="text-[10px] text-indigo-600/70 mt-1.5 font-medium">TCMB kuru · EUR</p>
        </div>
      </div>
    </div>
  );
};
