import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { getLeadSourceLabel } from "../constants";
import { type CrmModulFormValues } from "../formMappers";
import { getCompanyInitials } from "../utils";
import { CrmRecordAuditMeta } from "./CrmRecordAuditMeta";

type CrmDetailSummaryProps = {
  modulValues: CrmModulFormValues;
  uniqNumber?: number;
  isEditMode: boolean;
  canSave: boolean;
  canAiRapor?: boolean;
  isAiRaporLoading?: boolean;
  isSaving?: boolean;
  updatedDate?: string | null;
  updatedBy?: string | null;
  onBack: () => void;
  onSave: () => void;
  onAiRapor?: () => void;
};

export const CrmDetailSummary = ({
  modulValues,
  uniqNumber,
  isEditMode,
  canSave,
  canAiRapor = false,
  isAiRaporLoading = false,
  isSaving = false,
  updatedDate,
  updatedBy,
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

      <div className="px-5 py-4 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/30">
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
              <CrmRecordAuditMeta
                updatedDate={updatedDate}
                updatedBy={updatedBy}
                variant="compact"
                className="mt-1 text-[11px] text-slate-400"
              />
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
              disabled={!canSave || isSaving}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-sm font-bold px-6 shadow-md shadow-indigo-200"
            >
              <Save className="size-4" />
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
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
    </div>
  );
};
