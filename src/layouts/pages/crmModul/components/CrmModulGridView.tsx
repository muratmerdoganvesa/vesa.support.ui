import { CrmModulDto } from "api/generated";
import { Badge } from "components/ui/badge";
import {
  Building2,
  Handshake,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { cn } from "lib/utils";
import { getLeadSourceLabel } from "../constants";
import {
  aggregateCrmModulSubItems,
  formatCrmUpdatedBy,
  formatDateTimeTr,
  formatInlineList,
  formatPhoneNumberTr,
  getCompanyInitials,
  resolveCompanyName,
  resolvePartnerCompanyName,
} from "../utils";
import { CrmModulListEmpty } from "./CrmModulListEmpty";
import { CrmModulListPagination } from "./CrmModulListPagination";
import { CrmModulRowActions } from "./CrmModulRowActions";

type CrmModulGridViewProps = {
  rows: CrmModulDto[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
  onEdit: (row: CrmModulDto) => void;
};

const stringToGradient = (value: string): string => {
  const palette = [
    "from-indigo-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-red-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
    "from-pink-500 to-fuchsia-600",
  ];
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const CrmModulCard = ({
  row,
  onEdit,
}: {
  row: CrmModulDto;
  onEdit: () => void;
}) => {
  const aggregates = aggregateCrmModulSubItems(row);
  const companyName = resolveCompanyName(row);
  const subItems = row.crmSubItems ?? [];
  const stageListText = formatInlineList(aggregates.uniqueOpportunityStageLabels);
  const moduleListText = formatInlineList(aggregates.uniqueModuleNames);
  const typeListText = formatInlineList(aggregates.uniqueTypeLabels);
  const gradient = stringToGradient(companyName);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
      )}
    >
      <div className={cn("relative bg-gradient-to-br px-4 py-4 text-white", gradient)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur-sm">
              {getCompanyInitials(companyName)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight" title={companyName}>
                {companyName}
              </h3>
              <p className="mt-0.5 truncate text-xs text-white/80">
                {resolvePartnerCompanyName(row)}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-0.5 backdrop-blur-sm">
            <CrmModulRowActions onEdit={onEdit} size="sm" variant="light" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className="border-0 bg-white/20 text-white hover:bg-white/20">
            {getLeadSourceLabel(row.leadSource)}
          </Badge>
          {subItems.length > 0 && (
            <Badge className="border-0 bg-white/20 text-white hover:bg-white/20">
              {subItems.length} fırsat
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {row.contactPerson && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <UserRound className="size-4 shrink-0 text-slate-400" />
            <span className="truncate">
              {row.contactPerson}
              {row.contactTitle ? (
                <span className="text-slate-500"> · {row.contactTitle}</span>
              ) : null}
            </span>
          </div>
        )}

        {row.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="size-4 shrink-0 text-slate-400" />
            <span className="font-mono text-xs tracking-wide">
              {formatPhoneNumberTr(row.phoneNumber)}
            </span>
          </div>
        )}

        {row.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="size-4 shrink-0 text-slate-400" />
            <span className="truncate" title={row.email}>
              {row.email}
            </span>
          </div>
        )}

        {row.accountManager && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="size-4 shrink-0 text-slate-400" />
            <span className="truncate">{row.accountManager}</span>
          </div>
        )}

        <div className="mt-auto space-y-3 border-t border-slate-100 pt-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Son Güncelleme
            </p>
            <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">
              {formatDateTimeTr(row.updatedDate)}
            </p>
            {formatCrmUpdatedBy(row.updatedBy) !== "—" && (
              <p className="text-sm font-semibold text-indigo-700 mt-1">
                {formatCrmUpdatedBy(row.updatedBy)}
              </p>
            )}
          </div>

          {stageListText !== "—" && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Aşama
              </p>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                {stageListText}
              </Badge>
            </div>
          )}

          {moduleListText !== "—" && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Modüller
              </p>
              <p className="line-clamp-2 text-xs text-slate-600" title={moduleListText}>
                {moduleListText}
              </p>
            </div>
          )}

          {typeListText !== "—" && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Tipler
              </p>
              <p className="line-clamp-1 text-xs text-slate-600">{typeListText}</p>
            </div>
          )}

          {aggregates.totalPersonCount > 0 && (
            <p className="text-xs font-medium text-slate-500">
              Toplam {aggregates.totalPersonCount} kişi
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export const CrmModulGridView = ({
  rows,
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
  onEdit,
}: CrmModulGridViewProps) => (
  <>
    {rows.length === 0 ? (
      <CrmModulListEmpty />
    ) : (
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {rows.map((row) => (
          <CrmModulCard
            key={row.id}
            row={row}
            onEdit={() => onEdit(row)}
          />
        ))}
      </div>
    )}

    <CrmModulListPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      allCount={allCount}
      onPageChange={onPageChange}
    />
  </>
);
