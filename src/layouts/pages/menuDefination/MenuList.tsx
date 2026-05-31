import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, LayoutList,
  ChevronUp, ChevronDown, ChevronsUpDown, Menu, Eye, EyeOff,
  ChevronLeft, ChevronRight, HelpCircle,
} from "lucide-react";

import { MenuApi, MenuListDto } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PdfDialog from "../Components/PdfView/PdfDiallog";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { Skeleton } from "components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "components/ui/select";
import { cn } from "lib/utils";

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

const PAGE_SIZES = [10, 20, 50] as const;

function buildPageWindows(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = keyof Pick<MenuListDto, "order" | "name" | "menuCode" | "isActive" | "createdAt">;
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col gap-0.5 rounded-xl border px-4 py-3 min-w-[90px]",
      accent
        ? "border-indigo-200 bg-indigo-50/60"
        : "border-slate-100 bg-white/60"
    )}>
      <span className={cn("text-xl font-bold tracking-tight", accent ? "text-indigo-600" : "text-slate-800")}>
        {value}
      </span>
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {[40, 120, 160, 70, 80, 110, 80].map((w, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 rounded" style={{ width: w }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <tr>
      <td colSpan={7} className="py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <LayoutList className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            {query ? `"${query}" için sonuç bulunamadı` : "Henüz menü tanımlanmamış"}
          </p>
          {!query && (
            <p className="text-xs text-slate-400">Yeni menü ekleyerek başlayabilirsiniz</p>
          )}
        </div>
      </td>
    </tr>
  );
}

function SortIcon({ field, sortKey, sortDir }: { field: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 text-slate-300" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 h-3 w-3 text-indigo-500" />
    : <ChevronDown className="ml-1 h-3 w-3 text-indigo-500" />;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function MenuList(): JSX.Element {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const { t } = useTranslation();

  const [rows, setRows] = useState<MenuListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [openPdf, setOpenPdf] = useState(false);

  const handlePdf = () => setOpenPdf(true);
  const handleClosePdf = () => setOpenPdf(false);

  // ── Data ─────────────────────────────────────────────────────────────────

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const api = new MenuApi(getConfiguration());
      const { data } = await api.apiMenuAllListDataGet();
      setRows(data as any);
    } catch {
      dispatchAlert({ message: t("ns1:MenuPage.MenuList.MenuleriAlirkenHata"), type: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setDeleteLoading(true);
      const api = new MenuApi(getConfiguration());
      await api.apiMenuIdDelete(pendingDeleteId);
      dispatchAlert({ message: t("ns1:MenuPage.MenuList.MenuSilindi"), type: "Success" });
      fetchMenus();
    } catch {
      dispatchAlert({ message: t("ns1:MenuPage.MenuList.MenuSilmeHata"), type: "Error" });
    } finally {
      setDeleteLoading(false);
      setPendingDeleteId(null);
    }
  };

  useEffect(() => { fetchMenus(); }, []);

  // ── Filtering & sorting ───────────────────────────────────────────────────

  const processed = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = q
      ? rows.filter(r =>
          [r.name, r.menuCode, r.href, r.route].some(v => v?.toLowerCase().includes(q))
        )
      : rows;

    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginated = processed.slice(pageStart, pageStart + pageSize);
  const pageWindows = buildPageWindows(safePage, totalPages);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Arama veya sayfa boyutu değişince sayfa 1'e sıfırla
  useMemo(() => { setPage(1); }, [query, pageSize]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalCount = rows.length;
  const activeCount = rows.filter(r => r.isActive).length;
  const visibleCount = rows.filter(r => r.showMenu).length;

  // ── Columns config ────────────────────────────────────────────────────────

  const cols: { key: SortKey; label: string; sortable?: boolean }[] = [
    { key: "order", label: "Sıra", sortable: true },
    { key: "name", label: "Menü Adı", sortable: true },
    { key: "menuCode", label: "Kod", sortable: true },
    { key: "isActive", label: "Durum", sortable: true },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-[calc(100vh-160px)] px-1 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200">
                <Menu className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {t("ns1:MenuPage.MenuList.MenuTitle")}
              </h1>
            </div>
            <p className="pl-11.5 text-sm text-slate-500">
              {t("ns1:MenuPage.MenuList.MenuSubTitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate("/menus/detail")}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200/60 transition-all duration-200 hover:shadow-md hover:shadow-indigo-200/60 hover:-translate-y-px"
            >
              <Plus className="h-4 w-4" />
              {t("ns1:MenuPage.MenuList.YeniMenu")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePdf}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handlePdf()}
              aria-label="Kullanım kılavuzunu aç"
              className="size-9 shrink-0 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="flex flex-wrap gap-3">
          <StatCard label="Toplam" value={totalCount} />
          <StatCard label="Aktif" value={activeCount} accent />
          <StatCard label="Menüde Görünen" value={visibleCount} />
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            className="pl-9 h-9 text-sm bg-white border-slate-200 focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
            placeholder="Menü adı, kod veya URL ara…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* ── Table Card ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                {cols.map(c => (
                  <TableHead
                    key={c.key}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide select-none",
                      c.sortable && "cursor-pointer hover:text-indigo-600 transition-colors"
                    )}
                    onClick={() => c.sortable && toggleSort(c.key)}
                  >
                    <span className="inline-flex items-center">
                      {c.label}
                      {c.sortable && <SortIcon field={c.key} sortKey={sortKey} sortDir={sortDir} />}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Hedef URL
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Görünüm
                </TableHead>
                <TableHead className="px-4 py-3 w-[72px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} />)
              ) : processed.length === 0 ? (
                <EmptyState query={query} />
              ) : (
                paginated.map(row => (
                  <TableRow
                    key={row.id}
                    className="border-slate-50 hover:bg-indigo-50/30 group transition-colors duration-150"
                  >
                    <TableCell className="px-4 py-3 font-mono text-sm text-slate-600 w-16">
                      {row.order}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-medium text-slate-800 text-sm">{row.name}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
                        {row.menuCode || "—"}
                      </code>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 border-0",
                          row.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {row.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-[200px]">
                      <span className="truncate block text-xs text-slate-500 font-mono">
                        {row.href || row.route || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {row.showMenu ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
                          <Eye className="h-3.5 w-3.5" /> Görünür
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <EyeOff className="h-3.5 w-3.5" /> Gizli
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => navigate(`/menus/detail/${row.id}`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                          onClick={() => setPendingDeleteId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && processed.length > 0 && (
            <div className="border-t border-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">

              {/* Sol: kayıt bilgisi + sayfa boyutu */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {pageStart + 1}–{Math.min(pageStart + pageSize, processed.length)} / {processed.length} kayıt
                  {query && <span className="text-indigo-400"> · "{query}"</span>}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Sayfa başına</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={v => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-7 w-16 text-xs border-slate-200 focus-visible:border-indigo-300 focus-visible:ring-indigo-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(s => (
                        <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sağ: sayfa navigasyon */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={safePage === 1}
                  onClick={() => goToPage(safePage - 1)}
                  className="h-7 w-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                {pageWindows.map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-slate-300 text-xs select-none">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant="ghost"
                      size="icon"
                      onClick={() => goToPage(p)}
                      className={cn(
                        "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                        p === safePage
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                          : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                      )}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={safePage === totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  className="h-7 w-7 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

            </div>
          )}
        </div>
      </div>

      

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={open => !open && setPendingDeleteId(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Menüyü sil</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Bu menü kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setPendingDeleteId(null)}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoading}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
              onClick={handleDelete}
            >
              {deleteLoading ? "Siliniyor…" : "Evet, sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfDialog
        open={openPdf}
        onClose={handleClosePdf}
        pdfUrl="/pdf/menüye yeni alt menü ekleme.pdf"
        title="Menüye Alt Menü Ekleme Kılavuzu"
      />
    </DashboardLayout>
  );
}

export default MenuList;
