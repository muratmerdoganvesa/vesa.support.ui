import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  History,
  Search,
  Pencil,
  Eye,
  BarChart2,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  AlertTriangle,
} from "lucide-react";

import getConfiguration from "confiuration";
import { TicketApi } from "api/generated/api";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { cn } from "lib/utils";

import "layouts/pages/teams/createTeam/index.css";
import GlobalCell from "../allTickets/tableData/globalCell";
import FilterTableMethod from "../components";
import HistoryDialog from "components/HistoryDialog/HistoryDialog";
import ShowHistory from "layouts/pages/WorkFlow/ShowHistory";
import TicketGraphic from "../components/Graphics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColumnDef {
  accessor: string;
  header: React.ReactNode;
  cell?: (props: { row: any; value: any; columnId: string }) => React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Primitive sub-components (identical to allTickets)
// ---------------------------------------------------------------------------

const Tip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Tooltip delayDuration={150}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent sideOffset={6}>{label}</TooltipContent>
  </Tooltip>
);

interface ActionBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  variant?: "default" | "danger";
}

const ActionBtn = ({ tooltip, variant = "default", className, children, ...props }: ActionBtnProps) => (
  <Tip label={tooltip}>
    <button
      type="button"
      aria-label={tooltip}
      className={cn(
        "inline-flex items-center justify-center rounded-lg w-7 h-7 transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        variant === "danger"
          ? "text-rose-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-rose-300"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </button>
  </Tip>
);

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
      <Inbox className="w-6 h-6 text-slate-400" />
    </div>
    <p className="text-sm font-medium text-slate-500">Gösterilecek talep bulunamadı.</p>
    <p className="text-xs text-slate-400">Filtrelerinizi temizlemeyi deneyin.</p>
  </div>
);

const TicketTable = ({ columns, rows }: { columns: ColumnDef[]; rows: any[] }) => {
  if (rows.length === 0) return <EmptyState />;

  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent border-slate-100">
          {columns.map((col) => (
            <TableHead
              key={col.accessor}
              className={cn(
                "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60",
                col.className
              )}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIdx) => (
          <TableRow
            key={rowIdx}
            className="group border-slate-50 hover:bg-blue-50/30 transition-colors duration-100"
          >
            {columns.map((col) => {
              const value = row[col.accessor];
              const cellCtx = { row: { original: row }, value, columnId: col.accessor };
              return (
                <TableCell
                  key={col.accessor}
                  className={cn("px-4 py-3 text-sm text-slate-700 align-middle", col.className)}
                >
                  {col.cell ? col.cell(cellCtx) : value ?? "—"}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

interface PaginationProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  itemsPerPage: number;
}

const Pagination = ({ pageCount, currentPage, onPageChange, totalCount, itemsPerPage }: PaginationProps) => {
  if (pageCount <= 1) return null;

  const buildPages = (): (number | "…")[] => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
    const pages: (number | "…")[] = [];
    if (currentPage <= 3) {
      pages.push(0, 1, 2, 3, 4, "…", pageCount - 1);
    } else if (currentPage >= pageCount - 4) {
      pages.push(0, "…", pageCount - 5, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1);
    } else {
      pages.push(0, "…", currentPage - 1, currentPage, currentPage + 1, "…", pageCount - 1);
    }
    return pages;
  };

  const from = currentPage * itemsPerPage + 1;
  const to = Math.min((currentPage + 1) * itemsPerPage, totalCount);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">{from}–{to}</span> / {totalCount} kayıt
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          aria-label="İlk sayfa"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Önceki sayfa"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {buildPages().map((page, i) =>
          page === "…" ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-label={`Sayfa ${page + 1}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                page === currentPage
                  ? "bg-[#3e5d8f] text-white shadow-sm shadow-[#3e5d8f]/30"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              {(page as number) + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount - 1}
          aria-label="Sonraki sayfa"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(pageCount - 1)}
          disabled={currentPage === pageCount - 1}
          aria-label="Son sayfa"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page size selector
// ---------------------------------------------------------------------------

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const PageSizeSelect = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="flex items-center gap-2 text-xs text-slate-500">
    <span>Sayfa başına</span>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Sayfa başına kayıt sayısı"
      className={cn(
        "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 font-medium",
        "outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer"
      )}
    >
      {PAGE_SIZE_OPTIONS.map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
    <span>kayıt</span>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function SolveAllTicket() {
  const { t } = useTranslation();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const {
    onlyAllTicket,
    workCompanyId,
    workCompanyName,
    projectId,
    projectName,
    projectSubName,
  } = useLocation().state || {};

  const [ticketRowData, setTicketRowData] = useState<any[]>([]);
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalListCount, setTotalListCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);

  const [selectedAprHis, setSelectedAprHis] = useState<any>(null);
  const [aprHistoryOpen, setAprHistoryOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"table" | "chart">("table");
  const [createGraph, setCreateGraph] = useState(false);
  const [graphicData, setGraphicData] = useState<any[]>([]);

  const currentPage = itemsPerPage > 0 ? Math.floor(itemOffset / itemsPerPage) : 0;

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsRefresh(true);
  }, [itemsPerPage]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePageClick = (page: number) => {
    const newOffset = page * itemsPerPage;
    setItemOffset(newOffset);
    setIsRefresh(true);
  };

  const handleItemsPerPageChange = (n: number) => {
    setItemOffset(0);
    setItemsPerPage(n);
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new TicketApi(getConfiguration());
      await api.apiTicketIdDelete(id);
      setIsRefresh(true);
      dispatchAlert({ message: "Talep başarıyla silindi.", type: "Success" });
    } catch (error: any) {
      dispatchAlert({
        message: "Hata: " + (error?.response?.data?.errors ?? error),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleFilterData = (data: any) => setTicketRowData(data);

  // ── Column definitions ────────────────────────────────────────────────────

  const columns: ColumnDef[] = [
    {
      accessor: "actions",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler"),
      className: "w-32 sticky left-0 bg-white group-hover:bg-blue-50/30",
      cell: ({ row }) => {
        const { id, workFlowHeadId } = row.original;
        const openInTab = (review: boolean) => {
          sessionStorage.setItem("ticketId", id);
          sessionStorage.setItem("review", String(review));
          window.open("/solveAllTicket/solveTicket", "_blank");
        };

        return (
          <div className="flex items-center gap-0.5">
            <ActionBtn
              tooltip={t("ns1:TicketPage.TicketTablePage.OnayGecmisi")}
              onClick={() => { setSelectedAprHis(workFlowHeadId); setAprHistoryOpen(true); }}
            >
              <History className="w-3.5 h-3.5" />
            </ActionBtn>

            <ActionBtn
              tooltip={t("ns1:TicketPage.TicketTablePage.TalepGecmisi")}
              onClick={() => { setSelectedTicket(id); setHistoryDialogOpen(true); }}
            >
              <Search className="w-3.5 h-3.5" />
            </ActionBtn>

            <ActionBtn
              tooltip={t("ns1:TicketPage.TicketTablePage.Incele")}
              onClick={() => openInTab(true)}
            >
              <Eye className="w-3.5 h-3.5" />
            </ActionBtn>

            <ActionBtn
              tooltip="Talebi Düzenle"
              onClick={() => openInTab(false)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </ActionBtn>
          </div>
        );
      },
    },
    {
      accessor: "ticketNumber",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.TalepNo"),
      className: "w-28",
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="ticketNumber" testRow={row.original} />
      ),
    },
    {
      accessor: "statusText",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Durum"),
      className: "w-32",
      cell: ({ row, value }) => (
        <GlobalCell value={value} statusId={row.original.status} columnName="statusText" testRow={row.original} />
      ),
    },
    {
      accessor: "title",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Baslik"),
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="title" testRow={row.original} />
      ),
    },
    {
      accessor: "customerRefName",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Musteri"),
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="customerRefName" testRow={row.original} />
      ),
    },
    {
      accessor: "ticketAssigneText",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Atanan"),
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="ticketAssigneText" testRow={row.original} />
      ),
    },
    {
      accessor: "userAppName",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Olusturan"),
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="userAppName" testRow={row.original} />
      ),
    },
    {
      accessor: "createdDate",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih"),
      className: "w-40",
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="createdDate" testRow={row.original} />
      ),
    },
    {
      accessor: "ticketDepartmentText",
      header: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Departman"),
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="ticketDepartmentText" testRow={row.original} />
      ),
    },
    {
      accessor: "ticketprojectName",
      header: "Proje",
      cell: ({ row, value }) => (
        <GlobalCell value={value} columnName="ticketprojectName" testRow={row.original} />
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <TooltipProvider delayDuration={150}>
        <main className="px-4 md:px-6 py-6 flex flex-col gap-5 min-h-[calc(100vh-6rem)]">

          {/* ── Page Header ── */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                {t("ns1:TicketPage.TicketTablePage.TicketTitle2")}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {t("ns1:TicketPage.TicketTablePage.TicketSubTitle2")}
              </p>
            </div>
          </header>

          {/* ── Content Card ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">

            {/* Filter Section */}
            <div className="border-b border-slate-100">
              <FilterTableMethod
                ticketRowData={ticketRowData}
                setFilteredData={setTicketRowData}
                handleSearch={handleFilterData}
                pageDesc="solveAllTicket"
                isSolveAllTicket={true}
                isrefresh={isRefresh}
                setisrefresh={setIsRefresh}
                skip={itemOffset}
                top={itemsPerPage}
                setPageCount={setPageCount}
                setTotalCount={setTotalListCount}
                createGraph={createGraph}
                setcreateGraph={setCreateGraph}
                setgraphicData={setGraphicData}
                onlyAll={onlyAllTicket}
                fromDashboard={{
                  workCompanyId: workCompanyId || "",
                  workCompanyName: workCompanyName || "",
                  projectId: projectId || "",
                  projectName: projectName || "",
                  projectSubName: projectSubName || "",
                }}
              />
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "table" | "chart")}
              className="flex flex-col flex-1"
            >
              <div className="flex items-center justify-between px-4 my-2">
                <TabsList
                  variant="line"
                  aria-label="Görünüm seçenekleri"
                  className="gap-0 bg-transparent -mb-px rounded-none h-auto"
                >
                  {([
                    { value: "table", icon: LayoutList, label: t("ns1:TicketPage.TicketTablePage.Talepler") },
                    { value: "chart", icon: BarChart2, label: t("ns1:TicketPage.TicketTablePage.Grafik") },
                  ] as const).map(({ value, icon: Icon, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 rounded-none transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-0",
                        "data-[state=active]:text-[#3e5d8f] data-[state=active]:bg-transparent",
                        "data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500",
                        "data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:border-slate-200"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {activeTab === "table" && (
                  <PageSizeSelect value={itemsPerPage} onChange={handleItemsPerPageChange} />
                )}
              </div>

              {/* Table Tab */}
              <TabsContent value="table" className="flex-1 mt-0">
                <TicketTable columns={columns} rows={ticketRowData} />

                {ticketRowData.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <Pagination
                      pageCount={pageCount}
                      currentPage={currentPage}
                      onPageChange={handlePageClick}
                      totalCount={totalListCount}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Chart Tab */}
              <TabsContent value="chart" className="mt-0 p-4">
                <TicketGraphic
                  pageDesc="solveAllTicket"
                  createGraphic={setCreateGraph}
                  ticketsData={graphicData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </TooltipProvider>

      

      {/* ── History Dialogs ── */}
      {historyDialogOpen && (
        <HistoryDialog
          ticketId={selectedTicket}
          isOpen={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
        />
      )}

      {aprHistoryOpen && (
        <ShowHistory
          approveId={selectedAprHis}
          open={aprHistoryOpen}
          onClose={() => setAprHistoryOpen(false)}
        />
      )}

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={msgOpen} onOpenChange={setMsgOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="text-rose-500" />
            </AlertDialogMedia>
            <AlertDialogTitle>Talebi sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu talep kalıcı olarak silinecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => handleDelete(selectedTicket)}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default SolveAllTicket;
