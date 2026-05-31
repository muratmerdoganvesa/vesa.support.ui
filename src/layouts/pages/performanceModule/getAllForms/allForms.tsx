import {
  PerformanceCyclesApi,
  PerformanceCyclesListDto,
  PerformanceFormListDto,
  PerformanceFormsApi,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useUser } from "layouts/pages/hooks/userName";
import {
  Eye,
  BarChart3,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;

// ─── Status helpers ────────────────────────────────────────────────────────────

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Çalışan Değerlendirmesi":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "1. Yönetici Değerlendirmesi":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "2. Yönetici Değerlendirmesi":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-green-50 text-green-700 border-green-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Çalışan Değerlendirmesi":
      return <Clock className="w-3 h-3" />;
    case "1. Yönetici Değerlendirmesi":
      return <AlertCircle className="w-3 h-3" />;
    case "2. Yönetici Değerlendirmesi":
      return <CheckCircle2 className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
};

const getInitials = (name?: string) =>
  (name ?? "")
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────

function AllPerformanceForms() {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const { userAppDto } = useUser();
  const { t } = useTranslation();
  const dispatchBusy = useBusy();

  const [dataTableData, setDataTableData] = useState<PerformanceFormListDto[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCyclesListDto>(
    {} as PerformanceCyclesListDto
  );
  const [cycles, setCycles] = useState<PerformanceCyclesListDto[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchPerformanceForms = async (cycleId: string) => {
    if (cycleId === "") return;
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormsApi(config);
      let response = await apiInstance.apiPerformanceFormsGetComplatedFormListGet(cycleId);
      console.log(response.data);
      setDataTableData(response.data);
    } catch (error) {
      dispatchAlert({ message: "hata ", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const getCycles = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      let response = await apiInstance.apiPerformanceCyclesGetYearAllPerformanceCyclesGet();
      console.log("cycles", response.data);
      setCycles(response.data);
    } catch (error) {
      dispatchBusy({ isBusy: false });
      dispatchAlert({ message: "hata", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const getActiveCycle = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      let response = await apiInstance.apiPerformanceCyclesGetActiveCycleGet();
      console.log("1", response.data);
      setSelectedCycle(response.data);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchBusy({ isBusy: false });
      dispatchAlert({ message: "hata", type: "Error" });
    }
  };

  useEffect(() => {
    getCycles();
    getActiveCycle();
  }, []);

  useEffect(() => {
    if (selectedCycle.id !== "") {
      fetchPerformanceForms(selectedCycle.id);
    }
  }, [selectedCycle.id]);

  // ── Search + Pagination ────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, selectedCycle.id]);

  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return dataTableData;
    const q = tableSearch.toLowerCase();
    return dataTableData.filter((row) =>
      [
        row.employeeName,
        row.userLevelName,
        row.userPositionName,
        row.cycleName,
        String(row.year ?? ""),
        row.managerOneName,
        row.managerTwoName,
        row.performanceFormStatusDescription,
      ].some((val) => val?.toLowerCase().includes(q))
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
              <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  Tüm Performans Listesi
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Tamamlanan performans değerlendirme formları
                </p>
              </div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="flex flex-col sm:flex-row gap-4">

              {/* Period selector */}
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Dönem Seçiniz
                </label>
                <div className="relative">
                  <select
                    value={selectedCycle.id ?? ""}
                    onChange={(e: any) => {
                      const id = e.target.value;
                      const cycle = cycles.find((c) => c.id === id);
                      console.log("cycle", cycle);
                      setSelectedCycle(cycle);
                    }}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 h-9 py-0 px-3 pr-8 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-violet-400 focus:border-violet-400 transition-all duration-200 cursor-pointer"
                  >
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.year} - Q{cycle.quarterNumber}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Ara
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Ad, dönem, yönetici..."
                    className="pl-9 h-9 border-slate-200 focus:border-violet-400 focus:ring-violet-100"
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
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
                  {[
                    "Ad Soyad",
                    "Level",
                    "Pozisyon",
                    "Dönem Adı",
                    "Yıl",
                    "Çeyrek",
                    "Başlangıç Tarihi",
                    "1. Yönetici",
                    "1. Yön. Level",
                    "1. Yön. Pozisyon",
                    "2. Yönetici",
                    "2. Yön. Level",
                    "2. Yön. Pozisyon",
                    t("ns1:MenuPage.MenuList.Durum"),
                    t("ns1:MenuPage.MenuList.Islemler"),
                  ].map((header) => (
                    <TableHead
                      key={header}
                      className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={15} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">Form bulunamadı</p>
                        {tableSearch && (
                          <p className="text-xs">
                            &ldquo;{tableSearch}&rdquo; için sonuç yok
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((form) => (
                    <TableRow
                      key={form.id}
                      className="border-b border-slate-100 hover:bg-violet-50/20 transition-colors"
                    >
                      {/* Employee */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {getInitials(form.employeeName)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {form.employeeName ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Level */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{form.userLevelName ?? "—"}</span>
                      </TableCell>

                      {/* Position */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {form.userPositionName ?? "—"}
                        </span>
                      </TableCell>

                      {/* Cycle name */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-700 font-medium">
                          {form.cycleName ?? "—"}
                        </span>
                      </TableCell>

                      {/* Year */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{form.year ?? "—"}</span>
                      </TableCell>

                      {/* Quarter */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          Q{form.quarterNumber ?? "—"}
                        </span>
                      </TableCell>

                      {/* Created date */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {form.createdDate
                            ? new Date(form.createdDate).toLocaleDateString("tr-TR")
                            : "—"}
                        </span>
                      </TableCell>

                      {/* Manager 1 */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {getInitials(form.managerOneName)}
                          </div>
                          <span className="text-sm text-slate-600">
                            {form.managerOneName ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Manager 1 level */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {form.managerOneLevelName ?? "—"}
                        </span>
                      </TableCell>

                      {/* Manager 1 position */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {form.managerOnePositionName ?? "Bulunamadı"}
                        </span>
                      </TableCell>

                      {/* Manager 2 */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {getInitials(form.managerTwoName)}
                          </div>
                          <span className="text-sm text-slate-600">
                            {form.managerTwoName ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Manager 2 level */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {form.managerTwoLevelName ?? "—"}
                        </span>
                      </TableCell>

                      {/* Manager 2 position */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {form.managerTwoPositionName ?? "Bulunamadı"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                            getStatusStyle(form.performanceFormStatusDescription)
                          )}
                        >
                          {getStatusIcon(form.performanceFormStatusDescription)}
                          {form.performanceFormStatusDescription ?? "—"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const formId = form.id;
                            const userId = form.managerTwoId ?? form.managerOneId;
                            sessionStorage.setItem("pformId", formId);
                            sessionStorage.setItem("pisReadOnly", "true");
                            sessionStorage.setItem("puserId", userId);
                            sessionStorage.setItem("pisAdmin", "true");
                            window.open("/performanceModule/form", "_blank");
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                          title="Formu Görüntüle"
                          aria-label="Formu Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
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
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
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
                            ? "bg-violet-600 text-white shadow-sm"
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

export default AllPerformanceForms;
