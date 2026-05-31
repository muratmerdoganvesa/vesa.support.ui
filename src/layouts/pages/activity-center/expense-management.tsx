import { Check, Download, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MessageBoxType } from "@ui5/webcomponents-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { ExpenseCenterListDto, ExpenseCenterUpdateDto } from "api/generated/api";
import { ActivityCenterExpensesApi } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import ExpenseAddDialog from "./expense-add-dialog";
import { cn } from "lib/utils";
import DateRangeToolbarControl, {
  type DateRangeValue,
} from "./date-range-toolbar-control";

type ExpenseManagementProps = {
  rows: ExpenseCenterListDto[];
  activityCustomerMap: Record<string, string>;
  selectedId: string | null;
  dateRangeFrom: Date;
  dateRangeTo: Date;
  /** Aktivite dönemi açıkken düzenleme butonları etkin */
  isPeriodOpen: boolean;
  onDateRangeChange: (next: DateRangeValue) => void;
  onSelectRow: (id: string) => void;
  onDelete: () => void;
  onSaveExpense: (payload: ExpenseCenterUpdateDto) => void | Promise<void>;
};

const displayDateToIso = (display: string): string => {
  const parts = display.trim().split(".");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const formatApiDateToDisplay = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("tr-TR");
  }
  return value;
};

const formatApiDateTimeToDisplay = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatApiTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const formatAmountTr = (value?: number | null) =>
  Number(value ?? 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const chartColors = ["#3f76a8", "#6f9fc5", "#8fb5d2", "#b7d0e3"];

function ExpenseManagement({
  rows,
  activityCustomerMap,
  selectedId,
  dateRangeFrom,
  dateRangeTo,
  isPeriodOpen,
  onDateRangeChange,
  onSelectRow,
  onDelete,
  onSaveExpense,
}: ExpenseManagementProps) {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const selectedRow = rows.find((item) => (item.id ?? "") === selectedId) ?? null;

  const downloadBase64Document = (fileName: string, contentType: string, base64: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocuments = async (expenseId?: string) => {
    if (!expenseId) return;
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterExpensesApi(getConfiguration());
      const response = await api.apiActivityCenterExpensesIdDocumentsGet(expenseId);
      const documents = response.data ?? [];
      if (documents.length === 0) {
        dispatchAlert({
          message: "Bu masraf kaydı için belge bulunamadı.",
          type: MessageBoxType.Warning,
        });
        return;
      }

      documents.forEach((document, index) => {
        if (!document.base64) return;
        const fileName = document.fileName?.trim() || `belge-${index + 1}`;
        downloadBase64Document(fileName, document.contentType ?? "application/octet-stream", document.base64);
      });
    } catch (error) {
      dispatchAlert({
        message: "Belgeler indirilirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const expenseByCustomer = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const row of rows) {
      const key = (row.activityId && activityCustomerMap[row.activityId]) ? activityCustomerMap[row.activityId] : "—";
      acc[key] = (acc[key] ?? 0) + Number(row.amount ?? 0);
    }
    return Object.entries(acc)
      .map(([name, value], index) => ({
        name,
        value,
        color: chartColors[index % chartColors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [activityCustomerMap, rows]);

  const chartTotal =
    expenseByCustomer.reduce((sum, item) => sum + item.value, 0) || 1;
  const conicSegments = expenseByCustomer
    .map((item) => `${item.color} ${(item.value / chartTotal) * 100}%`)
    .join(", ");

  const formatAmount = (value: number) =>
    value.toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  return (
    <div className="m-0">
      <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
         
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsEditDialogOpen(true)}
            disabled={!isPeriodOpen || !selectedId}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Düzenle
          </Button>
           <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={!isPeriodOpen || !selectedId}
            className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Kayıt Sil
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsChartDialogOpen(true)}
          >
            Müşteri Dağılımı
          </Button>
        </div>

        <DateRangeToolbarControl
          from={dateRangeFrom}
          to={dateRangeTo}
          onRangeChange={onDateRangeChange}
        />
      </div>

      <div className="max-h-[520px] overflow-auto">
        <Table className="min-w-[2000px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Tarih</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Sıra</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60 w-[72px]">Ek</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Ana Masraf Türü</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Alt Masraf Türü</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Masraf Yeri</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Tutar</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Fiş Durumu</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Fiş No</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60 min-w-[180px]">Açıklama</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">İşlem Tarihi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="h-[290px] text-center text-sm text-slate-500">
                  Henüz Veri Bulunmamaktadır
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((item) => (
                <TableRow
                  key={item.id ?? `${item.sequenceNumber ?? 0}-${item.createdDate ?? ""}`}
                  aria-selected={selectedId === (item.id ?? "")}
                  onClick={() => onSelectRow(item.id ?? "")}
                  className={cn(
                    "cursor-pointer border-slate-50 transition-colors duration-150",
                    selectedId === (item.id ?? "")
                      ? "bg-[#3e5d8f]/22 shadow-[inset_4px_0_0_0_#3e5d8f] hover:bg-[#3e5d8f]/28"
                      : "hover:bg-slate-100/90",
                  )}
                >
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{formatApiDateToDisplay(item.activityDate)}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{Number(item.sequenceNumber ?? 0)}</TableCell>
                  <TableCell
                    className="px-2 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!item.id}
                      className="h-8 w-8 text-slate-600"
                      title="Fiş Belgesini İndirin"
                      aria-label="Fiş belgesini indirin"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleDownloadDocuments(item.id);
                      }}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{item.mainExpenseTypeDescription ?? "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{item.subExpenseTypeDescription ?? "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{item.expenseCenterDescription ?? "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">
                    {item.currencyTypeDescription != null && item.currencyTypeDescription !== ""
                      ? `${formatAmountTr(item.amount)} ${item.currencyTypeDescription}`
                      : formatAmountTr(item.amount)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">
  {item.hasReceipt ? "Var" : "Yok"}
</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{item.receiptNumber ?? "-"}</TableCell>
                  <TableCell
                    className="px-4 py-3 text-sm text-slate-700 max-w-[240px] truncate"
                    title={item.description ?? ""}
                  >
                    {item.description ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-slate-700">{formatApiDateTimeToDisplay(item.createdDate)}</TableCell>
                </TableRow>
                ))}
                <TableRow className="bg-slate-50/70 border-t border-slate-200">
                  <TableCell className="px-4 py-2 text-sm text-slate-500" colSpan={6}>
                    Toplam
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm font-semibold text-slate-700">
                    {formatAmountTr(totalAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-2" colSpan={4} />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1100px] max-h-[88vh] overflow-auto rounded-2xl border border-slate-300/60 shadow-[0_10px_30px_rgba(15,23,42,0.15)] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-semibold">Müşteri Bazlı Masraf Dağılımı</DialogTitle>
          </DialogHeader>
          {rows.length === 0 || expenseByCustomer.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Grafik için masraf kaydı bulunmuyor.
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-slate-200/80 bg-white px-6 py-5">
              <p className="text-center text-sm text-slate-500 mb-4">
                Müşteri bilgisine göre toplam masraf tutarı
              </p>
              <div className="mt-1 flex flex-col md:flex-row items-start gap-6 md:gap-8">
                <div className="relative h-[260px] w-[260px] md:h-[300px] md:w-[300px] shrink-0 mx-auto md:mx-0">
                  <div
                    className="h-full w-full rounded-full"
                    style={{ background: `conic-gradient(${conicSegments})` }}
                  />
                  <div className="absolute left-1/2 top-1/2 h-[104px] w-[104px] md:h-[120px] md:w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                </div>

                <div className="flex-1 space-y-4 pt-1 min-w-0 w-full">
                  {expenseByCustomer.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-5 w-5 shrink-0 border border-slate-400/40"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-lg md:text-xl leading-tight text-slate-600 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-lg md:text-xl leading-none text-slate-600 shrink-0 tabular-nums">
                        {formatAmount(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-2 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 bg-slate-50 sm:justify-end">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsChartDialogOpen(false)}
          >
            Kapat
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExpenseAddDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        activityId={selectedRow?.activityId ?? ""}
        activityDateDisplay={formatApiDateToDisplay(selectedRow?.createdDate)}
        activityDateIso={selectedRow ? displayDateToIso(formatApiDateToDisplay(selectedRow.createdDate)) : ""}
        customerInfo=""
        activityUserName=""
        initialExpense={selectedRow}
        isPeriodOpen={isPeriodOpen}
        onSave={onSaveExpense}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-300/60 p-6">
          <DialogHeader>
            <DialogTitle className="font-semibold">Kayıt Silme Onayı</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-700">
            Seçili masraf kaydını silmek istediğinize emin misiniz?
          </p>
          <DialogFooter className="mt-4 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 bg-slate-50 sm:justify-end">
          <Button
            variant="outline"
            className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
            Vazgeç
          </Button>
          <Button
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
            disabled={!isPeriodOpen}
            onClick={async () => {
              setIsDeleteDialogOpen(false);
              await onDelete();
            }}
          >
            <Check className="h-4 w-4" aria-hidden />
            Sil
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExpenseManagement;
