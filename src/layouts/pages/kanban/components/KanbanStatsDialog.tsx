import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { cn } from "lib/utils";
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
  CalendarCheck,
  CalendarX2,
  CalendarMinus,
  TrendingUp,
} from "lucide-react";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";
import { PersonKanbanStats } from "../utils/buildPersonStats";
import { isOverdue, isDueToday, isDueThisWeek } from "../utils/dueDateHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsSnapshot {
  toplam: number;
  backlog: number;
  realization: number;
  uat: number;
  preparation: number;
  done: number;
  donePercent: number;
  criticalCount: number;
  overdueCount: number;
}

interface KanbanStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: StatsSnapshot;
  filteredData: KanbanTasksListDtoFixed[];
  personStats: PersonKanbanStats[];
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  "Release Breaker": { label: "Release Breaker", color: "#dc2626" },
  Critical:          { label: "Kritik",           color: "#ef4444" },
  High:              { label: "Yüksek",           color: "#f59e0b" },
  Normal:            { label: "Normal",           color: "#3b82f6" },
  Low:               { label: "Düşük",            color: "#22c55e" },
};
const PRIORITY_ORDER = ["Release Breaker", "Critical", "High", "Normal", "Low"];

const TYPE_COLORS: Record<string, string> = {
  Task:             "#3b82f6",
  "Proje Planlama": "#8b5cf6",
  Proje:            "#8b5cf6",
  Destek:           "#f59e0b",
  CR:               "#6366f1",
  Bug:              "#ef4444",
  Günlük:           "#22c55e",
  Ticket:           "#0ea5e9",
};

const STATUS_CONFIG = [
  { key: "backlog",     label: "Analiz",      color: "#94a3b8" },
  { key: "realization", label: "Realization", color: "#3b82f6" },
  { key: "uat",         label: "UAT",         color: "#8b5cf6" },
  { key: "preparation", label: "Cutover",     color: "#f59e0b" },
  { key: "done",        label: "Done",        color: "#10b981" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-sky-100",    text: "text-sky-700"    },
  { bg: "bg-emerald-100",text: "text-emerald-700"},
  { bg: "bg-amber-100",  text: "text-amber-700"  },
  { bg: "bg-rose-100",   text: "text-rose-700"   },
];
const avatarPalette = (n: string) => AVATAR_PALETTES[(n.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];
const getInitials  = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compact KPI card — works at any width */
const KpiCard = ({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  valueColor,
  pulse = false,
  pct,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  pulse?: boolean;
  pct?: number; // renders a small ring only when provided
}) => (
  <div className="relative flex flex-col gap-2.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm overflow-hidden">
    {/* Top row: icon + optional ring */}
    <div className="flex items-center justify-between gap-2">
      <div className={cn("flex items-center justify-center w-8 h-8 rounded-xl shrink-0 text-white", iconBg)}>
        {icon}
      </div>
      {pct !== undefined && (
        <svg viewBox="0 0 36 36" className={cn("w-9 h-9 shrink-0 -rotate-90", iconColor)}>
          <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
          />
        </svg>
      )}
    </div>

    {/* Value */}
    <div>
      <div className={cn("text-3xl font-extrabold leading-none tabular-nums tracking-tight", valueColor, pulse && "animate-pulse")}>
        {value}
      </div>
      <div className="text-[11px] font-semibold text-slate-500 mt-1 leading-tight">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sub}</div>}
    </div>
  </div>
);

/** Section title with side lines */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="flex-1 h-px bg-slate-200" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{children}</span>
    <span className="flex-1 h-px bg-slate-200" />
  </div>
);

/** Horizontal bar row */
const HBar = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-24 shrink-0 text-xs font-medium text-slate-600 truncate text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700">{value}</span>
      <span className="w-8 shrink-0 text-right text-[10px] text-slate-400 tabular-nums">{pct}%</span>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const KanbanStatsDialog: React.FC<KanbanStatsDialogProps> = ({
  open,
  onOpenChange,
  stats,
  filteredData,
  personStats,
}) => {
  // Priority distribution
  const priorityDist = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredData) map[t.Priority] = (map[t.Priority] ?? 0) + 1;
    return PRIORITY_ORDER
      .filter((p) => (map[p] ?? 0) > 0)
      .map((p) => ({ key: p, count: map[p] ?? 0, ...PRIORITY_CONFIG[p] }));
  }, [filteredData]);

  // Type distribution
  const typeDist = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredData) if (t.Type) map[t.Type] = (map[t.Type] ?? 0) + 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, color: TYPE_COLORS[type] ?? "#94a3b8" }));
  }, [filteredData]);

  // Due date breakdown
  const dueDateDist = useMemo(() => ({
    overdue:   filteredData.filter((t) => isOverdue(t)).length,
    today:     filteredData.filter((t) => isDueToday(t)).length,
    thisWeek:  filteredData.filter((t) => isDueThisWeek(t) && !isDueToday(t) && !isOverdue(t)).length,
    noDueDate: filteredData.filter((t) => !t.dueDate).length,
  }), [filteredData]);

  const statusValues: Record<string, number> = {
    backlog: stats.backlog, realization: stats.realization,
    uat: stats.uat, preparation: stats.preparation, done: stats.done,
  };

  const top5 = personStats.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        sm:max-w-[740px] overrides the built-in sm:max-w-sm via tailwind-merge.
        p-0 removes default padding so we control spacing fully.
      */}
      <DialogContent className="sm:max-w-[740px] w-full p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl gap-0">

        {/* ── Dialog Header ── */}
        <DialogHeader className="flex-row items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0 space-y-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-bold text-slate-800 leading-tight">
              Görev İstatistikleri
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              {stats.toplam} görev · aktif filtreler dahil
            </p>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto max-h-[78vh] bg-slate-50/50">
          <div className="px-6 py-5 space-y-6">

            {/* ── 1. KPI 4-column grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                icon={<Layers className="w-4 h-4" />}
                label="Toplam Görev"
                value={stats.toplam}
                sub={`${stats.toplam - stats.done} aktif`}
                iconBg="bg-slate-700"
                iconColor="text-slate-600"
                valueColor="text-slate-800"
              />
              <KpiCard
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Tamamlandı"
                value={`${stats.donePercent}%`}
                sub={`${stats.done} görev`}
                iconBg="bg-emerald-500"
                iconColor="text-emerald-500"
                valueColor="text-emerald-600"
                pct={stats.donePercent}
              />
              <KpiCard
                icon={<Clock className="w-4 h-4" />}
                label="Gecikmiş"
                value={stats.overdueCount}
                sub={stats.overdueCount === 0 ? "Gecikme yok!" : "son tarihi geçmiş"}
                iconBg="bg-red-500"
                iconColor="text-red-500"
                valueColor="text-red-600"
                pulse={stats.overdueCount > 0}
              />
              <KpiCard
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Kritik"
                value={stats.criticalCount}
                sub="Critical + Release Breaker"
                iconBg="bg-amber-500"
                iconColor="text-amber-500"
                valueColor="text-amber-600"
                pulse={stats.criticalCount > 0}
              />
            </div>

            {/* ── 2. Status distribution ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle>Durum Dağılımı</SectionTitle>

              {/* Stacked bar */}
              {stats.toplam > 0 && (
                <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-px">
                  {STATUS_CONFIG.map(({ key, label, color }) => {
                    const val = statusValues[key] ?? 0;
                    const pct = (val / stats.toplam) * 100;
                    return pct > 0 ? (
                      <div
                        key={key}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                        title={`${label}: ${val}`}
                      />
                    ) : null;
                  })}
                </div>
              )}

              <div className="space-y-2">
                {STATUS_CONFIG.map(({ key, label, color }) => (
                  <HBar key={key} label={label} value={statusValues[key] ?? 0} total={stats.toplam} color={color} />
                ))}
              </div>
            </div>

            {/* ── 3 & 4. Priority + Type side by side ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionTitle>Öncelik Dağılımı</SectionTitle>
                {priorityDist.length === 0
                  ? <p className="text-xs text-slate-400 text-center py-3">Veri yok</p>
                  : <div className="space-y-2">
                      {priorityDist.map(({ key, label, color, count }) => (
                        <HBar key={key} label={label} value={count} total={stats.toplam} color={color} />
                      ))}
                    </div>
                }
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionTitle>Tür Dağılımı</SectionTitle>
                {typeDist.length === 0
                  ? <p className="text-xs text-slate-400 text-center py-3">Veri yok</p>
                  : <div className="space-y-2">
                      {typeDist.map(({ type, count, color }) => (
                        <HBar key={type} label={type} value={count} total={stats.toplam} color={color} />
                      ))}
                    </div>
                }
              </div>
            </div>

            {/* ── 5. Due date ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle>Son Tarih Özeti</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { icon: <CalendarX2  className="w-4 h-4" />, label: "Gecikmiş",  count: dueDateDist.overdue,   iconBg: "bg-red-100",    iconColor: "text-red-600",    valueColor: "text-red-700"    },
                  { icon: <CalendarClock className="w-4 h-4" />, label: "Bugün",   count: dueDateDist.today,     iconBg: "bg-orange-100", iconColor: "text-orange-600", valueColor: "text-orange-700" },
                  { icon: <CalendarCheck className="w-4 h-4" />, label: "Bu Hafta",count: dueDateDist.thisWeek,  iconBg: "bg-amber-100",  iconColor: "text-amber-600",  valueColor: "text-amber-700"  },
                  { icon: <CalendarMinus className="w-4 h-4" />, label: "Tarihsiz",count: dueDateDist.noDueDate, iconBg: "bg-slate-100",  iconColor: "text-slate-500",  valueColor: "text-slate-600"  },
                ] as const).map(({ icon, label, count, iconBg, iconColor, valueColor }) => (
                  <div key={label} className={cn("flex items-center gap-3 rounded-xl border border-slate-100 p-3 bg-slate-50/70")}>
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0", iconBg, iconColor)}>
                      {icon}
                    </div>
                    <div>
                      <div className={cn("text-2xl font-extrabold leading-none tabular-nums", valueColor)}>{count}</div>
                      <div className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 6. Top assignees ── */}
            {top5.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <SectionTitle>Kişi Sıralaması</SectionTitle>
                <div className="divide-y divide-slate-100">
                  {top5.map((p, i) => {
                    const palette  = avatarPalette(p.name);
                    const initials = getInitials(p.name);
                    return (
                      <div key={p.userId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span className={cn(
                          "w-5 text-center text-xs font-bold tabular-nums shrink-0",
                          i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-slate-300"
                        )}>
                          {i + 1}
                        </span>

                        <div className={cn("w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0", palette.bg, palette.text)}>
                          {initials || "?"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-700 truncate">{p.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {p.criticalCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {p.criticalCount}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-emerald-600 tabular-nums">{p.donePercent}%</span>
                              <span className="text-[10px] text-slate-400 tabular-nums">{p.total} görev</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                              style={{ width: `${p.donePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {personStats.length > 5 && (
                  <p className="text-center text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                    +{personStats.length - 5} kişi daha · Kişiler görünümünden tamamına bakın
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KanbanStatsDialog;
