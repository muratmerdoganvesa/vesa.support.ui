import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Search, Timer } from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { cn } from "lib/utils";
import {
  fetchEffortManagementCustomers,
  fetchEffortManagementList,
  readEffortApiError,
} from "./api";
import { EffortStatusBadge, formatDateTime } from "./shared";
import type { TicketEffortManagementCustomerOptionDto, TicketEffortManagementListItemDto } from "./types";

const PAGE_SIZE = 20;

const statusOptions = [
  { value: "", label: "Tüm durumlar" },
  { value: "1", label: "Efor yöneticisine gönderildi" },
  { value: "2", label: "İncelemede" },
  { value: "3", label: "Müşteri onayı bekliyor" },
  { value: "4", label: "Müşteri onayladı" },
  { value: "5", label: "Müşteri reddetti" },
  { value: "6", label: "Düzenleme için geri gönderildi" },
];

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
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Önceki sayfa"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
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
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={currentPage >= pageCount - 1}
          aria-label="Son sayfa"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const EffortManagementPage = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<TicketEffortManagementCustomerOptionDto[]>([]);
  const [rows, setRows] = useState<TicketEffortManagementListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [list, customerOptions] = await Promise.all([
          fetchEffortManagementList({
            skip: page * PAGE_SIZE,
            top: PAGE_SIZE,
            status: status ? Number(status) : null,
            customerId: customerId || null,
            search: appliedSearch,
          }),
          fetchEffortManagementCustomers(),
        ]);
        setRows(list.items ?? []);
        setTotalCount(list.count ?? 0);
        setCustomers(customerOptions);
      } catch (loadError) {
        setRows([]);
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

  const handleOpen = (id?: string) => {
    if (!id) return;
    navigate(`/effortManagement/${id}`);
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <main className="flex min-h-[calc(100vh-6rem)] flex-col gap-5 px-4 py-6 md:px-6">
        <header>
          <h1 className="text-xl font-bold leading-tight text-slate-800">Efor Yönetimi</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Efor onayına gönderilen talepler ve mevcut fiili / fatura saatleri.
          </p>
        </header>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="effort-search" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Talep no veya başlık
              </label>
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
                placeholder="Ara"
                aria-label="Talep no veya başlık ara"
                className="h-10 rounded-xl border-slate-200"
              />
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
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#3e5d8f]"
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
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#3e5d8f]"
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
              className="h-10 rounded-xl bg-[#3e5d8f] px-5 text-white hover:bg-[#324d7a]"
            >
              <Search className="h-3.5 w-3.5" />
              Ara
            </Button>
          </div>

          {error && (
            <div className="mx-4 mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Kayıtlar yükleniyor...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Timer className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Gösterilecek efor gönderimi yok.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Talep no</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Başlık</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Müşteri</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Departman yöneticisi</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Gönderim</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Durum</TableHead>
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
                    className="cursor-pointer border-slate-100 hover:bg-slate-50/80"
                  >
                    <TableCell className="font-semibold text-slate-800">{row.ticketNumber ?? "—"}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate text-sm font-medium text-slate-800">{row.title || "—"}</p>
                      {row.departmentName && (
                        <p className="truncate text-xs text-slate-400">{row.departmentName}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{row.customerName || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{row.departmentManagerName || row.sentByUserName || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{formatDateTime(row.sentAt)}</TableCell>
                    <TableCell>
                      <EffortStatusBadge status={row.status} label={row.statusText} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className={cn("border-t border-slate-100 px-4 py-3", loading && "opacity-60")}>
            <Pagination
              pageCount={pageCount}
              currentPage={page}
              onPageChange={setPage}
              totalCount={totalCount}
            />
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default EffortManagementPage;
