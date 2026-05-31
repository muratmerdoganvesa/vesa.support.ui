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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
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
import { FormDataApi } from "api/generated";
import { cn } from "lib/utils";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import GlobalCell from "layouts/pages/talepYonetimi/allTickets/tableData/globalCell";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import {
  ArrowDown,
  ArrowUp,
  Database,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;

/** Stable column defs for header/body rendering and client-side sort paths. */
const LIST_FORM_COLUMNS = [
  {
    id: "formName",
    name: "Form Adı",
    accessor: "formName",

    sortable: true,
  },
  {
    id: "createdAt",
    name: "Oluşturulma Tarihi",
    accessor: "createdDate",

    sortable: true,
  },
  {
    id: "isActive",
    name: "Durum",
    accessor: "isActive",

    sortable: true,
  },
  {
    id: "revision",
    name: "Revizyon",
    accessor: "revision",
  },
  {
    accessor: "actions",
    name: "İşlemler",
    sortable: false,
  },
] as const;

function ListForm() {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [dataTableData, setDataTableData] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);

  /** View-only table UI state (replaces legacy DataTable local state). */
  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pageIndex, setPageIndex] = useState(0);

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormDataApi(conf);
      var data = await api.apiFormDataGet();
      console.log("formList>>", data.data);
      setDataTableData(data.data);
    } catch (error) {
      dispatchAlert({
        message: "Bir hata oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
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
      var api = new FormDataApi(conf);
      await api.apiFormDataIdDelete(id);
      fetchData();
      dispatchAlert({
        message: "Form başarıyla silindi",
        type: "Success",
      });
    } catch (error) {
      dispatchAlert({
        message: "Bir hata oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handlePreview = (id: string) => {
    navigate("/parameters/view/" + id);

  };
  const handleData = (id: string) => {
    navigate("/formList/" + id);

  };

  const columns = LIST_FORM_COLUMNS;

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
    const trimmed = filterQuery.trim().toLowerCase();
    let rows: any[] = Array.isArray(dataTableData) ? [...dataTableData] : [];

    if (trimmed) {
      rows = rows.filter((row) => {
        const blob = `${row.formName ?? ""} ${row.createdDate ?? ""} ${row.revision ?? ""} ${row.isActive ?? ""}`
          .toLowerCase();
        return blob.includes(trimmed);
      });
    }

    if (!sortKey) {
      return rows;
    }

    const col = LIST_FORM_COLUMNS.find((c) => "id" in c && (c as { id: string }).id === sortKey);
    if (!col?.accessor || col.accessor === "actions") {
      return rows;
    }

    const accessorKey = String(col.accessor);
    const dir = sortDirection === "asc" ? 1 : -1;

    return [...rows].sort((aRow, bRow) => {
      let aVal = aRow[accessorKey];
      let bVal = bRow[accessorKey];

      if (sortKey === "isActive") {
        aVal = aVal == 1 ? 1 : 0;
        bVal = bVal == 1 ? 1 : 0;
      } else if (sortKey === "createdAt") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (sortKey === "revision") {
        const an = Number(aVal);
        const bn = Number(bVal);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) {
          return an === bn ? 0 : an < bn ? -dir : dir;
        }
        return String(aVal ?? "").localeCompare(String(bVal ?? ""), "tr") * dir;
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return -1 * dir;
      if (bVal == null) return 1 * dir;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal === bVal ? 0 : aVal < bVal ? -dir : dir;
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
                Form Tasarımı
              </h1>
              <p className="max-w-xl text-sm text-[#7b809a] dark:text-slate-400">
                Formları görüntüleyin, oluşturun ve dahası
              </p>
            </header>
            <div className="shrink-0 md:mt-1">
              <Button
                type="button"
                onClick={() => navigate(`/parameters/detail`)}
                className="h-9 shadow-sm transition-transform hover:-translate-y-px"
              >
                <Plus className="size-4" aria-hidden />
                Yeni Parametre
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 pt-5">
          <Card className="gap-3 border border-border/60 py-4 shadow-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 pb-4 [.border-b]:pb-4">
              <div className="grid min-w-0 gap-0.5">
                <CardTitle className="text-base">Form listesi</CardTitle>
                <CardDescription>Arama, sıralama ve sayfa gezinme</CardDescription>
              </div>
              <CardAction className="justify-self-start sm:justify-self-end">
                <div className="relative w-full min-w-[200px] max-w-xs sm:w-72">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    aria-label="Tabloda ara"
                    placeholder="Form adına göre ara…"
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
              <div className="min-h-[520px] max-h-[calc(100vh-16rem)] overflow-auto px-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {columns.map((col) => {
                        const meta = col as { id?: string; sortable?: boolean; name?: string; accessor?: string };
                        const cid = meta.id ?? (meta.accessor === "actions" ? "actions" : undefined);
                        const isSorted = !!(cid && sortKey === cid);
                        const AscIcon = ArrowUp;
                        const DescIcon = ArrowDown;
                        return (
                          <TableHead key={`${cid ?? meta.accessor}`} scope="col" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <div className={cn(meta.sortable !== false && meta.accessor !== "actions" && "flex items-center gap-1")}>
                              {meta.accessor !== "actions" ? (
                                <button
                                  type="button"
                                  className={cn(
                                    meta.sortable === false &&
                                      "-mx-px inline-flex cursor-default items-center px-px font-semibold uppercase tracking-wide text-muted-foreground",
                                    meta.sortable !== false &&
                                      "inline-flex cursor-pointer items-center rounded-md px-1 py-0.5 font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55",
                                  )}
                                  onClick={() =>
                                    cid ? handleColumnSortToggle(cid, meta.sortable !== false) : undefined
                                  }
                                  disabled={meta.sortable === false}
                                  aria-sort={
                                    meta.sortable === false || !cid
                                      ? undefined
                                      : isSorted
                                        ? sortDirection === "asc"
                                          ? "ascending"
                                          : "descending"
                                        : "none"
                                  }
                                  aria-label={`${meta.name ?? ""}${meta.sortable !== false ? " sütununu sırala" : ""}`}
                                >
                                  <span>{meta.name}</span>
                                  {meta.sortable !== false && cid && isSorted ? (
                                    sortDirection === "asc" ? (
                                      <AscIcon className="size-3.5 shrink-0 text-foreground opacity-90" aria-hidden />
                                    ) : (
                                      <DescIcon className="size-3.5 shrink-0 text-foreground opacity-90" aria-hidden />
                                    )
                                  ) : null}
                                </button>
                              ) : (
                                <span className="inline-flex px-px font-semibold uppercase tracking-wide text-muted-foreground">
                                  {meta.name}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageSlice.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 whitespace-normal text-center text-sm text-muted-foreground">
                          Kayıt bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageSlice.map((row) => (
                        <TableRow key={String(row.id)} className="text-sm">
                          <TableCell className="whitespace-normal align-middle font-medium text-foreground">
                            <GlobalCell value={row.formName} columnName="formName" testRow={row} />
                          </TableCell>
                          <TableCell className="whitespace-normal align-middle">
                            <GlobalCell value={row.createdDate} columnName="createdAt" />
                          </TableCell>
                          <TableCell className="align-middle">
                            <GlobalCell
                              value={row.isActive == 1 ? true : false}
                              columnName="isActive"
                              testRow={row}
                            />
                          </TableCell>
                          <TableCell className="align-middle">
                            <GlobalCell value={row.revision} columnName="revision" testRow={row} />
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex flex-wrap items-center gap-1 pr-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Sil"
                                onClick={() => handleOpenQuestionBox(String(row.id))}
                              >
                                <Trash2 className="size-4 shrink-0" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                aria-label="Veri görüntüle"
                                onClick={() => handleData(row.original?.id ?? row.id)}
                              >
                                <Database className="size-4 shrink-0" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                aria-label="Önizleme"
                                onClick={() => handlePreview(String(row.id))}
                              >
                                <Eye className="size-4 shrink-0" aria-hidden />
                              </Button>
                              {row.canEdit ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-accent"
                                  aria-label="Düzenle"
                                  onClick={() => navigate(`/parameters/detail/${String(row.id)}`)}
                                >
                                  <Pencil className="size-4 shrink-0" aria-hidden />
                                </Button>
                              ) : null}
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
                Toplam{" "}
                <span className="font-medium text-foreground">{orderedRows.length}</span>
                {" "}kayıt · Sayfa{" "}
                <span className="font-medium text-foreground">{effectivePageIndex + 1}</span>
                {" "}/{" "}
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
            <AlertDialogCancel
              type="button"
              onClick={() => handleCloseQuestionBox("Cancel")}
            >
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

export default ListForm;
