import { ColumnChart, PieChart } from "@ui5/webcomponents-react-charts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ShowHistory from "layouts/pages/WorkFlow/ShowHistory";
import HistoryDialog from "components/HistoryDialog/HistoryDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { BarChart3, History, Search, Eye, Pencil } from "lucide-react";

function TicketGraphic({
  ticketsData,
  createGraphic,
  pageDesc,
}: {
  ticketsData: any[];
  createGraphic?: (data: any) => void;
  pageDesc: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [statuData, setStatuData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [assignData, setAssignData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [filteredData, setfilteredData] = useState([]);
  const [selectedAprHis, setselectedAprHis] = useState<any>(null);
  const [aprHistoryOpen, setaprHistoryOpen] = useState(false);
  const [historyDialogOpen, sethistoryDialogOpen] = useState<boolean>(false);
  const [selectedTicket, setselectedTicket] = useState<any>(null);
  const [openTicketsDialog, setopenTicketsDialog] = useState(false);

  const tableColumns: { key: string; label: string }[] = [
    { key: "actions",             label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler") },
    { key: "ticketNumber",        label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.TalepNo") },
    { key: "statusText",          label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Durum") },
    { key: "title",               label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Baslik") },
    { key: "customerRefName",     label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Musteri") },
    { key: "ticketAssigneText",   label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Atanan") },
    { key: "userAppName",         label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Olusturan") },
    { key: "createdDate",         label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih") },
    { key: "ticketDepartmentText",label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Departman") },
  ];

  // ── Grouping helpers (unchanged) ──────────────────────────────────────────

  const groupByStatu = () => {
    const grouped = ticketsData.reduce(
      (acc: Record<string, { count: number; statusText: string }>, ticket) => {
        const status = ticket.status || "Bilinmiyor";
        const statusText = ticket.statusText || "Bilinmeyen";
        if (!acc[status]) acc[status] = { count: 0, statusText };
        acc[status].count += 1;
        return acc;
      },
      {}
    );
    setStatuData(
      Object.entries(grouped).map(([status, { count, statusText }]) => ({
        status, statusText, count, chartName: "statuChart",
      })) as any
    );
  };

  const groupByDepartment = () => {
    const grouped = ticketsData.reduce(
      (acc: Record<string, { count: number; ticketDepartmentText: string }>, ticket) => {
        const ticketDepartmentId = ticket.ticketDepartmentId || "Bilinmiyor";
        const ticketDepartmentText = ticket.ticketDepartmentText || "Bilinmeyen";
        if (!acc[ticketDepartmentId]) acc[ticketDepartmentId] = { count: 0, ticketDepartmentText };
        acc[ticketDepartmentId].count += 1;
        return acc;
      },
      {}
    );
    setDepartmentData(
      Object.entries(grouped).map(([ticketDepartmentId, { count, ticketDepartmentText }]) => ({
        ticketDepartmentId, ticketDepartmentText, count, chartName: "dptChart",
      })) as any
    );
  };

  const groupByCompany = () => {
    const grouped = ticketsData.reduce(
      (acc: Record<string, { count: number; customerRefName: string }>, ticket) => {
        const customerRefId = ticket.customerRefId || "Bilinmiyor";
        const customerRefName = ticket.customerRefName || "Bilinmeyen";
        if (!acc[customerRefId]) acc[customerRefId] = { count: 0, customerRefName };
        acc[customerRefId].count += 1;
        return acc;
      },
      {}
    );
    setCompanyData(
      Object.entries(grouped).map(([customerRefId, { count, customerRefName }]) => ({
        customerRefId, customerRefName, count, chartName: "customerChart",
      })) as any
    );
  };

  const groupByAssigng = () => {
    const grouped = ticketsData.reduce(
      (acc: Record<string, { count: number; ticketAssigneText: string }>, ticket) => {
        const ticketAssigneId = ticket.ticketAssigneId || "Bilinmiyor";
        const ticketAssigneText = ticket.ticketAssigneText || "Bilinmeyen";
        if (!acc[ticketAssigneId]) acc[ticketAssigneId] = { count: 0, ticketAssigneText };
        acc[ticketAssigneId].count += 1;
        return acc;
      },
      {}
    );
    setAssignData(
      Object.entries(grouped).map(([ticketAssigneId, { count, ticketAssigneText }]) => ({
        ticketAssigneId, ticketAssigneText, count, chartName: "assignChart",
      })) as any
    );
  };

  useEffect(() => {
    if (ticketsData && ticketsData.length > 0) {
      groupByStatu();
      groupByCompany();
      groupByAssigng();
      groupByDepartment();
    }
  }, [ticketsData]);

  // ── Event handlers (unchanged) ────────────────────────────────────────────

  const onDataPointClick = (oEvent: any) => {
    console.log("onDataPointClick", oEvent);
    const selectedChart = oEvent.detail.payload.chartName;
    console.log("selectedChart", selectedChart);

    if (selectedChart === "statuChart") {
      const selectedStatu = oEvent.detail.payload.status;
      setfilteredData(ticketsData.filter((e) => e.status === selectedStatu) as any);
    } else if (selectedChart === "dptChart") {
      const selecteddpt = oEvent.detail.payload.ticketDepartmentId;
      setfilteredData(ticketsData.filter((e) => e.ticketDepartmentId === selecteddpt) as any);
    } else if (selectedChart === "customerChart") {
      const selectedcustomer = oEvent.detail.payload.customerRefId;
      setfilteredData(ticketsData.filter((e) => e.customerRefId === selectedcustomer) as any);
    } else if (selectedChart === "assignChart") {
      const selectedAssign = oEvent.detail.payload.ticketAssigneId;
      setfilteredData(
        selectedAssign === "Bilinmiyor"
          ? (ticketsData.filter((e) => e.ticketAssigneText === "Atama Yok") as any)
          : (ticketsData.filter((e) => e.ticketAssigneId === selectedAssign) as any)
      );
    }

    setopenTicketsDialog(true);
  };

  const handleNavigate = (id: string, review: boolean) => {
    sessionStorage.setItem("ticketId", id);
    if (pageDesc === "solveAllTicket") {
      navigate("/solveAllTicket/solveTicket", { state: { ticketId: id, review } });
    } else {
      navigate("/tickets/detail/", { state: { ticketId: id, review } });
    }
  };

  const onCloseSearchDialog = () => {
    setopenTicketsDialog(false);
    setfilteredData([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={150}>
      <>
        {/* Generate / refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => createGraphic(true)}
          className="ml-2 h-9 w-60 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
          aria-label={t("ns1:TicketPage.TicketTablePage.GrafikOlusturYenile")}
        >
          <BarChart3 className="size-4" />
          {t("ns1:TicketPage.TicketTablePage.GrafikOlusturYenile")}
        </Button>

        {/* Charts grid */}
        {ticketsData.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Durum */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                {t("ns1:TicketPage.TicketTablePage.GraphProps.DurumGrafigi")}
              </p>
              <PieChart
                style={{ width: "20rem", height: "20rem" }}
                dataset={statuData}
                dimension={{ accessor: "statusText" }}
                measure={{ accessor: "count" }}
                onDataPointClick={onDataPointClick}
              />
            </div>

            {/* Müşteri */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                {t("ns1:TicketPage.TicketTablePage.GraphProps.MusteriGrafigi")}
              </p>
              <PieChart
                style={{ width: "20rem", height: "20rem" }}
                dataset={companyData}
                dimension={{ accessor: "customerRefName" }}
                measure={{ accessor: "count" }}
                onDataPointClick={onDataPointClick}
              />
            </div>

            {/* Atanan */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                {t("ns1:TicketPage.TicketTablePage.GraphProps.AtananGrafigi")}
              </p>
              <ColumnChart
                style={{ width: "30rem", height: "20rem" }}
                dataset={assignData}
                dimensions={[{ accessor: "ticketAssigneText" }]}
                measures={[{ accessor: "count", label: "Talep Sayısı" }]}
                noLegend={true}
                onDataPointClick={onDataPointClick}
              />
            </div>

            {/* Departman */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                {t("ns1:TicketPage.TicketTablePage.GraphProps.DepartmanGrafigi")}
              </p>
              <PieChart
                style={{ width: "20rem", height: "20rem" }}
                dataset={departmentData}
                dimension={{ accessor: "ticketDepartmentText" }}
                measure={{ accessor: "count" }}
                onDataPointClick={onDataPointClick}
              />
            </div>
          </div>
        )}

        {/* Filtered tickets dialog */}
        <Dialog open={openTicketsDialog} onOpenChange={(open) => !open && onCloseSearchDialog()}>
          <DialogContent
            showCloseButton={false}
            className="w-[95vw] max-w-[95vw] p-0 gap-0 overflow-hidden"
          >
            <DialogHeader className="px-6 py-4 border-b border-gray-100">
              <DialogTitle className="text-base font-semibold text-[#344767]">
                Talep Listesi
              </DialogTitle>
            </DialogHeader>

            <div className="overflow-auto max-h-[65vh]">
              {filteredData.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Gösterilecek veri bulunamadı.
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-gray-50">
                    <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                      {tableColumns.map((col) => (
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
                    {filteredData.map((row: any, rowIndex: number) => (
                      <TableRow
                        key={rowIndex}
                        className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                      >
                        {tableColumns.map((col) => (
                          <TableCell
                            key={col.key}
                            className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                          >
                            {col.key === "actions" ? (
                              <div className="flex items-center gap-0.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setselectedAprHis(row.workFlowHeadId);
                                        setaprHistoryOpen(true);
                                      }}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                      aria-label="Onay Geçmişi"
                                    >
                                      <History className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Onay Geçmişi</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setselectedTicket(row.id);
                                        sethistoryDialogOpen(true);
                                      }}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                      aria-label="Talep Geçmişi"
                                    >
                                      <Search className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Talep Geçmişi</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleNavigate(row.id, true)}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                      aria-label="İncele"
                                    >
                                      <Eye className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>İncele</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleNavigate(row.id, false)}
                                      className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                      aria-label="Talebi Düzenle"
                                    >
                                      <Pencil className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Talebi Düzenle</TooltipContent>
                                </Tooltip>
                              </div>
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
                onClick={onCloseSearchDialog}
                aria-label="Diyaloğu kapat"
              >
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History dialogs */}
        {historyDialogOpen && (
          <HistoryDialog
            ticketId={selectedTicket}
            isOpen={historyDialogOpen}
            onClose={() => sethistoryDialogOpen(false)}
          />
        )}

        {aprHistoryOpen && (
          <ShowHistory
            approveId={selectedAprHis}
            open={aprHistoryOpen}
            onClose={() => setaprHistoryOpen(false)}
          />
        )}
      </>
    </TooltipProvider>
  );
}

export default TicketGraphic;
