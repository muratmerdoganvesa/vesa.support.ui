import { Check, DollarSign, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { ActivityCenterListDto, ExpenseCenterUpdateDto } from "api/generated/api";
import { useState } from "react";
import { cn } from "lib/utils";
import ExpenseAddDialog from "./expense-add-dialog";
import DateRangeToolbarControl, {
  type DateRangeValue,
} from "./date-range-toolbar-control";

const displayDateToIso = (display: string): string => {
  const parts = display.trim().split(".");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

type ActivityManagementProps = {
  rows: ActivityCenterListDto[];
  selectedId: string | null;
  dateRangeFrom: Date;
  dateRangeTo: Date;
  /** Aktivite dönemi açıkken düzenleme butonları etkin */
  isPeriodOpen: boolean;
  onDateRangeChange: (next: DateRangeValue) => void;
  onSelectRow: (id: string) => void;
  onDelete: () => Promise<void> | void;
  onEdit: () => void;
  onOpenCreate: () => void;
  onSaveExpense: (payload: ExpenseCenterUpdateDto) => void | Promise<void>;
};

const formatApiDateToDisplay = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("tr-TR");
  }
  return value;
};

const getDayText = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("tr-TR", { weekday: "long" });
};

const chartColors = ["#3f76a8", "#6f9fc5", "#8fb5d2", "#b7d0e3"];

function ActivityManagement({
  rows,
  selectedId,
  dateRangeFrom,
  dateRangeTo,
  isPeriodOpen,
  onDateRangeChange,
  onSelectRow,
  onDelete,
  onEdit,
  onOpenCreate,
  onSaveExpense,
}: ActivityManagementProps) {
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const selectedRow = rows.find((item) => (item.id ?? "") === selectedId) ?? null;
  const totals = {
    totalActivity: rows.reduce((sum, item) => sum + Number(item.activityHours ?? 0), 0),
    totalInvoice: rows.reduce((sum, item) => sum + Number(item.billableHours ?? 0), 0),
  };
  const totalActivityDay = (totals.totalActivity / 8).toFixed(3);
  const totalInvoiceDay = (totals.totalInvoice / 8).toFixed(3);

  const customerValues = rows.reduce<Record<string, number>>((acc, row) => {
    const customerName = row.workCompanyName ?? "-";
    const existingValue = acc[customerName] ?? 0;
    acc[customerName] = existingValue + Number(row.activityHours ?? 0);
    return acc;
  }, {});

  const customerChartData = Object.entries(customerValues)
    .map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    }))
    .sort((a, b) => b.value - a.value);

  const chartTotal = customerChartData.reduce((sum, item) => sum + item.value, 0) || 1;
  const conicSegments = customerChartData
    .map((item) => `${item.color} ${(item.value / chartTotal) * 100}%`)
    .join(", ");

  const handleExportTableToExcel = () => {
    const exportRows = rows.map((item) => ({
      Tarih: formatApiDateToDisplay(item.activityDate),
      Gün: item.activityDay ?? getDayText(item.activityDate),
      Sıra: item.sequenceNumber ?? 0,
      Müşteri: item.workCompanyName ?? "-",
      Proje: item.ticketProjectName ?? "-",
      "Alt Proje": item.subTicketProjectName ?? "-",
      "Efor Yeri": item.workLocation ?? "-",
      "Aktivite Saati": Number(item.activityHours ?? 0),
      "Fatura Saati": Number(item.billableHours ?? 0),
      "Talep ID": item.ticketUniqNumber ?? "",
      "Referans Personel": item.referenceEmployeeFullName ?? "",
      "Talep Eden Kişi": item.requesterOfTicket ?? "",
      Açıklama: item.description ?? "",
      "İşlem Tarihi": formatApiDateToDisplay(item.createdDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Aktivite Yönetimi");
    XLSX.writeFile(workbook, "aktivite-yonetimi.xlsx");
  };

  return (
    <div className="m-0">
      <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={onOpenCreate}
            disabled={!isPeriodOpen}
            className="h-8 gap-2 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium shadow-sm shadow-[#3e5d8f]/25 transition-all duration-200 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Yeni Kayıt
          </Button>
         
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={!isPeriodOpen || !selectedId}
            onClick={onEdit}
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
            disabled={!isPeriodOpen || selectedId === null}
            onClick={() => setIsExpenseDialogOpen(true)}
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            Masraf Ekle
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
            disabled={rows.length === 0}
            onClick={handleExportTableToExcel}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Dışa Aktar
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

      <div className="max-h-[430px] overflow-auto">
        <Table className="min-w-[2200px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Tarih</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Gün</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Sıra</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Ek</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Müşteri</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Proje</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Alt Proje</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Efor Yeri</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Aktivite Saati</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Fatura Saati</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Talep ID</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Referans Personel</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Talep Eden Kişi</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">Açıklama</TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">İşlem Tarihi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow
                key={item.id ?? `${item.sequenceNumber ?? 0}-${item.activityDate ?? ""}`}
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
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.activityDay ?? getDayText(item.activityDate)}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{Number(item.sequenceNumber ?? 0)}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700" />
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.workCompanyName ?? "-"}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.ticketProjectName ?? "-"}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.subTicketProjectName ?? "-"}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.workLocation ?? "-"}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{Number(item.activityHours ?? 0)}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{Number(item.billableHours ?? 0)}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.ticketUniqNumber ?? ""}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.referenceEmployeeFullName ?? "-"}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{item.requesterOfTicket ?? "-"}</TableCell>
                <TableCell
                  className="px-4 py-3 text-sm text-slate-700 max-w-[320px] truncate"
                  title={(item.description ?? "").length > 30 ? item.description ?? "" : undefined}
                >
                  {(item.description ?? "").length > 30
                    ? `${(item.description ?? "").slice(0, 30)}...`
                    : item.description ?? ""}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-700">{formatApiDateToDisplay(item.createdDate)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-50/70 border-t border-slate-200">
              <TableCell className="px-4 py-2 text-sm text-slate-500" colSpan={8}>
                Toplam
              </TableCell>
              <TableCell className="px-4 py-2 text-sm font-semibold text-slate-700">
                {totals.totalActivity} S / {totalActivityDay} G
              </TableCell>
              <TableCell className="px-4 py-2 text-sm font-semibold text-slate-700">
                {totals.totalInvoice} S / {totalInvoiceDay} G
              </TableCell>
              <TableCell className="px-4 py-2" colSpan={5} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[1100px] max-h-[88vh] overflow-auto rounded-2xl border border-slate-300/60 shadow-[0_10px_30px_rgba(15,23,42,0.15)] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-semibold">Müşteri Bazlı Dağılım</DialogTitle>
          </DialogHeader>
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white px-6 py-5">
            <div className="mt-1 flex flex-col md:flex-row items-start gap-6 md:gap-8">
              <div className="relative h-[260px] w-[260px] md:h-[300px] md:w-[300px] shrink-0 mx-auto md:mx-0">
                <div
                  className="h-full w-full rounded-full"
                  style={{ background: `conic-gradient(${conicSegments})` }}
                />
                <div className="absolute left-1/2 top-1/2 h-[104px] w-[104px] md:h-[120px] md:w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
              </div>

              <div className="flex-1 space-y-4 pt-1 min-w-0 w-full">
                {customerChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 border border-slate-400/40" style={{ backgroundColor: item.color }} />
                      <span className="text-xl md:text-2xl leading-tight text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xl md:text-2xl leading-none text-slate-600">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        mode="create"
        activityId={selectedRow?.id ?? ""}
        activityDateDisplay={formatApiDateToDisplay(selectedRow?.activityDate)}
        activityDateIso={selectedRow ? displayDateToIso(formatApiDateToDisplay(selectedRow.activityDate)) : ""}
        customerInfo={
          selectedRow
            ? `${selectedRow.workCompanyName ?? "-"} — ${selectedRow.ticketProjectName ?? "-"}`
            : ""
        }
        activityUserName={selectedRow?.userFullName ?? ""}
        isPeriodOpen={isPeriodOpen}
        onSave={onSaveExpense}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-300/60 p-6">
          <DialogHeader>
            <DialogTitle className="font-semibold">Kayıt Silme Onayı</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-700">
            Seçili aktivite kaydını silmek istediğinize emin misiniz?
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

export default ActivityManagement;
