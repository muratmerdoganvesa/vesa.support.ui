import { CheckCircle2, Clock, ListTodo, TrendingUp, Users } from "lucide-react";
import { cn } from "lib/utils";

interface ProjectStatsPanelProps {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  avgProgress: number;
  assigneeCount: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  iconColor: string;
}

const StatCard = ({ icon, label, value, sub, accent, iconColor }: StatCardProps) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", accent)}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate leading-none">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold leading-tight tabular-nums text-foreground">
        {value}
        {sub && <span className="ml-0.5 text-xs font-semibold text-muted-foreground">{sub}</span>}
      </p>
    </div>
  </div>
);

const ProjectStatsPanel = ({
  totalTasks,
  completedTasks,
  inProgressTasks,
  avgProgress,
  assigneeCount,
}: ProjectStatsPanelProps) => {
  const stats: StatCardProps[] = [
    {
      icon: <ListTodo className="size-4" />,
      label: "Toplam Görev",
      value: totalTasks,
      accent: "bg-slate-100 dark:bg-slate-800",
      iconColor: "text-slate-600 dark:text-slate-400",
    },
    {
      icon: <CheckCircle2 className="size-4" />,
      label: "Tamamlanan",
      value: completedTasks,
      accent: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: <Clock className="size-4" />,
      label: "Devam Eden",
      value: inProgressTasks,
      accent: "bg-sky-50 dark:bg-sky-950/40",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      icon: <TrendingUp className="size-4" />,
      label: "Ort. İlerleme",
      value: avgProgress,
      sub: "%",
      accent: "bg-indigo-50 dark:bg-indigo-950/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: <Users className="size-4" />,
      label: "Atanan Kişi",
      value: assigneeCount,
      accent: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 mb-2">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};

export default ProjectStatsPanel;
