import { TicketDepartmentsApi, WorkCompanyApi } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { WorkCompanyDto } from "api/generated";
import { useTranslation } from "react-i18next";
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
  Building2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Users,
  AlertTriangle,
} from "lucide-react";
import { cn } from "lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DepartmentRow = {
  id: string;
  departmentText?: string;
  workCompany?: { name?: string };
  deparmentCode?: string;
  isActive?: boolean;
  manager?: { firstName?: string; lastName?: string };
};

const ROWS_PER_PAGE = 15;

// ─── Component ────────────────────────────────────────────────────────────────

function Departmens() {
  const [departmanData, setDepartmanData] = useState<[]>([]);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [workCompanyData, setWorkCompanyData] = useState<WorkCompanyDto[]>([]);
  const [selectedWorkCompany, setSelectedWorkCompany] = useState<WorkCompanyDto | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Outside click closes company dropdown ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Reset page on filter/search change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, selectedWorkCompany]);

  // ── Data fetching ──
  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      var data = await api.apiTicketDepartmentsGet();
      setDepartmanData(data.data as any);

      var api2 = new WorkCompanyApi(conf);
      var data2 = await api2.apiWorkCompanyGet();
      setWorkCompanyData(data2.data as any);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentList.DepartmanListesiHata"),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Delete ──
  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      await api.apiTicketDepartmentsIdDelete(id);
      dispatchAlert({
        message: t("ns1:DepartmentPage.DepartmentList.DepartmanSilindi"),
        type: "Success",
      });
      fetchData();
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

  const handleCloseQuestionBox = (confirmed: boolean) => {
    setIsQuestionMessageBoxOpen(false);
    if (confirmed) handleDelete(selectedId);
  };

  // ── Company filter ──
  const handleWorkCompanySelect = async (value: WorkCompanyDto | null) => {
    setSelectedWorkCompany(value);
    setDropdownOpen(false);
    setSearchText("");

    if (value != null) {
      try {
        dispatchBusy({ isBusy: true });
        let conf = getConfiguration();
        let api = new TicketDepartmentsApi(conf);
        let response = await api.apiTicketDepartmentsAllFilteredCompanyGet(value.id.toString());
        setDepartmanData(response.data as any);
      } catch (error) {
        dispatchAlert({
          message: t("ns1:DepartmentPage.DepartmentList.DepartmanListesiHata"),
          type: "Error",
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    } else {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new TicketDepartmentsApi(conf);
        var data = await api.apiTicketDepartmentsGet();
        setDepartmanData(data.data as any);
      } catch (error) {
        dispatchAlert({
          message: t("ns1:DepartmentPage.DepartmentList.DepartmanListesiHata"),
          type: "Error",
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
  };

  const filteredCompanies = workCompanyData.filter((c) =>
    (c.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

  // ── Table filtering & pagination ──
  const filteredRows = useMemo(() => {
    const rows = departmanData as DepartmentRow[];
    if (!tableSearch.trim()) return rows;
    const q = tableSearch.toLowerCase();
    return rows.filter((row) =>
      [
        row.departmentText,
        row.workCompany?.name,
        row.deparmentCode,
        `${row.manager?.firstName ?? ""} ${row.manager?.lastName ?? ""}`.trim(),
      ].some((val) => val?.toLowerCase().includes(q))
    );
  }, [departmanData, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-2 mx-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  {t("ns1:DepartmentPage.DepartmentList.DepartmentTitle")}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {t("ns1:DepartmentPage.DepartmentList.DepartmentSubTitle")}
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/departments/detail`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-1.5 transition-all hover:-translate-y-0.5"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              {t("ns1:DepartmentPage.DepartmentList.YeniDepartman")}
            </Button>
          </div>

          {/* ── Filters ── */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Company dropdown filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("ns1:DepartmentPage.DepartmentList.Sirket")}
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 h-9 px-3 rounded-lg border bg-white text-sm transition-all",
                      dropdownOpen
                        ? "border-indigo-400 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span
                        className={cn(
                          "truncate",
                          selectedWorkCompany ? "text-slate-800" : "text-slate-400"
                        )}
                      >
                        {selectedWorkCompany
                          ? selectedWorkCompany.name
                          : t("ns1:DepartmentPage.DepartmentList.SirketSecin")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {selectedWorkCompany && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkCompanySelect(null);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleWorkCompanySelect(null)
                          }
                          className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded"
                          aria-label="Seçimi temizle"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform duration-200",
                          dropdownOpen && "rotate-180"
                        )}
                      />
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-slate-100">
                        <input
                          autoFocus
                          type="text"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Ara..."
                          className="w-full text-sm px-2 py-1.5 rounded-md border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        {filteredCompanies.length === 0 ? (
                          <p className="text-center text-sm text-slate-400 py-3">
                            Sonuç bulunamadı
                          </p>
                        ) : (
                          filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => handleWorkCompanySelect(company)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors",
                                selectedWorkCompany?.id === company.id &&
                                  "bg-indigo-50 text-indigo-700 font-medium"
                              )}
                            >
                              {company.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Table search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("ns1:DepartmentPage.DepartmentList.DepartmanAdi")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Departman ara..."
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
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {t("ns1:DepartmentPage.DepartmentList.DepartmanAdi")}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {t("ns1:DepartmentPage.DepartmentList.SirketAdi")}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {t("ns1:DepartmentPage.DepartmentList.DepartmanKodu")}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {t("ns1:DepartmentPage.DepartmentList.Durum")}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {t("ns1:DepartmentPage.DepartmentList.Yonetici")}
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">
                    {t("ns1:DepartmentPage.DepartmentList.Islemler")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">Departman bulunamadı</p>
                        {tableSearch && (
                          <p className="text-xs text-slate-400">
                            &ldquo;{tableSearch}&rdquo; için sonuç yok
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors"
                    >
                      {/* Department Name */}
                      <TableCell className="px-5 py-3.5">
                        <span className="font-medium text-slate-800 text-sm">
                          {row.departmentText || "—"}
                        </span>
                      </TableCell>

                      {/* Company Name */}
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-600">
                            {row.workCompany?.name || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Department Code */}
                      <TableCell className="px-5 py-3.5">
                        {row.deparmentCode ? (
                          <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {row.deparmentCode}
                          </code>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-5 py-3.5">
                        {row.isActive ? (
                          <Badge
                            className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            variant="outline"
                          >
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100"
                            variant="outline"
                          >
                            Pasif
                          </Badge>
                        )}
                      </TableCell>

                      {/* Manager */}
                      <TableCell className="px-5 py-3.5">
                        {row.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                              {(row.manager.firstName?.[0] ?? "") +
                                (row.manager.lastName?.[0] ?? "")}
                            </div>
                            <span className="text-sm text-slate-700">
                              {`${row.manager.firstName ?? ""} ${row.manager.lastName ?? ""}`.trim() ||
                                "—"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/departments/detail/${row.id}`)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Düzenle"
                            aria-label="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenQuestionBox(row.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Sil"
                            aria-label="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              {filteredRows.length !== (departmanData as DepartmentRow[]).length && (
                <span className="text-slate-400">
                  {" "}
                  ({(departmanData as DepartmentRow[]).length} içinden)
                </span>
              )}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

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

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={isQuestionMessageBoxOpen}
        onOpenChange={(open) => !open && handleCloseQuestionBox(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Kayıt Silinecektir
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu departmanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleCloseQuestionBox(false)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCloseQuestionBox(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default Departmens;
