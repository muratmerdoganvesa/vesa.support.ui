import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Filter,
  RotateCcw,
  Search,
  Timer,
  X,
} from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Skeleton } from "components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/ui/tooltip";
import { cn } from "lib/utils";
import {
  fetchEffortManagementCustomers,
  fetchEffortManagementList,
  readEffortApiError,
} from "./api";
import {
  EffortAlert,
  EffortEmptyState,
  EffortPageHeader,
  EffortPageShell,
  EffortSectionCard,
  EffortStatCard,
  EffortStatusBadge,
  effortFieldClass,
  effortPrimaryButtonClass,
  formatDateTime,
} from "./shared";
import { TicketEffortStatus } from "./types";
import type { TicketEffortManagementCustomerOptionDto, TicketEffortManagementListItemDto } from "./types";

const PAGE_SIZE = 20;

const statusOptions = [
  { value: "", label: "Tümü (onaylananlar hariç)" },
  { value: "1", label: "Efor yöneticisine gönderildi" },
  { value: "2", label: "İncelemede" },
  { value: "3", label: "Onay Bekliyor" },
  { value: "4", label: "Efor onaylandı" },
  { value: "5", label: "Müşteri reddetti" },
  { value: "6", label: "Düzenleme için geri gönderildi" },
  { value: "7", label: "Mail ile efor istendi" },
];

type StatusSummary = {
  waiting: number;
  approved: number;
  returned: number;
};

const fetchStatusCount = async (
  status: number,
  customerId: string,
  search: string
): Promise<number> => {
  const result = await fetchEffortManagementList({
    skip: 0,
    top: 1,
    status,
    customerId: customerId || null,
    search,
  });
  return result.count ?? 0;
};

const Pagination = ({
  pageCount,
  currentPage,
  onPageChange,
  totalCount,
}: {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalCount: number;
}) => {
  if (pageCount <= 1) {
    return (
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">{totalCount}</span> kayıt
      </p>
    );
  }

  const from = currentPage * PAGE_SIZE + 1;
  const to = Math.min((currentPage + 1) * PAGE_SIZE, totalCount);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">{from}–{to}</span> / {totalCount} kayıt
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          aria-label="İlk sayfa"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Önceki sayfa"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-2 text-xs font-medium text-slate-600">
          {currentPage + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount - 1}
          aria-label="Sonraki sayfa"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={currentPage >= pageCount - 1}
          aria-label="Son sayfa"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const TableSkeleton = ({ columns }: { columns: number }) => (
  <>
    {Array.from({ length: 6 }).map((_, rowIndex) => (
      <TableRow key={rowIndex} className="border-slate-100 hover:bg-transparent">
        {Array.from({ length: columns }).map((__, colIndex) => (
          <TableCell key={colIndex} className="px-4 py-3.5">
            <Skeleton className="h-4 w-full max-w-[140px] rounded" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

const EffortManagementPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<TicketEffortManagementCustomerOptionDto[]>([]);
  const [rows, setRows] = useState<TicketEffortManagementListItemDto[]>([]);
  const [canViewAllRecords, setCanViewAllRecords] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [statusSummary, setStatusSummary] = useState<StatusSummary>({
    waiting: 0,
    approved: 0,
    returned: 0,
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customerOptions = await fetchEffortManagementCustomers();
        setCustomers(customerOptions);
      } catch {
        // Müşteri filtresi opsiyonel; liste yüklemesini engellemez.
      }
    };
    void loadCustomers();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [waitingCount, approvedCount, returnedCount, rejectedCount] = await Promise.all([
          fetchStatusCount(TicketEffortStatus.WaitingCustomerApproval, customerId, appliedSearch),
          fetchStatusCount(TicketEffortStatus.CustomerApproved, customerId, appliedSearch),
          fetchStatusCount(TicketEffortStatus.ReturnedToDepartment, customerId, appliedSearch),
          fetchStatusCount(TicketEffortStatus.CustomerRejected, customerId, appliedSearch),
        ]);
        setStatusSummary({
          waiting: waitingCount,
          approved: approvedCount,
          returned: returnedCount + rejectedCount,
        });
      } catch {
        setStatusSummary({ waiting: 0, approved: 0, returned: 0 });
      }
    };
    void loadSummary();
  }, [customerId, appliedSearch]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const list = await fetchEffortManagementList({
          skip: page * PAGE_SIZE,
          top: PAGE_SIZE,
          status: status ? Number(status) : null,
          customerId: customerId || null,
          search: appliedSearch,
        });
        setRows(list.items ?? []);
        setCanViewAllRecords(list.canViewAllRecords !== false);
        setTotalCount(list.count ?? 0);
      } catch (loadError) {
        setRows([]);
        setCanViewAllRecords(true);
        setTotalCount(0);
        setError(readEffortApiError(loadError));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [page, status, customerId, appliedSearch]);

  const handleSearch = () => {
    setPage(0);
    setAppliedSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatus("");
    setCustomerId("");
    setPage(0);
  };

  const handleOpen = (id?: string) => {
    if (!id) return;
    window.open(`/effortManagement/${id}`, "_blank", "noopener,noreferrer");
  };

  const handleStatusCardClick = (nextStatus: string) => {
    setPage(0);
    setStatus((current) => (current === nextStatus ? "" : nextStatus));
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const columnCount = canViewAllRecords ? 7 : 6;

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (appliedSearch) {
      chips.push({
        key: "search",
        label: `Arama: ${appliedSearch}`,
        onClear: () => {
          setSearchInput("");
          setAppliedSearch("");
          setPage(0);
        },
      });
    }
    if (status) {
      const option = statusOptions.find((item) => item.value === status);
      chips.push({
        key: "status",
        label: `Durum: ${option?.label ?? status}`,
        onClear: () => {
          setStatus("");
          setPage(0);
        },
      });
    }
    if (customerId) {
      const customer = customers.find((item) => item.id === customerId);
      chips.push({
        key: "customer",
        label: `Müşteri: ${customer?.name || customerId}`,
        onClear: () => {
          setCustomerId("");
          setPage(0);
        },
      });
    }
    return chips;
  }, [appliedSearch, status, customerId, customers]);

  const hasActiveFilters = activeFilterChips.length > 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <EffortPageShell>
        <EffortPageHeader
          icon={<Timer className="h-5 w-5" aria-hidden />}
          title="Efor Yönetimi"
          description={
            canViewAllRecords
              ? "Efor onayına gönderilen talepler. Onaya sunulacak kişiyi kayıttan seçebilirsiniz."
              : "Onayınıza sunulan talepler. Adam gün değerlerini ve yapılacak işleri bu listeden açabilirsiniz."
          }
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <EffortStatCard
            label="Toplam kayıt"
            value={loading ? "—" : totalCount}
            tone="brand"
            icon={<Timer className="h-4 w-4" aria-hidden />}
            hint="Mevcut filtrelerle eşleşen toplam efor kaydı"
          />
          <EffortStatCard
            label="Onay bekleyen"
            value={loading ? "—" : statusSummary.waiting}
            tone="amber"
            icon={<Clock3 className="h-4 w-4" aria-hidden />}
            active={status === String(TicketEffortStatus.WaitingCustomerApproval)}
            onClick={() => handleStatusCardClick(String(TicketEffortStatus.WaitingCustomerApproval))}
            hint="Bu karta tıklayarak onay bekleyenleri filtreleyin"
          />
          <EffortStatCard
            label="Onaylanan"
            value={loading ? "—" : statusSummary.approved}
            tone="emerald"
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
            active={status === String(TicketEffortStatus.CustomerApproved)}
            onClick={() => handleStatusCardClick(String(TicketEffortStatus.CustomerApproved))}
            hint="Bu karta tıklayarak onaylananları filtreleyin"
          />
          <EffortStatCard
            label="Red / geri gönderilen"
            value={loading ? "—" : statusSummary.returned}
            tone="rose"
            icon={<RotateCcw className="h-4 w-4" aria-hidden />}
            active={
              status === String(TicketEffortStatus.ReturnedToDepartment) ||
              status === String(TicketEffortStatus.CustomerRejected)
            }
            onClick={() => handleStatusCardClick(String(TicketEffortStatus.ReturnedToDepartment))}
            hint="Bu karta tıklayarak geri gönderilenleri filtreleyin"
          />
        </div>

        <EffortSectionCard
          title="Arama ve filtreler"
          description="Talep no, başlık, durum veya müşteriye göre listeyi daraltın."
          actions={
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  aria-label="Tüm filtreleri temizle"
                  className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Temizle
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="effort-filters-panel"
                className="h-9 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtreler
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", filtersOpen && "rotate-180")} />
              </Button>
            </div>
          }
          bodyClassName="p-0"
        >
          <div
            id="effort-filters-panel"
            className={cn(
              "border-b border-slate-100 p-4",
              !filtersOpen && "hidden md:block"
            )}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_200px_auto] md:items-end">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effort-search" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Talep no veya başlık
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="effort-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Ara…"
                    aria-label="Talep no veya başlık ara"
                    className="h-10 rounded-xl border-slate-200 pl-9 focus-visible:border-[#3e5d8f] focus-visible:ring-[#3e5d8f]/20"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effort-status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Efor durumu
                </label>
                <select
                  id="effort-status"
                  value={status}
                  onChange={(event) => {
                    setPage(0);
                    setStatus(event.target.value);
                  }}
                  aria-label="Efor durumuna göre filtrele"
                  className={effortFieldClass}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="effort-customer" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Müşteri
                </label>
                <select
                  id="effort-customer"
                  value={customerId}
                  onChange={(event) => {
                    setPage(0);
                    setCustomerId(event.target.value);
                  }}
                  aria-label="Müşteriye göre filtrele"
                  className={effortFieldClass}
                >
                  <option value="">Tüm müşteriler</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name || "—"}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                onClick={handleSearch}
                aria-label="Efor listesini ara"
                className={cn(effortPrimaryButtonClass, "w-full md:w-auto")}
              >
                <Search className="h-3.5 w-3.5" />
                Ara
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  aria-label={`${chip.label} filtresini kaldır`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#3e5d8f]/15 bg-[#3e5d8f]/5 px-2.5 py-1 text-xs font-medium text-[#3e5d8f] transition-colors hover:bg-[#3e5d8f]/10"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 pt-4">
              <EffortAlert tone="error">{error}</EffortAlert>
            </div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                    {Array.from({ length: columnCount }).map((_, index) => (
                      <TableHead key={index} className="px-4 py-3">
                        <Skeleton className="h-3 w-20 rounded" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeleton columns={columnCount} />
                </TableBody>
              </Table>
            ) : rows.length === 0 ? (
              <EffortEmptyState
                icon={<Timer className="h-6 w-6" aria-hidden />}
                title={hasActiveFilters ? "Filtrelere uygun kayıt bulunamadı" : "Gösterilecek efor gönderimi yok"}
                description={
                  hasActiveFilters
                    ? "Filtreleri temizleyerek varsayılan listeye dönebilirsiniz."
                    : "Onaylanan kayıtlar için durum filtresinden 'Efor onaylandı' seçin."
                }
              />
            ) : (
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                      <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Talep no
                      </TableHead>
                      <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Başlık
                      </TableHead>
                      <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Müşteri
                      </TableHead>
                      <TableHead className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:table-cell">
                        Departman yöneticisi
                      </TableHead>
                      <TableHead className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                        Gönderim
                      </TableHead>
                      {canViewAllRecords && (
                        <TableHead className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 xl:table-cell">
                          Müşteri onayı
                        </TableHead>
                      )}
                      <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Durum
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`${row.ticketNumber ?? ""} numaralı talebin efor detayını aç`}
                        onClick={() => handleOpen(row.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpen(row.id);
                          }
                        }}
                        className="cursor-pointer border-slate-100 transition-colors duration-150 hover:bg-[#3e5d8f]/[0.03] focus-visible:bg-[#3e5d8f]/[0.05] focus-visible:outline-none"
                      >
                        <TableCell className="px-4 py-3.5">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                            {row.ticketNumber ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[280px] px-4 py-3.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{row.title || "—"}</p>
                                {row.departmentName && (
                                  <p className="truncate text-xs text-slate-400">{row.departmentName}</p>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="font-medium">{row.title || "—"}</p>
                              {row.departmentName && <p className="text-xs opacity-80">{row.departmentName}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm text-slate-600">
                          <span className="line-clamp-2">{row.customerName || "—"}</span>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-sm text-slate-600 lg:table-cell">
                          {row.departmentManagerName || row.sentByUserName || "—"}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-sm text-slate-600 md:table-cell">
                          {formatDateTime(row.sentAt)}
                        </TableCell>
                        {canViewAllRecords && (
                          <TableCell className="hidden px-4 py-3.5 text-sm text-slate-600 xl:table-cell">
                            <p className="truncate">{row.customerApprovedByUserName || "—"}</p>
                            {row.status === TicketEffortStatus.CustomerApproved && row.customerApprovedAt && (
                              <p className="text-xs text-slate-400">{formatDateTime(row.customerApprovedAt)}</p>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="px-4 py-3.5">
                          <EffortStatusBadge status={row.status} label={row.statusText} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            )}
          </div>

          <div className={cn("border-t border-slate-100 px-4 py-3", loading && "opacity-60")}>
            <Pagination
              pageCount={pageCount}
              currentPage={page}
              onPageChange={setPage}
              totalCount={totalCount}
            />
          </div>
        </EffortSectionCard>
      </EffortPageShell>
    </DashboardLayout>
  );
};

export default EffortManagementPage;
