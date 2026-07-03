import { Building2 } from "lucide-react";
import { cn } from "lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { type CrmKanbanScope } from "../constants";
import type { CrmKanbanOpportunity } from "../utils";
import { CrmOpportunityKanbanBoard } from "./CrmOpportunityKanbanBoard";

type CrmModulKanbanViewProps = {
  opportunities: CrmKanbanOpportunity[];
  scope: CrmKanbanScope;
  selectedCustomerId: string | null;
  customerOptions: { id: string; name: string }[];
  onScopeChange: (scope: CrmKanbanScope) => void;
  onCustomerChange: (customerId: string | null) => void;
  onOpenOpportunity: (crmModulId: string) => void;
};

export const CrmModulKanbanView = ({
  opportunities,
  scope,
  selectedCustomerId,
  customerOptions,
  onScopeChange,
  onCustomerChange,
  onOpenOpportunity,
}: CrmModulKanbanViewProps) => {
  const visibleOpportunities =
    scope === "customer" && selectedCustomerId
      ? opportunities.filter((o) => o.crmModulId === selectedCustomerId)
      : opportunities;

  return (
    <div className="border-t border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-slate-50/60 border-b border-slate-100">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
          <button
            type="button"
            onClick={() => onScopeChange("all")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium transition-colors",
              scope === "all" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Tüm Şirket
          </button>
          <button
            type="button"
            onClick={() => onScopeChange("customer")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium transition-colors",
              scope === "customer" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Müşteri Bazlı
          </button>
        </div>

        {scope === "customer" && (
          <div className="flex items-center gap-2 min-w-[220px]">
            <Building2 className="size-4 text-slate-400 shrink-0" />
            <Select
              value={selectedCustomerId ?? "__none__"}
              onValueChange={(v) => onCustomerChange(v === "__none__" ? null : v)}
            >
              <SelectTrigger className="h-9 bg-white text-sm">
                <SelectValue placeholder="Müşteri seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Müşteri seçin...</SelectItem>
                {customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <p className="text-sm text-slate-500 sm:ml-auto">
          <span className="font-semibold text-slate-800">{visibleOpportunities.length}</span> fırsat
          paketi
        </p>
      </div>

      {scope === "customer" && !selectedCustomerId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Building2 className="size-8 text-slate-300 mb-3" />
          <p className="text-base font-medium text-slate-600">Müşteri seçin</p>
          <p className="text-sm text-slate-400 mt-1">
            Müşteri bazlı pipeline için yukarıdan bir kayıt seçin
          </p>
        </div>
      ) : (
        <div className="p-4">
          <CrmOpportunityKanbanBoard
            opportunities={visibleOpportunities}
            showCompany={scope === "all"}
            onOpenCard={(card) => onOpenOpportunity(card.crmModulId)}
          />
        </div>
      )}
    </div>
  );
};
