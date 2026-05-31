import { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import getConfiguration from "confiuration";
import { FormAssignApi } from "api/generated";
import { ArrowRight, Pencil } from "lucide-react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

interface Props {
  title: string;
  count: string | number;
  percentage?: {
    color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark" | "white";
    value: string | number;
    label: string;
  };
  dropdown?: {
    action: (...args: any) => void;
    menu: ReactNode;
    value: string;
  };
  [key: string]: any;
  isOpenCard?: boolean;
  page?: string;
}

const tableColumns: { key: string; label: string }[] = [
  { key: "actions", label: "" },
  { key: "statusText", label: "" },
  { key: "formName", label: "Form Adı" },
  { key: "createdDate", label: "" },
];

const getCardBg = (title: string): string => {
  switch (title) {
    case "Toplam Talep":        return "bg-[#f5b041]";
    case "Çözümlü Talep":      return "bg-[#2ecc71]";
    case "Açık Talep":         return "bg-[#e74c3c]";
    case "Bekleyen Formlar":   return "bg-[#f5b041]";
    case "Açık / Kapalı Talep Durumu": return "bg-purple-600";
    default:                   return "bg-white";
  }
};

function DefaultStatisticsCard({
  title = "",
  count = 0,
  percentage = { color: "success", value: 0, label: "" },
  isOpenCard = false,
  page = "",
}: Props): JSX.Element {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const { t } = useTranslation();
  const [openWaitingFormDialog, setopenWaitingFormDialog] = useState(false);
  const [rowData, setRowData] = useState<any[]>([]);

  const columnLabels = useMemo(
    () => [
      { key: "actions",     label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler") },
      { key: "statusText",  label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Durum") },
      { key: "formName",    label: "Form Adı" },
      { key: "createdDate", label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih") },
    ],
    [t],
  );

  const handlePreview = (id: string, assignId: string) => {
    navigate("/parameters/view/" + id, { state: { formAssignId: assignId } });
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new FormAssignApi(conf);
      const data = await api.apiFormAssignUserFormsGet(["1"]);
      console.log("Data>>", data);
      setRowData(data.data);
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu" + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const openFormDialog = async () => {
    await fetchData();
    setopenWaitingFormDialog(true);
  };

  const cardBg = getCardBg(title);

  return (
    <>
      {/* ── Stat card ── */}
      <div className="overflow-hidden rounded-xl shadow-sm border border-white/10">
        <div className={`${cardBg} p-4`}>
          <div className="flex items-center justify-between gap-3">
            {/* Left: numbers */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80 truncate">
                {title}
              </p>
              <p className="text-3xl font-extrabold leading-none text-white tabular-nums">
                {count}
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                <span className="font-semibold text-white">{percentage.value}</span>
                {percentage.label && <span className="ml-1">{percentage.label}</span>}
              </p>
            </div>

            {/* Right: details button */}
            {isOpenCard && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  page !== "userFormList"
                    ? navigate(`/${page}`, { state: { onlyAllTicket: true } })
                    : openFormDialog()
                }
                className="shrink-0 h-8 gap-1.5 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60 hover:text-white backdrop-blur-sm text-xs font-medium"
                aria-label="Detayları görüntüle"
              >
                Detaylar
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Waiting forms dialog ── */}
      <Dialog
        open={openWaitingFormDialog}
        onOpenChange={(open) => !open && setopenWaitingFormDialog(false)}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden"
        >
          <DialogHeader className="px-6 py-4 border-b border-gray-100">
            <DialogTitle className="text-base font-semibold text-[#344767]">
              Bekleyen Formlar
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto max-h-[420px]">
            {rowData.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                Gösterilecek form bulunamadı.
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50">
                  <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                    {columnLabels.map((col) => (
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
                  {rowData.map((row: any, rowIndex: number) => (
                    <TableRow
                      key={rowIndex}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      {columnLabels.map((col) => (
                        <TableCell
                          key={col.key}
                          className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                        >
                          {col.key === "actions" ? (
                            <button
                              type="button"
                              onClick={() => handlePreview(row.formId, row.id)}
                              className="inline-flex size-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                              aria-label="Formu düzenle"
                            >
                              <Pencil className="size-4" />
                            </button>
                          ) : (
                            (row[col.key] ?? "—")
                          )}
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
              onClick={() => setopenWaitingFormDialog(false)}
              aria-label="Diyaloğu kapat"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DefaultStatisticsCard;
