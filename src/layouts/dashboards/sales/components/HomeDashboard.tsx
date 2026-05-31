import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Progress } from "components/ui/progress";
import { Button } from "components/ui/button";
import { Skeleton } from "components/ui/skeleton";
import {
  KanbanApi,
  DashboardsApi,
  type KanbanStatsDto,
  type ProjectCompletionStatsDto,
  type TicketWeeklyTrendDto,
  type GetSumTicketDto,
} from "api/generated/api";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import {
  Layers,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  LayoutGrid,
  Target,
  Activity,
  BarChart3,
  ChevronRight,
  Ticket,
  Folder,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HomeDashboardProps {
  userId?: string | null;
  userName?: string;
  ticketKpis: GetSumTicketDto;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = [
  { key: "Backlog",      label: "Backlog",      dotClass: "bg-slate-400",   barColor: "#94a3b8" },
  { key: "Realization",  label: "Geliştirme",   dotClass: "bg-blue-500",    barColor: "#3b82f6" },
  { key: "UAT",          label: "UAT",           dotClass: "bg-amber-400",   barColor: "#f59e0b" },
  { key: "Preparation",  label: "Hazırlık",      dotClass: "bg-orange-500",  barColor: "#f97316" },
  { key: "Done",         label: "Tamamlandı",    dotClass: "bg-emerald-500", barColor: "#10b981" },
] as const;

const PRIORITY_CONFIG = [
  { key: "Low",              label: "Düşük",           color: "#94a3b8" },
  { key: "Normal",           label: "Normal",          color: "#3b82f6" },
  { key: "High",             label: "Yüksek",          color: "#f59e0b" },
  { key: "Critical",         label: "Kritik",          color: "#ef4444" },
  { key: "Release Breaker",  label: "Release Breaker", color: "#8b5cf6" },
] as const;

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function CardSkeleton({ height = 220 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

// ─── KPI card strip ───────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  loading?: boolean;
  onClick?: () => void;
}

function KpiCard({ title, value, icon, gradient, loading, onClick }: KpiCardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title} detayı` : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
      className={`relative overflow-hidden rounded-xl bg-linear-to-br ${gradient} p-4 shadow-md ring-1 ring-white/10 ${onClick ? "cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg" : ""}`}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">{title}</p>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
          {icon}
        </div>
      </div>
      <div className="relative mt-2">
        {loading ? (
          <Skeleton className="h-8 w-14 bg-white/20" />
        ) : (
          <p className="text-3xl font-extrabold tabular-nums leading-none text-white">{value}</p>
        )}
      </div>
      {onClick && (
        <div className="relative mt-1.5 flex items-center gap-1 text-[11px] font-medium text-white/70">
          Detaylar <ChevronRight className="size-3" />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeDashboard({ userId, userName, ticketKpis }: HomeDashboardProps) {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();

  const [kanbanStats, setKanbanStats]     = useState<KanbanStatsDto | null>(null);
  const [projectStats, setProjectStats]   = useState<ProjectCompletionStatsDto[]>([]);
  const [weeklyTrend, setWeeklyTrend]     = useState<TicketWeeklyTrendDto[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const conf       = getConfiguration();
        const kanbanApi  = new KanbanApi(conf);
        const dashApi    = new DashboardsApi(conf);

        const [kanbanStatsRes, projectStatsRes, weeklyTrendRes] = await Promise.allSettled([
          kanbanApi.apiKanbanGetKanbanStatsGet(1),
          kanbanApi.apiKanbanGetProjectCompletionStatsGet(),
          dashApi.apiDashboardsGetTicketWeeklyTrendGet(userId, 8),
        ]);

        if (kanbanStatsRes.status  === "fulfilled") setKanbanStats(kanbanStatsRes.value.data);
        if (projectStatsRes.status === "fulfilled") setProjectStats(projectStatsRes.value.data ?? []);
        if (weeklyTrendRes.status  === "fulfilled") setWeeklyTrend(weeklyTrendRes.value.data ?? []);
      } catch {
        dispatchAlert({ message: "Dashboard verisi yüklenirken hata oluştu.", type: "Error" });
      } finally {
        setLoading(false);
      }
    };

    void fetchHomeData();
  }, [userId]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  const totalKanban      = kanbanStats?.totalCount ?? 0;
  const completionRate   = Math.round(kanbanStats?.completionRate ?? 0);
  const overdueCount     = kanbanStats?.overdueCount ?? 0;

  // ── Weekly trend chart ──────────────────────────────────────────────────────

  const trendData = {
    labels: weeklyTrend.map((w) => w.weekLabel ?? ""),
    datasets: [
      {
        label: "Oluşturulan",
        data: weeklyTrend.map((w) => w.created ?? 0),
        backgroundColor: "rgba(99, 102, 241, 0.85)",
        borderRadius: 5,
        borderSkipped: false as const,
      },
      {
        label: "Çözümlenen",
        data: weeklyTrend.map((w) => w.resolved ?? 0),
        backgroundColor: "rgba(16, 185, 129, 0.85)",
        borderRadius: 5,
        borderSkipped: false as const,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 10 }, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  // ── Priority donut chart ────────────────────────────────────────────────────

  const activePriorities = PRIORITY_CONFIG.filter(
    (p) => (kanbanStats?.byPriority?.[p.key] ?? 0) > 0,
  );

  const donutData = {
    labels:   activePriorities.map((p) => p.label),
    datasets: [
      {
        data:            activePriorities.map((p) => kanbanStats?.byPriority?.[p.key] ?? 0),
        backgroundColor: activePriorities.map((p) => p.color),
        borderWidth:     2,
        borderColor:     "#ffffff",
      },
    ],
  };

  const donutOptions = {
    responsive:          true,
    maintainAspectRatio: false,
    cutout:              "68%",
    plugins: {
      legend:  { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            ` ${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
  };

  // ── KPI cards config ────────────────────────────────────────────────────────

  const kpiCards: KpiCardProps[] = [
    {
      title:    "Toplam Talep",
      value:    ticketKpis.sumCount ?? 0,
      icon:     <Ticket className="size-4" />,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title:    "Açık Talep",
      value:    ticketKpis.openCount ?? 0,
      icon:     <FolderOpen className="size-4" />,
      gradient: "from-rose-500 to-red-500",
      onClick:  () => navigate("/solveAllTicket", { state: { onlyAllTicket: true } }),
    },
    {
      title:    "Çözümlenen",
      value:    ticketKpis.resolvedCount ?? 0,
      icon:     <CheckCircle2 className="size-4" />,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title:    "Kanban Görevleri",
      value:    loading ? 0 : totalKanban,
      icon:     <Layers className="size-4" />,
      gradient: "from-indigo-500 to-blue-500",
      loading:  loading,
      onClick:  () => navigate("/kanban"),
    },
    {
      title:    "Tamamlanma",
      value:    loading ? "—" : `${completionRate}%`,
      icon:     <Target className="size-4" />,
      gradient: "from-cyan-500 to-sky-500",
      loading:  loading,
      onClick:  () => navigate("/kanban"),
    },
  ];

  // ── Quick actions ───────────────────────────────────────────────────────────

  const quickActions = [
    {
      label:    "Kanban Board",
      desc:     "Görevleri görüntüle ve yönet",
      icon:     <LayoutGrid className="size-5" />,
      gradient: "from-indigo-500 to-violet-600",
      path:     "/kanban",
    },
    {
      label:    "Açık Talepler",
      desc:     "Müşteri taleplerini incele",
      icon:     <FolderOpen className="size-5" />,
      gradient: "from-rose-500 to-red-500",
      path:     "/tickets/customer",
    },
    {
      label:    "Yeni Talep",
      desc:     "Hızlıca talep oluştur",
      icon:     <Plus className="size-5" />,
      gradient: "from-emerald-500 to-teal-500",
      path:     "/tickets/detail",
    },
    {
      label:    "Projeler",
      desc:     "Tüm projeleri görüntüle",
      icon:     <Folder className="size-5" />,
      gradient: "from-amber-500 to-orange-500",
      path:     "/ticketProjects",
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-6">

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-1/4 size-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-10 top-1/2 size-40 rounded-full bg-black/10" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-200">{today}</p>
            <h1 className="text-2xl font-bold leading-tight text-white">
              Hoş geldiniz, {userName || "Kullanıcı"}
            </h1>
            <p className="text-sm text-indigo-200/90">
              {ticketKpis.openCount
                ? `Sistemde ${ticketKpis.openCount} açık talep bulunuyor.`
                : "Sistemde bekleyen açık talep bulunmuyor."}
              {overdueCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 font-semibold text-rose-300">
                  <AlertTriangle className="size-3.5" />
                  {overdueCount} gecikmiş görev
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Button
              type="button"
              onClick={() => navigate("/kanban")}
              className="h-9 gap-2 bg-white/15 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/25"
            >
              <LayoutGrid className="size-4" />
              Kanban Board
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/tickets/detail")}
              className="h-9 gap-2 bg-white text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="size-4" />
              Yeni Talep
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      {/* ── Middle Grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Weekly Trend – 2/3 */}
        <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="size-4 text-indigo-500" />
              Haftalık Talep Trendi
              <Badge variant="secondary" className="ml-auto text-[10px]">Son 8 Hafta</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <CardSkeleton height={220} />
            ) : weeklyTrend.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="size-8 opacity-30" />
                Trend verisi bulunamadı.
              </div>
            ) : (
              <div style={{ height: 220 }}>
                <Bar data={trendData} options={trendOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Donut – 1/3 */}
        <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-violet-500" />
              Öncelik Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <CardSkeleton height={220} />
            ) : totalKanban === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Layers className="size-8 opacity-30" />
                Kanban görevi bulunamadı.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Donut */}
                <div className="relative mx-auto" style={{ width: 148, height: 148 }}>
                  <Doughnut data={donutData} options={donutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold tabular-nums text-foreground">
                      {totalKanban}
                    </span>
                    <span className="text-[10px] text-muted-foreground">görev</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-1.5">
                  {PRIORITY_CONFIG.map((p) => {
                    const count = kanbanStats?.byPriority?.[p.key] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={p.key} className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="flex-1 text-xs text-muted-foreground">{p.label}</span>
                        <span className="tabular-nums text-xs font-semibold text-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Kanban Status Breakdown – 1/3 */}
        <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Layers className="size-4 text-indigo-500" />
                Kanban Durumu
              </CardTitle>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="gap-1 text-[10px]">
                  <AlertTriangle className="size-3" />
                  {overdueCount} gecikmiş
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {STATUS_CONFIG.map((s) => {
                  const count = kanbanStats?.byStatus?.[s.key] ?? 0;
                  const pct   = totalKanban > 0 ? Math.round((count / totalKanban) * 100) : 0;
                  return (
                    <div key={s.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`size-2.5 shrink-0 rounded-full ${s.dotClass}`} />
                          <span className="text-xs font-medium text-foreground">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums text-[11px] text-muted-foreground">{pct}%</span>
                          <span className="tabular-nums text-xs font-semibold text-foreground">{count}</span>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}

                {/* Completion footer */}
                <div className="border-t border-border/40 pt-2.5">
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Genel tamamlanma oranı</span>
                    <span className="font-bold text-emerald-600">{completionRate}%</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-full gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
                    onClick={() => navigate("/kanban")}
                  >
                    Kanban Board
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Completion – 2/3 */}
        <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="size-4 text-indigo-500" />
                Proje Tamamlanma Oranları
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                onClick={() => navigate("/ticketProjects")}
              >
                Tüm Projeler
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : projectStats.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Folder className="size-8 opacity-30" />
                Aktif proje bulunamadı.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {projectStats.slice(0, 6).map((proj) => {
                  const rate       = Math.round(proj.completionRate ?? 0);
                  const rateColor  =
                    rate >= 80  ? "text-emerald-600"
                    : rate >= 50 ? "text-amber-600"
                    : "text-rose-500";
                  const trackColor =
                    rate >= 80  ? "bg-emerald-500"
                    : rate >= 50 ? "bg-amber-400"
                    : "bg-rose-400";
                  return (
                    <div
                      key={proj.projectId}
                      role="button"
                      tabIndex={0}
                      aria-label={`${proj.projectName} projesine git`}
                      onClick={() => navigate(`/kanban?projectId=${proj.projectId ?? ""}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          navigate(`/kanban?projectId=${proj.projectId ?? ""}`);
                      }}
                      className="cursor-pointer space-y-2 rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight text-foreground line-clamp-1">
                          {proj.projectName ?? "Proje"}
                        </p>
                        <span className={`shrink-0 tabular-nums text-sm font-bold ${rateColor}`}>
                          {rate}%
                        </span>
                      </div>

                      {/* Custom colored track */}
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${trackColor}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {proj.done ?? 0} / {proj.total ?? 0} görev tamamlandı
                        </span>
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="h-4 w-0.5 rounded-full bg-linear-to-b from-indigo-500 to-violet-600" />
          Hızlı Erişim
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              aria-label={action.label}
              onClick={() => navigate(action.path)}
              className={`group flex items-center gap-3 rounded-xl bg-linear-to-r ${action.gradient} p-4 text-left shadow-md ring-1 ring-white/10 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                {action.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{action.label}</p>
                <p className="truncate text-[11px] text-white/70">{action.desc}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
