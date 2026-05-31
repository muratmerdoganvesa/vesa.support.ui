import {
  PerformanceCycleQuestionsApi,
  PerformanceCyclesApi,
  PerformanceCyclesListDto,
  PerformanceQuestionDto,
  PerformanceQuestionListDto,
  QuestionCycleListInsertDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MessageBox from "layouts/pages/Components/MessageBox";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useUser } from "layouts/pages/hooks/userName";
import {
  CalendarDays,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ensureSyncfusionLicense } from "utils/syncfusionInit";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { cn } from "lib/utils";

ensureSyncfusionLicense();

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;

// ─── MultiSelect ──────────────────────────────────────────────────────────────

interface MultiSelectProps {
  options: PerformanceQuestionDto[];
  value: PerformanceQuestionDto[];
  onChange: (value: PerformanceQuestionDto[]) => void;
  label: string;
  placeholder?: string;
}

const MultiSelect = ({ options, value, onChange, label, placeholder }: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(
    () =>
      options.filter((o) => o.questionText?.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const toggle = (option: PerformanceQuestionDto) => {
    const exists = value.some((v) => v.id === option.id);
    onChange(exists ? value.filter((v) => v.id !== option.id) : [...value, option]);
  };

  const remove = (id: string) => onChange(value.filter((v) => v.id !== id));

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[38px] flex flex-wrap items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
      >
        {value.length === 0 ? (
          <span className="text-slate-400 text-xs">{placeholder ?? "Seçiniz..."}</span>
        ) : (
          value.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-md"
            >
              {v.questionText?.slice(0, 40)}{(v.questionText?.length ?? 0) > 40 ? "…" : ""}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(v.id); }}
                className="hover:text-blue-900 transition-colors"
                aria-label="Kaldır"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((option) => {
                const selected = value.some((v) => v.id === option.id);
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => toggle(option)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors",
                        selected
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          selected ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"
                        )}
                      >
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      {option.questionText}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-500">{value.length} seçili</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

function DonemTanimlamaMainView() {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const { userAppDto } = useUser();
  const { t } = useTranslation();
  const dispatchBusy = useBusy();
  const [dataTableData, setDataTableData] = useState<PerformanceCyclesListDto[]>([]);
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [questionData, setQuestionData] = useState<PerformanceQuestionListDto[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<PerformanceQuestionDto[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<PerformanceQuestionDto[]>([]);
  const [selectedQuestions2, setSelectedQuestions2] = useState<PerformanceQuestionDto[]>([]);
  const [isInsert, setIsInsert] = useState<boolean | null>(null);

  // Table search + pagination
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchQuestions = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCycleQuestionsApi(config);
      console.log(isTeamLeader);

      let response =
        await apiInstance.apiPerformanceCycleQuestionsGetCyclePassiveQuestionListCycleIdIsTeamLeaderGet(
          selectedId,
          isTeamLeader
        );
      console.log("Bu Döneme Ait Seçilmemiş Sorular : ", response.data);
      setQuestionData(response.data);

      let response2 =
        await apiInstance.apiPerformanceCycleQuestionsGetCycleQuestionsCycleIdIsTeamLeaderGet(
          selectedId,
          isTeamLeader
        );
      console.log("Bu Döneme Ait Hali Hazırda Atanmış Sorular : ", response2.data);

      if (!response2.data.errors || response2.data.errors === null) {
        console.log("şuan update true");
        setSelectedQuestions(response2.data.data.questions ?? []);
        setSelectedQuestions2(response2.data.data.questions ?? []);
        setIsInsert(false);
      } else if (
        response2.data.errors &&
        response2.data.errors[0] === "Dönem bulunamadı."
      ) {
        console.log("şuan insert true");
        setSelectedQuestions([]);
        setIsInsert(true);
      } else {
        setSelectedQuestions([]);
        setIsInsert(true);
      }
    } catch (e) {
      console.log("e", e);
      dispatchAlert({ message: "hata burada mı", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    fetchQuestions();
  }, [isTeamLeader]);

  useEffect(() => {
    if (openDialog) {
      fetchQuestions();
    }
  }, [openDialog]);

  useEffect(() => {
    console.log("selected", selectedQuestions);
    console.log("selecte12d", addedQuestions);
    console.log("33", selectedQuestions2);
  }, [selectedQuestions, addedQuestions, selectedQuestions2]);

  const handleAddQuestions = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCycleQuestionsApi(config);
      let mergedArray: PerformanceQuestionDto[] = [...selectedQuestions2, ...addedQuestions];
      console.log("mergedArray", mergedArray);

      let payload: QuestionCycleListInsertDto = {
        performanceCycleId: selectedId,
        isTeamLeader,
        performanceQuestionIds: mergedArray.map((v) => v.id),
      };
      await apiInstance.apiPerformanceCycleQuestionsCycleQuestionCreatePost(payload);
      setOpenDialog(false);
    } catch (error) {
      dispatchAlert({ message: "hata", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchDonems = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      let response = await apiInstance.apiPerformanceCyclesGetYearAllPerformanceCyclesGet();
      console.log("response", response.data);
      setDataTableData(response.data as any);
    } catch (e) {
      dispatchAlert({ message: "hata", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchDonems();
  }, []);

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
      var api = new PerformanceCyclesApi(conf);
      await api.apiPerformanceCyclesRemoveIdDelete(id);
      dispatchAlert({ message: "Başarıyla Silindi", type: "Success" });
      dispatchBusy({ isBusy: false });
      fetchDonems();
    } catch (error) {
      dispatchAlert({
        message: "Hata Oluştu Tekrar Deneyiniz...",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleOpenDialog = (id: string) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedQuestions([]);
    setAddedQuestions([]);
    setIsInsert(null);
    setOpenDialog(false);
  };

  // ── Search + Pagination ────────────────────────────────────────────────────

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch]);

  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return dataTableData;
    const q = tableSearch.toLowerCase();
    return dataTableData.filter((row) =>
      [row.name, String(row.year ?? ""), String(row.quarterNumber ?? "")].some((v) =>
        v?.toLowerCase().includes(q)
      )
    );
  }, [dataTableData, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("tr-TR") : "—";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-2 mx-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm shrink-0">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  Dönem Tanımlama
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Performans değerlendirme dönemlerini yönetin
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/donemTanimlama/detail")}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm gap-1.5"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Dönem
            </Button>
          </div>

          {/* ── Search ── */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Dönem adı, yıl ara..."
                className="pl-9 h-9 border-slate-200 focus:border-teal-400 focus:ring-teal-100"
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
                    "Dönem Adı",
                    "Yıl",
                    "Çeyrek",
                    "Başlangıç Tarihi",
                    "Bitiş Tarihi",
                    t("ns1:MenuPage.MenuList.Durum"),
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
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <CalendarDays className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">Dönem bulunamadı</p>
                        {tableSearch && (
                          <p className="text-xs">&ldquo;{tableSearch}&rdquo; için sonuç yok</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-teal-50/20 transition-colors"
                    >
                      {/* Name */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-800">
                          {row.name ?? "—"}
                        </span>
                      </TableCell>

                      {/* Year */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{row.year ?? "—"}</span>
                      </TableCell>

                      {/* Quarter */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100">
                          Q{row.quarterNumber ?? "—"}
                        </span>
                      </TableCell>

                      {/* Start date */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{formatDate(row.startDate)}</span>
                      </TableCell>

                      {/* End date */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{formatDate(row.endDate)}</span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                            row.status
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          )}
                        >
                          {row.status ? "Aktif" : "Pasif"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/donemTanimlama/detail/${row.id}`)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Düzenle"
                            aria-label="Dönemi düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenQuestionBox(row.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Sil"
                            aria-label="Dönemi sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDialog(row.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Soru Ekle"
                            aria-label="Döneme soru ekle"
                          >
                            <Plus className="w-4 h-4" />
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
                            ? "bg-teal-600 text-white shadow-sm"
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

      {/* ── Question assignment dialog ── */}
      <Dialog open={openDialog} onOpenChange={(o) => !o && handleCloseDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Dönem — Soru Atama
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Team leader toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => {
                  setIsTeamLeader((v) => !v);
                  fetchQuestions();
                }}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none cursor-pointer",
                  isTeamLeader ? "bg-teal-600" : "bg-slate-200"
                )}
                role="switch"
                aria-checked={isTeamLeader}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    setIsTeamLeader((v) => !v);
                    fetchQuestions();
                  }
                }}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    isTeamLeader ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">Takım Lideri mi?</span>
            </label>

            {/* Added questions multi-select */}
            <MultiSelect
              options={questionData}
              value={addedQuestions}
              onChange={setAddedQuestions}
              label="Eklenecek Sorular"
              placeholder="Soru seçiniz..."
            />

            {/* Already assigned questions multi-select */}
            <MultiSelect
              options={selectedQuestions}
              value={selectedQuestions2}
              onChange={setSelectedQuestions2}
              label="Bu Döneme Ait Sorular"
              placeholder="Soru seçiniz..."
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleAddQuestions}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
    </DashboardLayout>
  );
}

export default DonemTanimlamaMainView;
