import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil, Trash2, Building2, Search,
  ChevronLeft, ChevronRight, ChevronDown, X, Download,
} from "lucide-react";

import { TicketProjectsApi, TicketProjectsListDto, WorkCompanyApi, WorkCompanyDto } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import MessageBox from "layouts/pages/Components/MessageBox";
import { getProjectStatusLabel } from "layouts/pages/ticketProjects/projectTypeHelpers";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { downloadTicketProjectsExcel } from "layouts/pages/ticketProjects/api/fetchTicketProjectsExcel";

const ROWS_PER_PAGE = 10;

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const TicketProjectsListTab = () => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();

  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [projectsData, setProjectsData] = useState<TicketProjectsListDto[]>([]);
  const [workCompanyData, setWorkCompanyData] = useState<WorkCompanyDto[]>([]);
  const [selectedWorkCompanyId, setSelectedWorkCompanyId] = useState<string>("");
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = projectsData.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.name?.toLowerCase().includes(q) ||
      row.subProjectName?.toLowerCase().includes(q) ||
      row.workCompany?.name?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const fetchProjectsData = async (companyId?: string) => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsGet(companyId);
      setProjectsData(data.data);
      setPage(1);
    } catch {
      dispatchAlert({ message: "Projeler getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchCompanyData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WorkCompanyApi(conf);
      const data = await api.apiWorkCompanyGetAssingListGet();
      setWorkCompanyData(data.data);
    } catch {
      dispatchAlert({ message: "Veriler getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchProjectsData();
    fetchCompanyData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      await api.apiTicketProjectsDelete(id);
      dispatchAlert({ message: "Proje Silindi", type: "Success" });
      fetchProjectsData(selectedWorkCompanyId || undefined);
    } catch (error) {
      console.log(error);
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
    if (action === "Yes") handleDelete(selectedId);
  };

  const handleWorkCompanyChange = (value: string) => {
    setSelectedWorkCompanyId(value);
    const company = workCompanyData.find((c) => c.id === value);
    fetchProjectsData(company?.id);
  };

  const handleExcelExport = async () => {
    try {
      dispatchBusy({ isBusy: true });
      await downloadTicketProjectsExcel(selectedWorkCompanyId || undefined);
    } catch {
      dispatchAlert({ message: "Excel dışa aktarılırken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Müşteri</label>
          <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={companyPopoverOpen}
                aria-label="Müşteri seç"
                className="flex h-8 w-52 items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-1.5 truncate text-left">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  {selectedWorkCompanyId
                    ? (workCompanyData.find((c) => c.id === selectedWorkCompanyId)?.name ?? "Müşteri Seçiniz")
                    : <span className="text-muted-foreground">Müşteri Seçiniz</span>}
                </span>
                <span className="flex shrink-0 items-center gap-0.5">
                  {selectedWorkCompanyId && (
                    <span
                      role="button"
                      aria-label="Temizle"
                      tabIndex={0}
                      className="rounded p-0.5 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkCompanyChange("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          handleWorkCompanyChange("");
                        }
                      }}
                    >
                      <X className="size-3 text-muted-foreground" />
                    </span>
                  )}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
              <Command>
                <CommandInput placeholder="Müşteri ara…" />
                <CommandList>
                  <CommandEmpty>Müşteri bulunamadı</CommandEmpty>
                  <CommandGroup>
                    {workCompanyData.map((company) => (
                      <CommandItem
                        key={company.id}
                        value={company.name}
                        data-checked={selectedWorkCompanyId === company.id}
                        onSelect={() => {
                          handleWorkCompanyChange(
                            selectedWorkCompanyId === company.id ? "" : company.id ?? "",
                          );
                          setCompanyPopoverOpen(false);
                        }}
                      >
                        <Building2 className="size-4 text-muted-foreground" />
                        {company.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Ara</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Proje veya müşteri ara…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold text-transparent select-none" aria-hidden>
            Excel
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExcelExport}
            className="gap-1.5"
            aria-label="Excel olarak dışa aktar"
          >
            <Download className="size-4" />
            Excel Dışa Aktar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-foreground">Müşteri</TableHead>
              <TableHead className="font-bold text-foreground">Proje Tanımı</TableHead>
              <TableHead className="font-bold text-foreground">Proje Alt Tanımı</TableHead>
              <TableHead className="font-bold text-foreground">Proje Durumu</TableHead>
              <TableHead className="font-bold text-foreground">Aktif/Pasif</TableHead>
              <TableHead className="font-bold text-foreground">Oluşturulma Tarihi</TableHead>
              <TableHead className="font-bold text-foreground">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {search ? "Aramanızla eşleşen proje bulunamadı." : "Henüz proje eklenmemiş."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm">
                    {row.workCompany?.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm font-medium">
                    {row.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {row.subProjectName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getProjectStatusLabel(row.projectStatus ?? row.projectType)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.createdDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Düzenle"
                        onClick={() => navigate(`/ticketProjects/detail/${row.id}`)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Sil"
                        onClick={() => handleOpenQuestionBox(row.id ?? "")}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Toplam{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            kayıt
            {totalPages > 1 && (
              <>, sayfa{" "}
                <span className="font-medium text-foreground">{page}</span>
                {" "}/{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
    </>
  );
};

export default TicketProjectsListTab;
