import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpZA,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  Folder,
  ListTodo,
  Users,
} from "lucide-react";
import { cn } from "lib/utils";
import {
  getProjectTypeColumns,
  getProjectTypeColumnColors,
} from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { ProjectModuleStats } from "layouts/pages/ticketProjects/utils/buildProjectModuleStats";

type SortOrder = "az" | "za";

type SummaryKpiProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
};

const SummaryKpi = ({ icon, label, value, sub, accent }: SummaryKpiProps) => (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-border dark:bg-card">
    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accent)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-bold leading-tight tabular-nums text-slate-800 dark:text-foreground">
        {value}
        {sub && (
          <span className="ml-0.5 text-sm font-semibold text-slate-400 dark:text-muted-foreground">
            {sub}
          </span>
        )}
      </p>
    </div>
  </div>
);

type ModuleCardProps = {
  module: ProjectModuleStats;
  onModuleClick: (moduleName: string) => void;
};

const ModuleCard = ({ module, onModuleClick }: ModuleCardProps) => {
  const columns = getProjectTypeColumns();

  return (
    <button
      type="button"
      onClick={() => onModuleClick(module.moduleName)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onModuleClick(module.moduleName);
        }
      }}
      tabIndex={0}
      aria-label={`${module.moduleName} – ${module.total} kalem, filtrelemek için tıklayın`}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-sky-200 hover:shadow-md hover:ring-1 hover:ring-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-border dark:bg-card dark:hover:ring-0"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
          <Boxes className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="m-0 truncate text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-sky-700 dark:text-foreground">
              {module.moduleName}
            </p>
            <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              {module.total}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {module.donePercent === 100 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="size-2.5" aria-hidden />
                Tamamlandı
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
          <Folder className="size-2.5" aria-hidden />
          {module.projectCount} proje
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
          <Building2 className="size-2.5" aria-hidden />
          {module.customerCount} müşteri
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Users className="size-2.5" aria-hidden />
          {module.personCount} kişi
        </span>
        {module.planCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {module.planCount} plan
          </span>
        )}
      </div>

      {module.plans.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-rose-100 bg-rose-50/70 px-2.5 py-2 dark:border-rose-900/50 dark:bg-rose-950/30">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
            Planlar
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {module.plans.map((plan) => (
              <span
                key={plan}
                title={plan}
                className="max-w-full truncate rounded-full border border-rose-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
              >
                {plan}
              </span>
            ))}
          </div>
        </div>
      )}

      {module.customers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {module.customers.map((customer) => (
            <span
              key={customer}
              title={customer}
              className="max-w-full truncate rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-border dark:bg-card dark:text-muted-foreground"
            >
              {customer}
            </span>
          ))}
        </div>
      )}

      <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
        {columns.map((column) => {
          const count = module.byColumn[column.key] ?? 0;
          if (count === 0) return null;
          const colors = getProjectTypeColumnColors(column.label);
          const pct = (count / module.total) * 100;
          return (
            <div
              key={String(column.key)}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", colors.dot)}
              style={{ width: `${pct}%` }}
              title={`${column.label}: ${count}`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {columns.map((column) => {
          const count = module.byColumn[column.key] ?? 0;
          if (count === 0) return null;
          const colors = getProjectTypeColumnColors(column.label);
          return (
            <span
              key={String(column.key)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-border dark:bg-muted dark:text-muted-foreground"
            >
              <span className={cn("size-1.5 rounded-full", colors.dot)} aria-hidden />
              {column.label}
              <span className="tabular-nums text-slate-700 dark:text-foreground">{count}</span>
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-border">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-muted-foreground">
          <div className="h-1.5 w-full max-w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${module.donePercent}%` }}
            />
          </div>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {module.donePercent}%
          </span>
          <span>tamamlandı</span>
        </div>
        <span className="text-[10px] font-medium text-slate-300 transition-colors group-hover:text-sky-400 dark:text-muted-foreground/60">
          Filtreyle gör →
        </span>
      </div>
    </button>
  );
};

type ProjectStatsModulesViewProps = {
  stats: ProjectModuleStats[];
  onModuleClick: (moduleName: string) => void;
};

const ProjectStatsModulesView = ({ stats, onModuleClick }: ProjectStatsModulesViewProps) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");

  const totalItems = stats.reduce((sum, module) => sum + module.total, 0);
  const avgDone =
    stats.length > 0
      ? Math.round(stats.reduce((sum, module) => sum + module.donePercent, 0) / stats.length)
      : 0;

  const sortedStats = useMemo(
    () =>
      [...stats].sort((a, b) =>
        sortOrder === "az"
          ? a.moduleName.localeCompare(b.moduleName, "tr")
          : b.moduleName.localeCompare(a.moduleName, "tr"),
      ),
    [stats, sortOrder],
  );

  if (stats.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-muted">
          <Boxes className="size-7 text-slate-300 dark:text-muted-foreground" />
        </div>
        <p className="font-semibold text-slate-500 dark:text-foreground">Modül bulunamadı</p>
        <p className="max-w-xs text-sm text-slate-400 dark:text-muted-foreground">
          Mevcut filtrelere uygun modül yok. Filtrelerinizi genişletmeyi deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryKpi
          icon={<Boxes className="size-4 text-sky-600" />}
          label="Modül Sayısı"
          value={stats.length}
          accent="bg-sky-50 dark:bg-sky-950/40"
        />
        <SummaryKpi
          icon={<ListTodo className="size-4 text-violet-600" />}
          label="Toplam Kalem"
          value={totalItems}
          accent="bg-violet-50 dark:bg-violet-950/40"
        />
        <SummaryKpi
          icon={<BarChart3 className="size-4 text-emerald-600" />}
          label="Ort. Tamamlanma"
          value={avgDone}
          sub="%"
          accent="bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-400 dark:text-muted-foreground">
          {stats.length} modül listeleniyor
        </p>
        <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 text-xs dark:border-border">
          <button
            type="button"
            onClick={() => setSortOrder("az")}
            aria-pressed={sortOrder === "az"}
            aria-label="Ada göre A-Z sırala"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 font-medium transition-colors",
              sortOrder === "az"
                ? "bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
                : "text-slate-600 hover:bg-slate-50 dark:text-muted-foreground dark:hover:bg-muted",
            )}
          >
            <ArrowDownAZ className="size-3.5" aria-hidden />
            A-Z
          </button>
          <button
            type="button"
            onClick={() => setSortOrder("za")}
            aria-pressed={sortOrder === "za"}
            aria-label="Ada göre Z-A sırala"
            className={cn(
              "flex items-center gap-1.5 border-l border-slate-200 px-2.5 py-1.5 font-medium transition-colors dark:border-border",
              sortOrder === "za"
                ? "bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
                : "text-slate-600 hover:bg-slate-50 dark:text-muted-foreground dark:hover:bg-muted",
            )}
          >
            <ArrowUpZA className="size-3.5" aria-hidden />
            Z-A
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedStats.map((module) => (
          <ModuleCard key={module.moduleName} module={module} onModuleClick={onModuleClick} />
        ))}
      </div>
    </div>
  );
};

export default ProjectStatsModulesView;
