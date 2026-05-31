import { ActivityHoursGapDto } from "api/generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";

type ActivityWeeklyHoursGapDialogProps = {
  open: boolean;
  items: ActivityHoursGapDto[];
  onOpenChange: (open: boolean) => void;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("tr-TR");
  }
  return value;
};

const formatHours = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const ActivityWeeklyHoursGapDialog = ({
  open,
  items,
  onOpenChange,
}: ActivityWeeklyHoursGapDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="flex h-auto max-h-[85vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 p-0 sm:max-w-[1100px]"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-slate-100 text-left">
          <DialogTitle className="text-left text-base font-semibold text-slate-800">
            Aktivite Hatırlatması
          </DialogTitle>
          <p className="text-left text-sm text-slate-500 font-normal pt-1">
            Lütfen eksik aktivite kayıtlarınızı tamamlayınız.
          </p>
        </DialogHeader>

        <div className="overflow-auto px-6 py-4 min-h-0 flex-1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-left text-xs font-semibold text-slate-500 uppercase">
                  Tarih
                </TableHead>
                <TableHead className="text-left text-xs font-semibold text-slate-500 uppercase">
                  Gün
                </TableHead>
                <TableHead className="text-left text-xs font-semibold text-slate-500 uppercase">
                  Girilen Saat
                </TableHead>
                <TableHead className="text-left text-xs font-semibold text-slate-500 uppercase">
                  Eksik Saat
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, index) => (
                <TableRow key={`weekly-gap-${index}`} className="border-slate-50">
                  <TableCell className="text-left text-sm text-slate-700">
                    {formatDisplayDate(row.date)}
                  </TableCell>
                  <TableCell className="text-left text-sm text-slate-700">
                    {row.dayName?.trim() ? row.dayName : "-"}
                  </TableCell>
                  <TableCell className="text-left text-sm text-slate-700 tabular-nums">
                    {formatHours(row.recordedHours)}
                  </TableCell>
                  <TableCell className="text-left text-sm text-amber-800 tabular-nums font-medium">
                    {formatHours(row.missingHours)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        
      </DialogContent>
    </Dialog>
  );
};

export default ActivityWeeklyHoursGapDialog;
