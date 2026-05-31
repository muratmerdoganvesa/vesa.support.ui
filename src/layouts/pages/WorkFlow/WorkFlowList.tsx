import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkFlowDefinationApi, WorkFlowDefinationListDto } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { cn } from "lib/utils";

// shadcn/ui
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

// Lucide
import {
  GitMerge,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Workflow,
} from "lucide-react";
import { useBusy } from "../hooks/useBusy";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;

// ─── Component ────────────────────────────────────────────────────────────────

function WorkFlowList() {
  const navigate = useNavigate();
  const [gridData, setGridData] = useState<WorkFlowDefinationListDto[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const dispatchBusy = useBusy();

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    dispatchBusy({ isBusy: true });
    var conf = getConfiguration();
    var api = new WorkFlowDefinationApi(conf);
    var data = await api.apiWorkFlowDefinationGet();
    setGridData(data.data);
    dispatchBusy({ isBusy: false });
  };

  const onNew = () => {
    navigate("/CreateWorkFlow");
  };

  const onDelete = (obj: any) => {};

  const onEdit = (obj: any) => {
    navigate("/CreateWorkFlow?id=" + obj);
  };

  // ── Search + Pagination ────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch]);

  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return gridData;
    const q = tableSearch.toLowerCase();
    return gridData.filter(
      (row) =>
        row.id?.toLowerCase().includes(q) || row.workflowName?.toLowerCase().includes(q)
    );
  }, [gridData, tableSearch]);

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
                <GitMerge className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  Onay Akışı Yönetimi
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Onay akışlarını görüntüleyin, oluşturun ve yönetin
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/WorkFlowList/detail")}
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-1.5 transition-all hover:-translate-y-0.5"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Onay Akışı
            </Button>
          </div>

          {/* ── Search Bar ── */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="İş akışı ara..."
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

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide w-[280px]">
                    İş Akışı Kodu
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    İş Akışı Adı
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Workflow className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">İş akışı bulunamadı</p>
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
                      className="border-b border-slate-100 hover:bg-violet-50/30 transition-colors"
                    >
                      {/* ID */}
                      <TableCell className="px-5 py-3.5">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {row.id ?? "—"}
                        </code>
                      </TableCell>

                      {/* Workflow Name */}
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                            <GitMerge className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-slate-800 text-sm">
                            {row.workflowName ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/WorkFlowList/detail/${row.id}`)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            title="Düzenle"
                            aria-label="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(row.id)}
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
              {filteredRows.length !== gridData.length && (
                <span className="text-slate-400"> ({gridData.length} içinden)</span>
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
    </DashboardLayout>
  );
}

export default WorkFlowList;
