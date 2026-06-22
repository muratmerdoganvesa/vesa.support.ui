import { BarChart3, ListTodo, Users } from "lucide-react";
import { cn } from "lib/utils";
import { PersonGanttWorkload, ProjectWorkloadSummary } from "../types";
import PersonnelWorkloadCard from "./PersonnelWorkloadCard";

interface SummaryKpiProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}

const SummaryKpi = ({ icon, label, value, sub, accent }: SummaryKpiProps) => (
  <div className="flex items-center gap-3 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm px-4 py-3 min-w-0">
    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", accent)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-800 dark:text-foreground leading-tight tabular-nums">
        {value}
        {sub && <span className="text-sm font-semibold text-slate-400 ml-0.5">{sub}</span>}
      </p>
    </div>
  </div>
);

interface PersonnelWorkloadGridProps {
  personnel: PersonGanttWorkload[];
  getPhoto: (id: string) => string | null | undefined;
  viewMode?: "company" | "project";
  selectedProject?: ProjectWorkloadSummary | null;
}

const PersonnelWorkloadGrid = ({
  personnel,
  getPhoto,
  viewMode = "company",
  selectedProject,
}: PersonnelWorkloadGridProps) => {
  const totalTasks = personnel.reduce((s, p) => s + p.totalTasks, 0);
  const avgCompletion =
    personnel.length > 0
      ? Math.round(personnel.reduce((s, p) => s + p.avgProgress, 0) / personnel.length)
      : 0;
  // const highWorkload = personnel.filter((p) => p.totalTasks > 10).length;

  const isProjectView = viewMode === "project";
  const projectLabel = selectedProject
    ? selectedProject.subProjectName
      ? `${selectedProject.projectName} – ${selectedProject.subProjectName}`
      : selectedProject.projectName
    : null;

  if (personnel.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
          <Users className="size-7 text-slate-300" aria-hidden />
        </div>
        <p className="text-slate-500 font-semibold">Görevli kişi bulunamadı</p>
        <p className="text-slate-400 text-sm max-w-xs">
          {isProjectView
            ? "Seçili projede atanmış görev bulunamadı."
            : "Seçili projelerde atanmış görev bulunamadı."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {isProjectView && projectLabel
            ? `Ekip İş Yükü - ${projectLabel}`
            : "Ekip İş Yükü"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gantt görevlerine göre kişi bazlı dağılım
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryKpi
          icon={<Users className="size-4 text-indigo-600" />}
          label="Kişi Sayısı"
          value={personnel.length}
          accent="bg-indigo-50 dark:bg-indigo-950/40"
        />
        <SummaryKpi
          icon={<ListTodo className="size-4 text-sky-600" />}
          label="Toplam Görev"
          value={totalTasks}
          accent="bg-sky-50 dark:bg-sky-950/40"
        />
        <SummaryKpi
          icon={<BarChart3 className="size-4 text-emerald-600" />}
          label="Ort. Tamamlanma"
          value={avgCompletion}
          sub="%"
          accent="bg-emerald-50 dark:bg-emerald-950/40"
        />
        {/* TODO: Yüksek Yük KPI — geliştirme sonrası açılacak
        {highWorkload > 0 && (
          <SummaryKpi
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            label="Yüksek Yük"
            value={highWorkload}
            accent="bg-amber-50 dark:bg-amber-950/40"
          />
        )}
        */}
      </div>

      {/* Person grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {personnel.map((person) => (
          <PersonnelWorkloadCard
            key={person.userId}
            person={person}
            getPhoto={getPhoto}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

export default PersonnelWorkloadGrid;
