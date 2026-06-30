import { TicketApi, TicketAssigneListDto } from "api/generated";
import getConfiguration from "confiuration";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Button } from "components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

const columns: { key: keyof TicketAssigneListDto; label: string }[] = [
  { key: "name", label: "Atanılan Kişi" },
  { key: "createDate", label: "İşlem Tarihi" },
  { key: "status", label: "Durum" },
  { key: "createdBy", label: "İşlem Yapan Kişi" },
];

function HistoryDialog({ ticketId, isOpen, onClose }: Props) {
  const [historyData, setHistoryData] = useState<TicketAssigneListDto[]>([]);
  const [loading, setLoading] = useState(false);

  const getHistory = async () => {
    setLoading(true);
    const conf = getConfiguration();
    const ticketApi = new TicketApi(conf);
    const res = await ticketApi.apiTicketGetAssingListGet(ticketId);
    console.log("HISTORY>>>", res);
    res.data.forEach((item) => {
      item.createDate = format(new Date(item.createDate), "dd.MM.yyyy HH:mm:ss", { locale: tr });
    });
    setHistoryData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    getHistory();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold text-[#344767]">
            Talep Geçmişi
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Talep geçmişi bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-gray-50">
                <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                      >
                        {(row[col.key] as string) ?? "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-gray-100 bg-gray-50/60">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            aria-label="Diyaloğu kapat"
            className="mb-3"
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HistoryDialog;
