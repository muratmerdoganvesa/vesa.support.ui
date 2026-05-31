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
import { Button } from "components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusy } from "../hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "../hooks/useAlert";
import getConfiguration from "confiuration";
import { WorkCompanySystemInfoApi, WorkCompanySystemInfoListDto } from "api/generated/api";
import GlobalCell from "../talepYonetimi/allTickets/tableData/globalCell";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "lib/utils";

const PAGE_SIZE = 10;

const getWorkCompanyName = (row: WorkCompanySystemInfoListDto) =>
  row.workCompany?.name ?? "";

function WorkCompanySystem() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [dataTableData, setDataTableData] = useState<WorkCompanySystemInfoListDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState<boolean>(false);
  const { t } = useTranslation();

  const navigate = useNavigate();

  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pageIndex, setPageIndex] = useState(0);

  const TABLE_COLUMNS_META = [
    {
      id: "name",
      label: t("ns1:CompanySystemPage.SystemList.SistemAdi"),
      sortable: true as const,
    },
    {
      id: "workCompanyName",
      label: t("ns1:CompanySystemPage.SystemList.SirketAdi"),
      sortable: true as const,
    },
    {
      id: "actions",
      label: t("ns1:CompanySystemPage.SystemList.Islemler"),
      sortable: false as const,
    },
  ];

  const fetchData = async () => {
    dispatchBusy({ isBusy: true });
    var conf = getConfiguration();
    var api = new WorkCompanySystemInfoApi(conf);
    var response = await api.apiWorkCompanySystemInfoGet();
    console.log("response", response.data);
    setDataTableData(response.data ?? []);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenQuestionBox = (id: string) => {
    setSelectedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes") {
      handleDelete(selectedId);
    }
    if (action === "No") {
      alert("silinme işlemi iptal edildi");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanySystemInfoApi(conf);
      await api.apiWorkCompanySystemInfoIdDelete(id);
      fetchData();

      dispatchAlert({
        message: t("ns1:CompanySystemPage.SystemList.SistemSilindi"),
        type: "Success",
      });
    } catch (error) {
      dispatchAlert({
        message: t("ns1:CompanySystemPage.SystemList.SistemSilmeHata"),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleColumnSortToggle = (columnId: string, sortable?: boolean) => {
    if (!sortable) return;
    setPageIndex(0);
    if (sortKey !== columnId) {
      setSortKey(columnId);
      setSortDirection("asc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const orderedRows = useMemo(() => {
    let rows = [...dataTableData];

    const q = filterQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) => {
        const blob = `${row.name ?? ""} ${getWorkCompanyName(row)}`.toLowerCase();
        return blob.includes(q);
      });
    }

    if (!sortKey) return rows;

    const dir = sortDirection === "asc" ? 1 : -1;

    return [...rows].sort((aRow, bRow) => {
      let aVal: string;
      let bVal: string;
      if (sortKey === "workCompanyName") {
        aVal = getWorkCompanyName(aRow);
        bVal = getWorkCompanyName(bRow);
      } else if (sortKey === "name") {
        aVal = aRow.name ?? "";
        bVal = bRow.name ?? "";
      } else {
        return 0;
      }
      return String(aVal).localeCompare(String(bVal), "tr") * dir;
    });
  }, [dataTableData, filterQuery, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(orderedRows.length / PAGE_SIZE));
  const effectivePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageSlice = orderedRows.slice(
    effectivePageIndex * PAGE_SIZE,
    effectivePageIndex * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="relative -mt-4 min-h-0 rounded-xl border border-border/60 bg-card shadow-[0_2px_12px_0_rgb(0_0_0/0.1)] ring-1 ring-foreground/6">
        <div className="border-b border-border/60 px-6 pt-6 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <header className="min-w-0 space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-[#344767] dark:text-slate-100 md:text-xl">
                {t("ns1:CompanySystemPage.SystemList.SystemTitle")}
              </h1>
              <p className="max-w-xl text-sm text-[#7b809a] dark:text-slate-400">
                {t("ns1:CompanySystemPage.SystemList.SystemSubTitle")}
              </p>
            </header>
            <div className="shrink-0 md:mt-1">
              <Button
                type="button"
                onClick={() => navigate(`/workCompanySystem/detail`)}
                className="h-9 shadow-sm transition-transform hover:-translate-y-px"
              >
                <Plus className="size-4" aria-hidden />
                {t("ns1:CompanySystemPage.SystemList.YeniSistem")}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 pt-5">
          <Card className="gap-3 border border-border/60 py-4 shadow-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 pb-4 [.border-b]:pb-4">
              <div className="grid min-w-0 gap-0.5">
                <CardTitle className="text-base">
                  {t("ns1:CompanySystemPage.SystemList.SystemTitle")}
                </CardTitle>
                <CardDescription>{t("ns1:CompanySystemPage.SystemList.SystemSubTitle")}</CardDescription>
              </div>
              <CardAction className="justify-self-start sm:justify-self-end">
                <div className="relative w-full min-w-[200px] max-w-xs sm:w-72">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder="Sistem veya şirket adına göre ara…"
                    aria-label="Tablo üzerinde ara"
                    value={filterQuery}
                    className="h-9 rounded-lg bg-background pl-9"
                    onChange={(e) => {
                      setFilterQuery(e.target.value);
                      setPageIndex(0);
                    }}
                  />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0 pb-4 pt-0">
              <div className="min-h-[440px] max-h-[calc(100vh-16rem)] overflow-auto px-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {TABLE_COLUMNS_META.map((col) => {
                        const isSorted = !!(col.id !== "actions" && sortKey === col.id);
                        const AscIcon = ArrowUp;
                        const DescIcon = ArrowDown;

                        return (
                          <TableHead
                            key={col.id}
                            scope="col"
                            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {col.sortable ? (
                              <button
                                type="button"
                                className={cn(
                                  "inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55",
                                )}
                                aria-sort={
                                  isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
                                }
                                aria-label={`${col.label} sütununu sırala`}
                                onClick={() => handleColumnSortToggle(col.id, col.sortable)}
                              >
                                <span>{col.label}</span>
                                {isSorted ? (
                                  sortDirection === "asc" ? (
                                    <AscIcon className="size-3.5 text-foreground" aria-hidden />
                                  ) : (
                                    <DescIcon className="size-3.5 text-foreground" aria-hidden />
                                  )
                                ) : null}
                              </button>
                            ) : (
                              <span className="inline-flex px-px font-semibold uppercase tracking-wide text-muted-foreground">
                                {col.label}
                              </span>
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageSlice.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 whitespace-normal text-center text-sm text-muted-foreground"
                        >
                          Kayıt bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageSlice.map((row) => (
                        <TableRow key={String(row.id)} className="text-sm">
                          <TableCell className="whitespace-normal align-middle font-medium text-foreground">
                            <GlobalCell
                              value={row.name ?? ""}
                              columnName="name"
                              testRow={row as any}
                            />
                          </TableCell>
                          <TableCell className="whitespace-normal align-middle">
                            <GlobalCell
                              value={getWorkCompanyName(row)}
                              columnName="workCompany.name"
                              testRow={row as any}
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex flex-wrap items-center gap-1 pr-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Düzenle"
                                onClick={() =>
                                  navigate(`/workCompanySystem/detail/${String(row.id)}`)
                                }
                              >
                                <Pencil className="size-4 shrink-0" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Sil"
                                onClick={() =>
                                  row.id != null && handleOpenQuestionBox(String(row.id))
                                }
                              >
                                <Trash2 className="size-4 shrink-0" aria-hidden />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <div className="flex flex-col gap-3 border-t border-border/50 px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Toplam <span className="font-medium text-foreground">{orderedRows.length}</span> kayıt · Sayfa{" "}
                <span className="font-medium text-foreground">{effectivePageIndex + 1}</span> /{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 px-3"
                  disabled={effectivePageIndex <= 0}
                  aria-label="Önceki sayfa"
                  onClick={() =>
                    setPageIndex((prev) => Math.min(Math.max(prev - 1, 0), totalPages - 1))
                  }
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  Önceki
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 px-3"
                  disabled={effectivePageIndex >= totalPages - 1}
                  aria-label="Sonraki sayfa"
                  onClick={() =>
                    setPageIndex((prev) =>
                      Math.min(Math.max(prev + 1, 0), Math.max(totalPages - 1, 0)),
                    )
                  }
                >
                  Sonraki
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <AlertDialog open={isQuestionMessageBoxOpen} onOpenChange={setIsQuestionMessageBoxOpen}>
        <AlertDialogContent className="gap-4 sm:max-w-md">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Kayıt Silinecektir</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel type="button" onClick={() => handleCloseQuestionBox("Cancel")}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => handleCloseQuestionBox("Yes")}
            >
              Evet, sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default WorkCompanySystem;
