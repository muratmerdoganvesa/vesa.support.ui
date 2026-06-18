import { Briefcase, CheckCircle2, ListTodo, TrendingUp } from "lucide-react";
import { cn } from "lib/utils";

interface KpiItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  iconColor: string;
}

interface DashboardKpiRowProps {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  avgProgress: number;
}

const KpiCard = ({ icon, label, value, sub, accent, iconColor }: KpiItem) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", accent)}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
        {label}
      </p>
      <p className="text-xl font-bold leading-tight tabular-nums text-foreground">
        {value}
        {sub && <span className="ml-0.5 text-sm font-semibold text-muted-foreground">{sub}</span>}
      </p>
    </div>
  </div>
);

const DashboardKpiRow = ({ totalProjects, activeProjects, totalTasks, avgProgress }: DashboardKpiRowProps) => {
  const items: KpiItem[] = [
    {
      icon: <Briefcase className="size-4" />,
      label: "Toplam Proje",
      value: totalProjects,
      accent: "bg-indigo-50 dark:bg-indigo-950/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: <CheckCircle2 className="size-4" />,
      label: "Aktif Proje",
      value: activeProjects,
      accent: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: <ListTodo className="size-4" />,
      label: "Toplam Görev",
      value: totalTasks,
      accent: "bg-sky-50 dark:bg-sky-950/40",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      icon: <TrendingUp className="size-4" />,
      label: "Ort. Tamamlanma",
      value: avgProgress,
      sub: "%",
      accent: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
};

export default DashboardKpiRow;
