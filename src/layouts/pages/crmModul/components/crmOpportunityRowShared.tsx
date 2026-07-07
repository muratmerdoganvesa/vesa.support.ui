import { CrmSubItemDto, OpportunityStage } from "api/generated";
import { Badge } from "components/ui/badge";
import { TableHead, TableRow } from "components/ui/table";
import { cn } from "lib/utils";
import { getCurrencySymbol, getOpportunityStageLabel } from "../constants";
import { formatMoney } from "../utils";

export const formatSubItemTotal = (item: CrmSubItemDto): string => {
  const amount = item.estimatedDiscountedValue ?? item.estimatedValue;
  if (amount == null) return "—";
  return formatMoney(amount, getCurrencySymbol(item.currencyType));
};

export const getPipelineStageClass = (stage?: OpportunityStage | null): string => {
  switch (stage) {
    case OpportunityStage.NUMBER_1:
      return "bg-amber-200 text-amber-950 border-amber-300";
    case OpportunityStage.NUMBER_2:
      return "bg-orange-200 text-orange-950 border-orange-300";
    case OpportunityStage.NUMBER_3:
      return "bg-orange-300 text-orange-950 border-orange-400";
    case OpportunityStage.NUMBER_4:
      return "bg-amber-300 text-amber-950 border-amber-400";
    case OpportunityStage.NUMBER_5:
      return "bg-amber-400 text-amber-950 border-amber-500";
    case OpportunityStage.NUMBER_6:
      return "bg-emerald-300 text-emerald-950 border-emerald-500";
    case OpportunityStage.NUMBER_7:
      return "bg-red-300 text-red-950 border-red-400";
    case OpportunityStage.NUMBER_8:
      return "bg-slate-300 text-slate-800 border-slate-400";
    default:
      return "bg-slate-200 text-slate-700 border-slate-300";
  }
};

export const PipelineStageBadge = ({ stage }: { stage?: OpportunityStage | null }) => {
  const stageLabel = getOpportunityStageLabel(stage);
  if (stageLabel === "—") {
    return <span className="text-sm text-slate-400">—</span>;
  }
  return (
    <Badge
      variant="outline"
      className={cn("border font-semibold shadow-sm", getPipelineStageClass(stage))}
    >
      {stageLabel}
    </Badge>
  );
};

export const OPPORTUNITY_TABLE_COLUMN_COUNT = 7;
export const LIST_TABLE_COLUMN_COUNT = 10;
export const CUSTOMER_LIST_TABLE_COLUMN_COUNT = 10;

export const CrmOpportunityTableHeader = () => (
  <TableRow className="border-b border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
    <TableHead className="w-[52px] px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Düzenle
    </TableHead>
    <TableHead className="min-w-[100px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Şirket Adı
    </TableHead>
    <TableHead className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Partner Adı
    </TableHead>
    <TableHead className="min-w-[100px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Modül
    </TableHead>
    <TableHead className="min-w-[90px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
      Kişi Sayısı
    </TableHead>
    <TableHead className="min-w-[110px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Toplam
    </TableHead>
    <TableHead className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-800">
      Pipeline Durumu
    </TableHead>
  </TableRow>
);

export const CrmListTableHeader = () => (
  <TableRow className="border-b border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
    <TableHead className="w-[52px] px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Düzenle
    </TableHead>
    <TableHead className="min-w-[100px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Şirket Adı
    </TableHead>
    <TableHead className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Partner Adı
    </TableHead>
    <TableHead className="min-w-[130px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Vesa Hesap yöneticisi
    </TableHead>
    <TableHead className="min-w-[100px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Modül
    </TableHead>
    <TableHead className="min-w-[90px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
      Kişi Sayısı
    </TableHead>
    <TableHead className="min-w-[110px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Toplam
    </TableHead>
    <TableHead className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-800">
      Pipeline Durumu
    </TableHead>
    <TableHead className="min-w-[150px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Son Güncelleme
    </TableHead>
    <TableHead className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Güncelleyen
    </TableHead>
  </TableRow>
);

export const CrmCustomerListTableHeader = () => (
  <TableRow className="border-b border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">
    <TableHead className="w-[52px] px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Düzenle
    </TableHead>
    <TableHead className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Müşteri Adı
    </TableHead>
    <TableHead className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Partner
    </TableHead>
    <TableHead className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      İlgili Kişi
    </TableHead>
    <TableHead className="min-w-[110px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Telefon
    </TableHead>
    <TableHead className="min-w-[100px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Lead Kaynağı
    </TableHead>
    <TableHead className="min-w-[72px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
      Fırsat
    </TableHead>
    <TableHead className="min-w-[130px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Vesa Hesap yöneticisi
    </TableHead>
    <TableHead className="min-w-[150px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Son Güncelleme
    </TableHead>
    <TableHead className="min-w-[120px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Güncelleyen
    </TableHead>
  </TableRow>
);
