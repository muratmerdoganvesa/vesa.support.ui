import {
  WorkCompanyTicketMatrisApi,
  WorkCompanyTicketMatrisListDto,
} from "api/generated/api";
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
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { ScrollArea } from "components/ui/scroll-area";
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
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { cn } from "lib/utils";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type RelationRow = {
  id: string;
  companyName: string;
  toCompanyNames: string[];
};

type FeedbackState =
  | { open: false }
  | { open: true; title: string; message: string };

function RelationsCell({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  if (names.length <= 3) {
    return (
      <span className="text-sm leading-relaxed text-foreground/90">{names.join(", ")}</span>
    );
  }

  const firstThree = names.slice(0, 3).join(", ");
  const remaining = names.slice(3);

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1 gap-y-1.5 text-sm leading-relaxed">
      <span className="text-foreground/90">{firstThree}, </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="cursor-default border-primary/20 bg-primary/5 font-medium text-primary hover:bg-primary/10"
          >
            +{names.length - 3}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs flex flex-col gap-1">
          {remaining.map((name, index) => (
            <span key={`${name}-${index}`}>{name}</span>
          ))}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function CompanyRelation() {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();

  const [rows, setRows] = useState<RelationRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({ open: false });

  const dismissFeedback = useCallback(() => {
    setFeedback({ open: false });
  }, []);

  const openFeedback = useCallback((message: string, variant: "success" | "error") => {
    setFeedback({
      open: true,
      title: variant === "success" ? "İşlem başarılı" : "Hata",
      message,
    });
  }, []);

  const mapDtoToRows = useCallback((items: WorkCompanyTicketMatrisListDto[]): RelationRow[] =>
    items.map((item) => ({
      id: item.id ?? "",
      companyName: item.fromCompany?.name ?? "-",
      toCompanyNames: (item.toCompanies ?? [])
        .map((c) => c.name)
        .filter((n): n is string => n != null && String(n).length > 0),
    })),
  []);

  const fetchTableData = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WorkCompanyTicketMatrisApi(conf);
      const response = await api.apiWorkCompanyTicketMatrisGet();
      setRows(mapDtoToRows(response.data));
    } catch {
      openFeedback("Hata Oluştu", "error");
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchBusy, mapDtoToRows, openFeedback]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const inCompany = row.companyName.toLowerCase().includes(q);
      const inRelations = row.toCompanyNames.some((n) => n.toLowerCase().includes(q));
      return inCompany || inRelations;
    });
  }, [rows, searchQuery]);

  const handleConfirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);
    if (!id) return;

    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WorkCompanyTicketMatrisApi(conf);
      await api.apiWorkCompanyTicketMatrisIdDelete(id);
      openFeedback("Şirket ilişkisi silindi.", "success");
      await fetchTableData();
    } catch {
      openFeedback("Hata Oluştu", "error");
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <DashboardLayout>
        <DashboardNavbar />

        <div className="mx-4 mt-[-15px] mb-4 rounded-xl bg-card px-1 pb-4 shadow-md ring-1 ring-border/60">
          <div className="flex flex-col gap-4 px-4 pt-6 pb-2 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight text-[#344767] dark:text-foreground">
                Şirket İlişkileri
              </h1>
              <p className="text-sm text-[#7b809a] dark:text-muted-foreground">
                Şirket İlişkileri
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 transition-transform hover:-translate-y-px"
              onClick={() => navigate("/companyRelation/detail")}
            >
              <Plus className="mr-2 size-4" aria-hidden />
              Yeni Şirket İlişkisi
            </Button>
          </div>

          <Card className="mx-0 border-0 bg-transparent shadow-none ring-0">
            <CardContent className="px-3 pb-5 pt-0 sm:px-4">
              <div className="relative mb-5 max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Şirket veya ilişki ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl border-border/80 bg-background pl-10 shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/80 focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-primary/15"
                  aria-label="Tabloda ara"
                />
              </div>

              <Card className="overflow-hidden bg-card shadow-md ">
                <ScrollArea className="h-[min(655px,calc(100vh-280px))]">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="">
                        <TableHead className="sticky top-0 z-10 min-w-[180px] bg-muted/95 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm supports-backdrop-filter:bg-muted/80">
                          Şirket
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 min-w-[260px] bg-muted/95 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm supports-backdrop-filter:bg-muted/80">
                          İlişkili Şirketler
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 w-[132px] bg-muted/95 px-4 py-3.5 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm supports-backdrop-filter:bg-muted/80">
                          İşlemler
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.length === 0 ? (
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell
                            colSpan={3}
                            className="h-36 bg-muted/15 text-center align-middle text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center gap-1 py-10">
                              <span className="text-sm font-medium">Kayıt bulunamadı</span>
                              <span className="max-w-xs text-xs text-muted-foreground/90">
                                Arama terimini değiştirmeyi veya filtreyi temizlemeyi deneyin.
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRows.map((row, index) => (
                          <TableRow
                            key={row.id}
                            className={cn(
                              "group border-border/50 transition-colors",
                              index % 2 === 0 ? "bg-background" : "bg-muted/25",
                              "hover:bg-primary/4 dark:hover:bg-accent/40",
                            )}
                          >
                            <TableCell className="align-middle px-4 py-3.5">
                              <div className="flex items-start gap-3">
                              
                                <span className="pt-0.5 text-sm font-semibold leading-snug text-foreground">
                                  {row.companyName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xl align-middle px-4 py-3.5">
                              <RelationsCell names={row.toCompanyNames} />
                            </TableCell>
                            <TableCell className="text-end align-middle px-4 py-3.5">
                              <div className="flex items-center justify-end gap-0.5 opacity-90 transition-opacity group-hover:opacity-100">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                  aria-label="Düzenle"
                                  onClick={() => navigate(`/companyRelation/detail/${row.id}`)}
                                >
                                  <Pencil className="size-[18px]" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label="Sil"
                                  onClick={() => setDeleteTargetId(row.id)}
                                >
                                  <Trash2 className="size-[18px]" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </CardContent>
          </Card>
        </div>

        <AlertDialog
          open={deleteTargetId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTargetId(null);
          }}
        >
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader className="sm:text-left">
              <AlertDialogTitle>Kayıt Silinecektir</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:flex-row sm:justify-end">
              <AlertDialogCancel type="button">İptal</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  void handleConfirmDelete();
                }}
              >
                Evet
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={feedback.open}
          onOpenChange={(open) => {
            if (!open) dismissFeedback();
          }}
        >
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader className="sm:text-left">
              <AlertDialogTitle>{feedback.open ? feedback.title : ""}</AlertDialogTitle>
              <AlertDialogDescription>
                {feedback.open ? feedback.message : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:flex-row sm:justify-end">
              <AlertDialogAction type="button" onClick={dismissFeedback}>
                Tamam
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </TooltipProvider>
  );
}

export default CompanyRelation;
