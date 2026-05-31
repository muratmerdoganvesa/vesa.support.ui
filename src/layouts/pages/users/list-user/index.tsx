import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Badge } from "components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { UserApi } from "api/generated";
import { useEffect, useMemo, useState } from "react";
import getConfiguration from "confiuration";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Users,
  Building2,
  LayoutGrid,
  Mail,
  Clock,
} from "lucide-react";

const FILTER_ALL = "__all__";
const PAGE_SIZE = 12;

const SEARCH_ACCESSORS = [
  "userName",
  "firstName",
  "lastName",
  "workCompanyText",
  "departmentText",
  "email",
  "lastLoginDate",
] as const;

/** Generates a consistent colour from a string (for avatar backgrounds) */
function stringToColor(str: string): string {
  const palette = [
    "from-violet-500 to-purple-600",
    "from-indigo-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-red-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
    "from-pink-500 to-fuchsia-600",
    "from-lime-500 to-green-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function UserAvatar({ firstName, lastName }: { firstName?: string; lastName?: string }) {
  const initials = `${(firstName ?? "?")[0]}${(lastName ?? "")[0] ?? ""}`.toUpperCase();
  const gradient = stringToColor(`${firstName}${lastName}`);
  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800`}
    >
      {initials}
    </div>
  );
}

function DataTables(): JSX.Element {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [filters, setFilters] = useState({ department: "", company: "" });
  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => { fetchDetail(); }, []);

  useEffect(() => {
    if (rows.length > 0) {
      setUniqueDepartments([...new Set(rows.map((r) => r.departmentText as string))].filter(Boolean));
      setUniqueCompanies([...new Set(rows.map((r) => r.workCompanyText as string))].filter(Boolean));
    }
  }, [rows]);

  const filteredRows = useMemo(() =>
    rows.filter((row) => {
      const deptOk = !filters.department || row.departmentText === filters.department;
      const compOk = !filters.company || row.workCompanyText === filters.company;
      return deptOk && compOk;
    }),
    [rows, filters],
  );

  const searchFilteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return filteredRows;
    return filteredRows.filter((row) =>
      SEARCH_ACCESSORS.some((key) => String(row[key] ?? "").toLowerCase().includes(q)),
    );
  }, [filteredRows, tableSearch]);

  useEffect(() => { setPageIndex(0); }, [filters.department, filters.company, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(searchFilteredRows.length / PAGE_SIZE));
  const safePage  = Math.min(pageIndex, totalPages - 1);
  const pageSlice = searchFilteredRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const fetchDetail = async () => {
    dispatchBusy({ isBusy: true });
    const conf = getConfiguration();
    const api  = new UserApi(conf);
    const data = await api.apiUserGetAllWithOuthPhotoForManagementGet();
    setRows(data.data.map((item) => ({
      ...item,
      lastLoginDate: item.lastLoginDate ? formatDate(item.lastLoginDate) : "",
    })));
    dispatchBusy({ isBusy: false });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="w-full px-3 pb-10">

        {/* ── Page header ── */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
              <Users className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Kullanıcı Yönetimi</h1>
            
            </div>
          </div>
          <Button
            type="button"
            id="btn-yeni-kullanici"
            className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md hover:from-indigo-600 hover:to-violet-700"
            onClick={() => navigate("/users/detail")}
          >
            <Plus className="size-4 shrink-0" />
            Yeni Kullanıcı
          </Button>
        </div>

        {/* ── Filter bar ── */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-5 py-3">
            <LayoutGrid className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filtreler</span>
          </div>
          <div className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              {/* Department */}
              <div className="space-y-1.5">
                <Label htmlFor="filter-department" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <LayoutGrid className="size-3.5" />
                  Departman
                </Label>
                <Select
                  value={filters.department || FILTER_ALL}
                  onValueChange={(v) => setFilters((p) => ({ ...p, department: v === FILTER_ALL ? "" : v }))}
                >
                  <SelectTrigger id="filter-department" className="h-10">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="z-[1200]">
                    <SelectItem value={FILTER_ALL}>Tümü</SelectItem>
                    {uniqueDepartments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <Label htmlFor="filter-company" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Building2 className="size-3.5" />
                  Şirket
                </Label>
                <Select
                  value={filters.company || FILTER_ALL}
                  onValueChange={(v) => setFilters((p) => ({ ...p, company: v === FILTER_ALL ? "" : v }))}
                >
                  <SelectTrigger id="filter-company" className="h-10">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent className="z-[1200]">
                    <SelectItem value={FILTER_ALL}>Tümü</SelectItem>
                    {uniqueCompanies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Search — spans 2 cols on large */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="table-search" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Search className="size-3.5" />
                  Arama
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="table-search"
                    className="h-10 pl-9"
                    placeholder="İsim, e-posta, şirket…"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30">
                  {[
                    { label: "Kullanıcı",       icon: <Users className="size-3.5" /> },
                    { label: "Kullanıcı Adı",   icon: null },
                    { label: "Şirket",           icon: <Building2 className="size-3.5" /> },
                    { label: "Departman",        icon: <LayoutGrid className="size-3.5" /> },
                    { label: "E-posta",          icon: <Mail className="size-3.5" /> },
                    { label: "Son Giriş",        icon: <Clock className="size-3.5" /> },
                    { label: "İşlem",            icon: null },
                  ].map(({ label, icon }) => (
                    <TableHead
                      key={label}
                      className="py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {icon}
                        {label}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageSlice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Users className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Kayıt bulunamadı.</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">Filtre veya arama kriterlerinizi değiştirin.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageSlice.map((row, idx) => (
                    <TableRow
                      key={String(row.id ?? row.userName ?? idx)}
                      className="group border-border/30 transition-colors hover:bg-muted/20"
                    >
                      {/* Avatar + full name */}
                      <TableCell className="py-3 pl-4 align-middle">
                        <div className="flex items-center gap-3">
                          <UserAvatar firstName={row.firstName as string} lastName={row.lastName as string} />
                          <span className="truncate text-sm font-semibold leading-none text-foreground">
                            {`${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* userName */}
                      <TableCell className="py-3 align-middle">
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {String(row.userName ?? "—")}
                        </span>
                      </TableCell>

                      {/* Company */}
                      <TableCell className="py-3 align-middle">
                        {row.workCompanyText ? (
                          <Badge variant="secondary" className="gap-1 font-medium">
                            <Building2 className="size-3 shrink-0" />
                            {String(row.workCompanyText)}
                          </Badge>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </TableCell>

                      {/* Department */}
                      <TableCell className="py-3 align-middle">
                        {row.departmentText ? (
                          <Badge variant="outline" className="font-medium text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800">
                            {String(row.departmentText)}
                          </Badge>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="py-3 max-w-[220px] align-middle">
                        <a
                          href={`mailto:${row.email}`}
                          className="inline-flex items-center gap-1.5 truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
                          title={String(row.email ?? "")}
                        >
                          <Mail className="size-3.5 shrink-0" />
                          {String(row.email ?? "—")}
                        </a>
                      </TableCell>

                      {/* Last login */}
                      <TableCell className="py-3 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5 shrink-0" />
                          {String(row.lastLoginDate ?? "—")}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3 pr-4 align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          id={`btn-edit-${String(row.userName ?? idx)}`}
                          className="h-8 gap-1.5 px-3 text-xs font-semibold text-indigo-600 opacity-0 hover:bg-indigo-50 hover:text-indigo-700 group-hover:opacity-100 dark:text-indigo-400 dark:hover:bg-indigo-950 transition-opacity"
                          onClick={() => navigate(`/users/detail/?id=${row.userName}`)}
                        >
                          <Pencil className="size-3.5" />
                          Düzenle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex flex-col gap-3 border-t border-border/40 bg-muted/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{searchFilteredRows.length}</span> kayıt
              {searchFilteredRows.length > 0 && (
                <> · Sayfa <span className="tabular-nums font-semibold text-foreground">{safePage + 1}</span> / <span className="tabular-nums">{totalPages}</span></>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={safePage <= 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-3.5" />
                Önceki
              </Button>

              {/* Page number pills */}
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = totalPages <= 5 ? i : Math.max(0, Math.min(safePage - 2, totalPages - 5)) + i;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setPageIndex(page)}
                      className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                        page === safePage
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              >
                Sonraki
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default DataTables;
