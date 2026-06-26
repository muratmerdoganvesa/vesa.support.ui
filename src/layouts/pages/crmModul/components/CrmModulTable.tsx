import { CrmModulDto, WorkCompanyDto } from "api/generated";
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
import { Building2, ChevronLeft, ChevronRight, Handshake, Pencil, Trash2 } from "lucide-react";
import { cn } from "lib/utils";
import { getOpportunityStageLabel } from "../constants";
import { formatDateTr, formatPhoneNumberTr, resolveCompanyName } from "../utils";

type CrmModulTableProps = {
  rows: CrmModulDto[];
  workCompanies: WorkCompanyDto[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
  onEdit: (row: CrmModulDto) => void;
  onDelete: (id: string) => void;
};

export const CrmModulTable = ({
  rows,
  workCompanies,
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
  onEdit,
  onDelete,
}: CrmModulTableProps) => (
  <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Şirket Adı
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              İlgili Kişi
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Pozisyon
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Telefon
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Email
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Fırsat Aşaması
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Son Temas Tarihi
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">
              İşlemler
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Handshake className="size-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">CRM kaydı bulunamadı</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors"
              >
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 font-medium">
                      {resolveCompanyName(row, workCompanies)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-slate-700">
                  {row.contactPerson || "—"}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-slate-600">
                  {row.contactTitle || "—"}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-slate-600 font-mono tracking-wide">
                  {row.phoneNumber
                    ? formatPhoneNumberTr(row.phoneNumber) || row.phoneNumber
                    : "—"}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-slate-600">
                  {row.email || "—"}
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    {getOpportunityStageLabel(row.opportunityStage)}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-slate-600 tabular-nums">
                  {formatDateTr(row.lastContactDate)}
                </TableCell>
                <TableCell className="px-5 py-3.5">
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
            ))
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
