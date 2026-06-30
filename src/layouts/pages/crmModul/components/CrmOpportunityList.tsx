import { ListModuleDto } from "api/generated";
import { Button } from "components/ui/button";
import { Plus } from "lucide-react";
import { emptyCrmSubItemFormValues, type CrmSubItemFormValues } from "../formMappers";
import { CrmOpportunityCard } from "./CrmOpportunityCard";

type CrmOpportunityListProps = {
  items: CrmSubItemFormValues[];
  modules: ListModuleDto[];
  expandedKey: string | null;
  onExpandedKeyChange: (key: string | null) => void;
  onChange: (values: CrmSubItemFormValues) => void;
  onDelete: (clientKey: string) => void;
  onAdd: () => void;
};

export const CrmOpportunityList = ({
  items,
  modules,
  expandedKey,
  onExpandedKeyChange,
  onChange,
  onDelete,
  onAdd,
}: CrmOpportunityListProps) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Fırsatlar
        </h2>
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {items.length}
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onAdd}
        className="gap-1.5 bg-teal-800 hover:bg-teal-900 text-white"
      >
        <Plus className="size-4" />
        Fırsat Ekle
      </Button>
    </div>

    <div className="p-4 space-y-3">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center">
          <p className="text-sm text-slate-500">Henüz fırsat eklenmedi.</p>
          <p className="text-xs text-slate-400 mt-1">
            Modül, fiyat ve pipeline bilgileri için fırsat ekleyin.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={onAdd}
            className="mt-4 gap-1.5 bg-teal-800 hover:bg-teal-900 text-white"
          >
            <Plus className="size-4" />
            İlk Fırsatı Ekle
          </Button>
        </div>
      ) : (
        items.map((item) => (
          <CrmOpportunityCard
            key={item.clientKey}
            item={item}
            modules={modules}
            isOpen={expandedKey === item.clientKey}
            onOpenChange={(open) => onExpandedKeyChange(open ? item.clientKey : null)}
            onChange={onChange}
            onDelete={() => onDelete(item.clientKey)}
          />
        ))
      )}
    </div>
  </section>
);

export const createNewOpportunityItem = (): CrmSubItemFormValues => emptyCrmSubItemFormValues();
