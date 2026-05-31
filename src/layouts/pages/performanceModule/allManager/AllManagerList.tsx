import { UserApi, UserAppPerformanceDto } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useUser } from "layouts/pages/hooks/userName";
import {
  Users,
  Pencil,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Input } from "components/ui/input";
import { cn } from "lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;

const getInitials = (name?: string) =>
  (name ?? "")
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────

function AllManagerList() {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const { userAppDto } = useUser();
  const { t } = useTranslation();
  const dispatchBusy = useBusy();
  const [dataTableData, setDataTableData] = useState<UserAppPerformanceDto[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchPerformanceForms = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new UserApi(config);
      let response = await apiInstance.apiUserGetAllVesaUserGet();
      console.log(response.data);
      setDataTableData(response.data);
    } catch (error) {
      dispatchAlert({ message: "hata ", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchPerformanceForms();
  }, []);

  // ── Search + Pagination ────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch]);

  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return dataTableData;
    const q = tableSearch.toLowerCase();
    return dataTableData.filter((row) =>
      [row.employeName, row.managerOneName, row.managerTwoName].some((val) =>
        val?.toLowerCase().includes(q)
      )
    );
  }, [dataTableData, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-2 mx-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  Tüm Yöneticiler Listesi
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Sistemdeki tüm yönetici ve çalışan bilgileri
                </p>
              </div>
            </div>

            {/* Total badge */}
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {dataTableData.length} kayıt
            </span>
          </div>

          {/* ── Search bar ── */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Ad, yönetici ara..."
                className="pl-9 h-9 border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Aramayı temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
                  {["Ad Soyad", "Yönetici 1", "Yönetici 2", "İşlemler"].map((h) => (
                    <TableHead
                      key={h}
                      className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">Kayıt bulunamadı</p>
                        {tableSearch && (
                          <p className="text-xs">
                            &ldquo;{tableSearch}&rdquo; için sonuç yok
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => (
                    <TableRow
                      key={row.userName}
                      className="border-b border-slate-100 hover:bg-indigo-50/20 transition-colors"
                    >
                      {/* Employee */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {getInitials(row.employeName)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {row.employeName ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Manager 1 */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        {row.managerOneName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                              {getInitials(row.managerOneName)}
                            </div>
                            <span className="text-sm text-slate-700">{row.managerOneName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Manager 2 */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        {row.managerTwoName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs shrink-0">
                              {getInitials(row.managerTwoName)}
                            </div>
                            <span className="text-sm text-slate-700">{row.managerTwoName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/users/detail/?id=${row.userName}`)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Düzenle"
                          aria-label={`${row.employeName} kullanıcısını düzenle`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Toplam{" "}
              <span className="font-semibold text-slate-700">{filteredRows.length}</span>{" "}
              kayıt
              {filteredRows.length !== dataTableData.length && (
                <span className="text-slate-400"> ({dataTableData.length} içinden)</span>
              )}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center h-8 w-8 justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-default transition-colors"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                  )
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item as number)}
                        className={cn(
                          "w-8 h-8 rounded-md text-xs font-medium transition-colors",
                          currentPage === item
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                        aria-current={currentPage === item ? "page" : undefined}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center h-8 w-8 justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-default transition-colors"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AllManagerList;
