import { ListModuleDto } from "api/generated";
import { Button } from "components/ui/button";
import { Briefcase, Plus, Sparkles } from "lucide-react";
import {
  emptyCrmOpportunityFormValues,
  type CrmOpportunityFormValues,
} from "../formMappers";
import type { TcmbExchangeRates } from "../tcmbExchangeRates";
import { CrmOpportunityCard } from "./CrmOpportunityCard";

type CrmOpportunityListProps = {
  opportunities: CrmOpportunityFormValues[];
  modules: ListModuleDto[];
  expandedKey: string | null;
  exchangeRates: TcmbExchangeRates | null;
  onExpandedKeyChange: (key: string | null) => void;
  onChange: (opportunity: CrmOpportunityFormValues, options?: { autoSave?: boolean }) => void;
  onDelete: (clientKey: string) => void;
  onAdd: () => void;
};

export const CrmOpportunityList = ({
  opportunities,
  modules,
  expandedKey,
  exchangeRates,
  onExpandedKeyChange,
  onChange,
  onDelete,
  onAdd,
}: CrmOpportunityListProps) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-indigo-50/30">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 shrink-0">
          <Briefcase className="size-4 text-indigo-600" strokeWidth={1.75} />
        </span>
        <h2 className="text-base font-bold text-slate-900">Fırsat Paketleri</h2>
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md bg-indigo-600 text-xs font-bold text-white tabular-nums">
          {opportunities.length}
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onAdd}
        className="gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 shadow-sm shadow-indigo-200"
      >
        <Plus className="size-4" />
        Fırsat Ekle
      </Button>
    </div>

    <div className={opportunities.length === 0 ? "p-4" : "p-1.5 space-y-1"}>
      {opportunities.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent opacity-60" />
          <div className="relative">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Sparkles className="size-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Henüz fırsat paketi eklenmedi</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Bir fırsat paketi oluşturun, içine modül kalemleri ekleyin. Pipeline durumu tüm paket için ortaktır.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={onAdd}
              className="mt-5 gap-2 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="size-4" />
              İlk Fırsatı Oluştur
            </Button>
          </div>
        </div>
      ) : (
        opportunities.map((opportunity, index) => (
          <CrmOpportunityCard
            key={opportunity.clientKey}
            opportunity={opportunity}
            index={index}
            modules={modules}
            isOpen={expandedKey === opportunity.clientKey}
            exchangeRates={exchangeRates}
            onOpenChange={(open) =>
              onExpandedKeyChange(open ? opportunity.clientKey : null)
            }
            onChange={onChange}
            onDelete={() => onDelete(opportunity.clientKey)}
          />
        ))
      )}
    </div>
  </section>
);

export const createNewOpportunity = (): CrmOpportunityFormValues =>
  emptyCrmOpportunityFormValues();

/** @deprecated createNewOpportunity kullanın */
export const createNewOpportunityItem = (): CrmOpportunityFormValues =>
  createNewOpportunity();
