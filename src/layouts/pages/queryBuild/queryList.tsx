import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { fetchTicketRuleEngineData } from "./controller/custom/apiCalls";
import { TicketRuleEngineListDto } from "api/generated/api";
import { useAlert, AppAlertType as MessageBoxType } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Pencil,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const PAGE_SIZE = 12;

function QueryList() {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const { t } = useTranslation();

  const [queryList, setQueryList] = useState<TicketRuleEngineListDto[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const fetchQueryList = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = await fetchTicketRuleEngineData();
      const response = await api.apiTicketRuleEngineAllGet();
      setQueryList(response.data);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => { fetchQueryList(); }, []);

  const handleOpenDelete = (id: string) => {
    setSelectedQueryId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    try {
      dispatchBusy({ isBusy: true });
      const api = await fetchTicketRuleEngineData();
      await api.apiTicketRuleEngineIdDelete(selectedQueryId);
      dispatchAlert({ message: t("ns1:QueryPage.QueryList.SorguSilindi"), type: "Success" });
      setSelectedQueryId(null);
      fetchQueryList();
    } catch {
      dispatchAlert({ message: t("ns1:QueryPage.QueryList.SorguSilmeHata"), type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // Filter + search
  const filtered = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return queryList;
    return queryList.filter((item) =>
      String(item.ruleName ?? "").toLowerCase().includes(q) ||
      String(item.order ?? "").toLowerCase().includes(q),
    );
  }, [queryList, tableSearch]);

  useEffect(() => { setPageIndex(0); }, [tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(pageIndex, totalPages - 1);
  const pageSlice  = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="w-full px-3 pb-10">
        {/* ── Page header ── */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
              <Database className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {t("ns1:QueryPage.QueryList.QueryTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("ns1:QueryPage.QueryList.QuerySubTitle")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            id="btn-yeni-sorgu"
            className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md hover:from-violet-600 hover:to-indigo-700"
            onClick={() => navigate("/queryBuild/detail")}
          >
            <Plus className="size-4 shrink-0" />
            {t("ns1:QueryPage.QueryList.YeniSorgu")}
          </Button>
        </div>

        {/* ── Table card ── */}
        <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
          {/* Search bar */}
          <CardHeader className="border-b border-border/40 bg-muted/10 px-5 py-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="query-search"
                className="h-9 pl-9"
                placeholder={`${t("ns1:QueryPage.QueryList.SorguAdi")} ara…`}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("ns1:QueryPage.QueryList.SorguAdi")}
                    </TableHead>
                    <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("ns1:QueryPage.QueryList.SorguSirasi")}
                    </TableHead>
                    <TableHead className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("ns1:QueryPage.QueryList.Islemler")}
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pageSlice.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-16 text-center">
                        <Database className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">Kayıt bulunamadı.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageSlice.map((row) => (
                      <TableRow
                        key={row.id}
                        className="group border-border/30 transition-colors hover:bg-muted/20"
                      >
                        <TableCell className="py-3 align-middle text-sm font-medium text-foreground">
                          {row.ruleName ?? "—"}
                        </TableCell>
                        <TableCell className="py-3 align-middle">
                          <span className="inline-flex size-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {row.order ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              id={`btn-edit-${row.id}`}
                              className="h-8 gap-1.5 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
                              onClick={() => navigate(`/queryBuild/detail/${row.id}`)}
                            >
                              <Pencil className="size-3.5" />
                              Düzenle
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              id={`btn-delete-${row.id}`}
                              className="h-8 gap-1.5 px-3 text-xs font-semibold text-rose-600 opacity-0 hover:bg-rose-50 hover:text-rose-700 group-hover:opacity-100 dark:text-rose-400 dark:hover:bg-rose-950 transition-opacity"
                              onClick={() => handleOpenDelete(row.id)}
                            >
                              <Trash2 className="size-3.5" />
                              Sil
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border/40 bg-muted/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span> kayıt
                {filtered.length > 0 && (
                  <> · Sayfa <span className="font-semibold text-foreground tabular-nums">{safePage + 1}</span> / <span className="tabular-nums">{totalPages}</span></>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={safePage <= 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="size-3.5" /> Önceki
                </Button>
                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = totalPages <= 5 ? i : Math.max(0, Math.min(safePage - 2, totalPages - 5)) + i;
                    return (
                      <button key={page} type="button" onClick={() => setPageIndex(page)}
                        className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${page === safePage ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                        {page + 1}
                      </button>
                    );
                  })}
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={safePage >= totalPages - 1} onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}>
                  Sonraki <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <AlertDialogTitle>{t("ns1:QueryPage.QueryList.Uyari")}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {t("ns1:QueryPage.QueryList.SorguSilmeUyari")}
            </AlertDialogDescription>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
              {t("ns1:QueryPage.QueryList.SorguSilmeGeriAlinamaz")}
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="mr-2 size-4" />
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default QueryList;
