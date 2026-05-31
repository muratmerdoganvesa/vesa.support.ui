import { ensureSyncfusionLicense } from "utils/syncfusionInit";
ensureSyncfusionLicense();
import {
  PerformanceQuestionListDto,
  PerformanceQuestionsApi,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MessageBox from "layouts/pages/Components/MessageBox";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useUser } from "layouts/pages/hooks/userName";
import {
  HelpCircle,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;

// ─── Component ────────────────────────────────────────────────────────────────

function SoruCevapTanimlamaMainView() {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const { userAppDto } = useUser();
  const { t } = useTranslation();
  const dispatchBusy = useBusy();
  const [dataTableData, setDataTableData] = useState<PerformanceQuestionListDto[]>([]);
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchQuestions = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceQuestionsApi(config);
      let response = await apiInstance.apiPerformanceQuestionsQuestionListGet();
      console.log("response", response.data);
      setDataTableData(response.data);
    } catch (e) {
      dispatchAlert({ message: "hata", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenQuestionBox = (id: string) => {
    setSelectedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes") handleDelete(selectedId);
    if (action === "No") alert("silinme işlemi iptal edildi");
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new PerformanceQuestionsApi(conf);
      await api.apiPerformanceQuestionsQuestionDeleteIdDelete(id);
      dispatchAlert({ message: "Başarıyla Silindi", type: "Success" });
      dispatchBusy({ isBusy: false });
      await fetchQuestions();
    } catch (error) {
      dispatchAlert({
        message: "Hata Oluştu Tekrar Deneyiniz...",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ── Search + Pagination ────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch]);

  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return dataTableData;
    const q = tableSearch.toLowerCase();
    return dataTableData.filter((row) => {
      const optionsText = row.options?.map((o: any) => o.text).join(" ") ?? "";
      return (
        row.questionText?.toLowerCase().includes(q) ||
        optionsText.toLowerCase().includes(q)
      );
    });
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
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm shrink-0">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  Soru Tanımlama
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Performans değerlendirme sorularını ve şıklarını yönetin
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/questionDefination/detail")}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm gap-1.5"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Soru
            </Button>
          </div>

          {/* ── Search ── */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Soru metni veya şık ara..."
                className="pl-9 h-9 border-slate-200 focus:border-purple-400 focus:ring-purple-100"
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
                  {[
                    "Soru Adı",
                    "Şıklar",
                    t("ns1:MenuPage.MenuList.Islemler"),
                  ].map((h) => (
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
                    <TableCell colSpan={3} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <HelpCircle className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">Soru bulunamadı</p>
                        {tableSearch && (
                          <p className="text-xs">
                            &ldquo;{tableSearch}&rdquo; için sonuç yok
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => {
                    const optionsText =
                      row.options && row.options.length > 0
                        ? row.options.map((o: any) => o.text).join(" | ")
                        : "Şık Bulunamadı";

                    return (
                      <TableRow
                        key={row.id}
                        className="border-b border-slate-100 hover:bg-purple-50/20 transition-colors"
                      >
                        {/* Question text */}
                        <TableCell className="px-5 py-3 max-w-md">
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </div>
                            <span
                              className="text-sm font-medium text-slate-800 leading-snug line-clamp-3 wrap-break-word"
                              title={row.questionText ?? ""}
                            >
                              {row.questionText ?? "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Options */}
                        <TableCell className="px-5 py-3">
                          <p
                            className="text-sm text-slate-500 truncate max-w-xs"
                            title={optionsText}
                          >
                            {optionsText}
                          </p>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/questionDefination/detail/${row.id}?isEdit=true`
                                )
                              }
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Düzenle"
                              aria-label="Soruyu düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenQuestionBox(row.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Sil"
                              aria-label="Soruyu sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Toplam{" "}
              <span className="font-semibold text-slate-700">{filteredRows.length}</span>{" "}
              soru
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
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`e-${idx}`}
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
                            ? "bg-purple-600 text-white shadow-sm"
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

      {/* ── Delete confirmation ── */}
      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
    </DashboardLayout>
  );
}

export default SoruCevapTanimlamaMainView;
