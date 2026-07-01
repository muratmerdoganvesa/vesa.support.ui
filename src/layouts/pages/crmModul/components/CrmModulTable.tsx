import { CrmModulDto } from "api/generated";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "lib/utils";
import { Fragment, useCallback, useState } from "react";
import {
  getLeadSourceLabel,
} from "../constants";
import {
  aggregateCrmModulSubItems,
  formatInlineList,
  formatPhoneNumberTr,
  resolveCompanyName,
  resolvePartnerCompanyName,
} from "../utils";
import { CrmModulSubItemRow } from "./CrmModulSubItemRow";

type CrmModulTableProps = {
  rows: CrmModulDto[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
  onEdit: (row: CrmModulDto) => void;
  onDelete: (id: string) => void;
};

const InlineCell = ({ value, title }: { value: string; title?: string }) => (
  <span className="line-clamp-2" title={title ?? value}>
    {value}
  </span>
);

export const CrmModulTable = ({
  rows,
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
  onEdit,
  onDelete,
}: CrmModulTableProps) => {
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  return (
  <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
            <TableHead className="px-2 py-3 w-10" aria-label="Genişlet" />
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[160px]">
              Müşteri
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[140px]">
              Partner
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Lead Kaynağı
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Fırsat Aşaması
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              İlgili Kişi
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Pozisyon
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Telefon
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Mail
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              SAP Hesap Yöneticisi
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
              Toplam Kişi
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[180px]">
              SF Modülleri
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[140px]">
              Tipler
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap">
              İşlemler
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={14} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Handshake className="size-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">CRM kaydı bulunamadı</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const aggregates = aggregateCrmModulSubItems(row);
              const moduleListText = formatInlineList(aggregates.uniqueModuleNames);
              const typeListText = formatInlineList(aggregates.uniqueTypeLabels);
              const stageListText = formatInlineList(aggregates.uniqueOpportunityStageLabels);
              const phoneDisplay = row.phoneNumber
                ? formatPhoneNumberTr(row.phoneNumber)
                : "—";
              const subItems = row.crmSubItems ?? [];
              const rowId = row.id ?? "";
              const isExpanded = rowId ? expandedRowIds.has(rowId) : false;
              const hasSubItems = subItems.length > 0;

              return (
                <Fragment key={row.id}>
                <TableRow
                  className={cn(
                    "border-b border-slate-100 hover:bg-indigo-50/30 transition-colors",
                    isExpanded && "bg-indigo-50/20 border-b-0"
                  )}
                >
                  <TableCell className="px-2 py-3.5 w-10">
                    {hasSubItems && rowId ? (
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(rowId)}
                        className="inline-flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title={isExpanded ? "Fırsatları gizle" : "Fırsatları göster"}
                        aria-label={
                          isExpanded
                            ? `${resolveCompanyName(row)} fırsatlarını gizle`
                            : `${resolveCompanyName(row)} fırsatlarını göster`
                        }
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    ) : (
                      <span className="inline-block size-8" aria-hidden="true" />
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">
                        {resolveCompanyName(row)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                    {resolvePartnerCompanyName(row)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                    {getLeadSourceLabel(row.leadSource)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    {stageListText !== "—" ? (
                      <Badge
                        variant="outline"
                        className="bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        {stageListText}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                    {row.contactPerson || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                    {row.contactTitle || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 tabular-nums whitespace-nowrap font-mono tracking-wide">
                    {phoneDisplay}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                    {row.email || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                    {row.sapAccountManager || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-700 font-medium tabular-nums whitespace-nowrap text-center">
                    {aggregates.totalPersonCount > 0 ? aggregates.totalPersonCount : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 max-w-[240px]">
                    <InlineCell value={moduleListText} title={moduleListText} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-slate-600 max-w-[200px]">
                    <InlineCell value={typeListText} title={typeListText} />
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Düzenle"
                        aria-label="Düzenle"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => row.id && onDelete(row.id)}
                        className="inline-flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Sil"
                        aria-label="Sil"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded &&
                  subItems.map((item, index) => (
                    <CrmModulSubItemRow
                      key={item.id ?? `${rowId}-sub-${index}`}
                      item={item}
                      isLast={index === subItems.length - 1}
                    />
                  ))}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>

    <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
      <p className="text-xs text-slate-500">
        Toplam <span className="font-semibold text-slate-700">{totalCount}</span> kayıt
        {totalCount !== allCount && (
          <span className="text-slate-400"> ({allCount} içinden)</span>
        )}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="size-8"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="size-8 flex items-center justify-center text-xs text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item as number)}
                  className={cn(
                    "size-8 rounded-md text-xs font-medium transition-colors",
                    currentPage === item
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  aria-current={currentPage === item ? "page" : undefined}
                >
                  {item}
                </button>
              )
            )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="size-8"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  </>
  );
};
