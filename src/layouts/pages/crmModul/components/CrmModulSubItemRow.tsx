import { CrmSubItemDto } from "api/generated";
import { Badge } from "components/ui/badge";
import { TableCell, TableRow } from "components/ui/table";
import { cn } from "lib/utils";
import {
  getCurrencySymbol,
  getOpportunityStageBadgeClass,
  getOpportunityStageLabel,
  getTypeCodeLabel,
} from "../constants";
import { formatDateTr, formatInlineList, formatMoney, formatSolutionModuleNames } from "../utils";

type CrmModulSubItemRowProps = {
  item: CrmSubItemDto;
  isLast: boolean;
};

const formatSubItemValue = (item: CrmSubItemDto): string => {
  const amount = item.estimatedDiscountedValue ?? item.estimatedValue;
  if (amount == null) return "—";
  return formatMoney(amount, getCurrencySymbol(item.currencyType));
};

export const CrmModulSubItemRow = ({ item, isLast }: CrmModulSubItemRowProps) => {
  const moduleNames = formatSolutionModuleNames(item.solutionModuleNames);
  const title = moduleNames !== "—" ? moduleNames : "Fırsat";
  const typeLabel = getTypeCodeLabel(item.typeCode);
  const stageLabel = getOpportunityStageLabel(item.opportunityStage);

  return (
    <TableRow
      className={cn(
        "border-b border-slate-100 bg-slate-50/60 hover:bg-indigo-50/20 transition-colors",
        isLast && "border-b-slate-200"
      )}
    >
      <TableCell className="px-2 py-2 w-10" aria-hidden="true" />
      <TableCell colSpan={13} className="px-4 py-2.5">
        <div className="flex items-start gap-3 pl-2">
          <div className="flex flex-col items-center shrink-0 pt-1.5" aria-hidden="true">
            <span className="w-px h-2 bg-slate-300" />
            <span className="size-2 rounded-full border-2 border-indigo-400 bg-white shrink-0" />
            {!isLast && <span className="w-px flex-1 min-h-4 bg-slate-300" />}
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-2 text-sm">
            <div className="min-w-0 lg:col-span-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Fırsat
              </p>
              <p className="text-slate-800 font-medium truncate" title={title}>
                {title}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Aşama
              </p>
              {stageLabel !== "—" ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-normal border-0",
                    getOpportunityStageBadgeClass(item.opportunityStage)
                  )}
                >
                  {stageLabel}
                </Badge>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Tip
              </p>
              <span className="text-slate-700">{typeLabel}</span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Kişi
              </p>
              <span className="text-slate-700 tabular-nums">
                {item.personCount != null && item.personCount > 0 ? item.personCount : "—"}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Değer
              </p>
              <span className="text-slate-800 font-semibold tabular-nums">
                {formatSubItemValue(item)}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Kapanış
              </p>
              <span className="text-slate-600">{formatDateTr(item.expectedCloseDate)}</span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                Son İletişim
              </p>
              <span className="text-slate-600">{formatDateTr(item.lastContactDate)}</span>
            </div>

            {item.discount != null && item.discount > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                  İndirim
                </p>
                <span className="text-red-600 font-medium tabular-nums">%{item.discount}</span>
              </div>
            )}

            {moduleNames !== "—" && (
              <div className="min-w-0 lg:col-span-2 xl:col-span-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                  Modüller
                </p>
                <span className="text-slate-600 line-clamp-2" title={moduleNames}>
                  {formatInlineList(item.solutionModuleNames ?? [])}
                </span>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};
