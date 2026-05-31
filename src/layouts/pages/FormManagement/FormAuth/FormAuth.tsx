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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import getConfiguration from "confiuration";
import { FormAuthApi } from "api/generated/api";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";

const PAGE_SIZE = 10;

type FormAuthRow = {
  id: string;
  form: string;
  usersNames: string[];
};

const FormAuthRelationsCell = ({ usersNames }: { usersNames: string[] }) => {
  if (usersNames.length <= 3) {
    return <span className="whitespace-normal text-sm leading-relaxed">{usersNames.join(", ")}</span>;
  }

  const firstThree = usersNames.slice(0, 3).join(", ");
  const rest = usersNames.slice(3);

  return (
    <span className="inline-flex max-w-md flex-wrap items-baseline gap-1 text-sm leading-relaxed">
      <span>{firstThree},</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex rounded-md border border-border/60 bg-muted/80 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`${rest.length} kişi daha. Ayrıntı için üzerine gelin.`}
          >
            +{usersNames.length - 3}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-1200 max-w-xs p-2">
          <ul className="max-h-48 list-none space-y-1 overflow-y-auto text-left text-xs">
            {rest.map((name, index) => (
              <li key={`${name}-${index}`}>{name}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </span>
  );
};

function FormAuth() {
  const navigate = useNavigate();

  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [data, setData] = useState<FormAuthRow[]>([]);
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  const [filterQuery, setFilterQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new FormAuthApi(conf);
      const response = await api.apiFormAuthGet();

      const mappedData: FormAuthRow[] = response.data.map((item) => {
        const fromForm = item.form?.formName || "-";
        const usersObjects = item.users || [];
        const usersNames = usersObjects.map((user) => user.userName);

        return {
          id: String(item.id),
          form: `${fromForm} - Rev:${item.form?.revision}`,
          usersNames,
        };
      });

      setData(mappedData);
    } catch (error) {
      dispatchAlert({
        message: "Hata Oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleOpenQuestionBox = (id: string) => {
    setSelectedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes") {
      handleDelete(selectedId);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormAuthApi(conf);
      await api.apiFormAuthIdDelete(id);
      dispatchAlert({
        message: "Form yetkisi silindi.",
        type: "Success",
      });
      fetchTableData();
      dispatchBusy({ isBusy: false });
    } catch (error) {
      console.log(error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const orderedRows = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    let rows = [...data];
    if (q) {
      rows = rows.filter((row) => {
        const blob = `${row.form} ${row.usersNames.join(" ")}`.toLowerCase();
        return blob.includes(q);
      });
    }
    return rows;
  }, [data, filterQuery]);

  const totalPages = Math.max(1, Math.ceil(orderedRows.length / PAGE_SIZE));
  const effectivePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageSlice = orderedRows.slice(
    effectivePageIndex * PAGE_SIZE,
    effectivePageIndex * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <TooltipProvider delayDuration={200}>
        <main className="relative -mt-4 min-h-0 rounded-xl border border-border/60 bg-card shadow-[0_2px_12px_0_rgb(0_0_0/0.1)] ring-1 ring-foreground/6">
          <div className="border-b border-border/60 px-6 pt-6 pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <header className="min-w-0 space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-[#344767] dark:text-slate-100 md:text-xl">
                  Form Yetkileri
                </h1>
                <p className="max-w-xl text-sm text-[#7b809a] dark:text-slate-400">Form Yetkileri</p>
              </header>
              <div className="shrink-0 md:mt-1">
                <Button
                  type="button"
                  onClick={() => navigate(`/formAuth/detail`)}
                  className="h-9 shadow-sm transition-transform hover:-translate-y-px"
                >
                  <Plus className="size-4" aria-hidden />
                  Yeni Form Yetkisi
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 pt-5">
            <Card className="gap-3 border border-border/60 py-4 shadow-none">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 pb-4 [.border-b]:pb-4">
                <div className="grid min-w-0 gap-0.5">
                  <CardTitle className="text-base">Form yetki listesi</CardTitle>
                  <CardDescription>Arama ve sayfa gezinme</CardDescription>
                </div>
                <CardAction className="justify-self-start sm:justify-self-end">
                  <div className="relative w-full min-w-[200px] max-w-xs sm:w-72">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      aria-label="Tabloda ara"
                      placeholder="Form veya kişiye göre ara…"
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
                <div className="min-h-[400px] max-h-[calc(100vh-16rem)] overflow-auto px-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Form
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Kişiler
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          İşlemler
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageSlice.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                            Kayıt bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        pageSlice.map((row) => (
                          <TableRow key={row.id} className="text-sm">
                            <TableCell className="align-middle font-medium whitespace-normal text-foreground">
                              {row.form}
                            </TableCell>
                            <TableCell className="align-middle whitespace-normal">
                              <FormAuthRelationsCell usersNames={row.usersNames} />
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex flex-wrap items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label="Düzenle"
                                  onClick={() => navigate(`/formAuth/detail/${row.id}`)}
                                >
                                  <Pencil className="size-4 shrink-0" aria-hidden />
                                </Button>
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
      </TooltipProvider>
    </DashboardLayout>
  );
}

export default FormAuth;
