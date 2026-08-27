import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Loader2,
  Ticket,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import { cn } from "lib/utils";
import { useUserPhotos } from "layouts/pages/kanban/hooks/useUserPhotos";
import { WorkCompanyDto } from "api/generated";
import { ProjectWorkloadSummary, CompanyGanttWorkload } from "../types";
import DashboardKpiRow from "./DashboardKpiRow";
import ProjectListPanel from "./ProjectListPanel";
import PersonnelWorkloadGrid from "./PersonnelWorkloadGrid";
import { filterPersonnelForProject } from "../utils/filterPersonnelForProject";

// ─── Project detail side panel ────────────────────────────────────────────────

const buttonStyleMap = {
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  slate: "bg-slate-700 text-white hover:bg-slate-800",
} as const;

interface ActionButtonProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonStyle: keyof typeof buttonStyleMap;
  onAction: () => void;
}

const ActionCard = ({
  icon,
  iconBg,
  title,
  description,
  buttonLabel,
  buttonStyle,
  onAction,
}: ActionButtonProps) => (
  <div
    className={cn(
      "group flex flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm",
      "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
    )}
  >
    <div
      className={cn("mb-3 flex size-10 shrink-0 items-center justify-center rounded-xl", iconBg)}
      aria-hidden
    >
      {icon}
    </div>
    <h3 className="mb-0.5 text-sm font-semibold tracking-tight text-foreground">{title}</h3>
    <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    <button
      type="button"
      onClick={onAction}
      tabIndex={0}
      aria-label={`${title} — ${buttonLabel}`}
      className={cn(
        "w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        buttonStyleMap[buttonStyle],
      )}
    >
      {buttonLabel}
    </button>
  </div>
);

interface ProjectDetailPanelProps {
  project: ProjectWorkloadSummary | null;
  workCompany: WorkCompanyDto;
  onClose: () => void;
  onNavigateTickets: () => void;
  onOpenTeam: () => void;
  onNavigateGantt: () => void;
}

const ProjectDetailPanel = ({
  project,
  workCompany,
  onClose,
  onNavigateTickets,
  onOpenTeam,
  onNavigateGantt,
}: ProjectDetailPanelProps) => {
  if (!project) return null;

  const label = project.subProjectName
    ? `${project.projectName} – ${project.subProjectName}`
    : project.projectName;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/60 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground truncate">{label}</h3>
            {!project.isActive && (
              <Badge variant="outline" className="text-[10px]">Pasif</Badge>
            )}
          </div>
          {project.managerName && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              Yönetici: {project.managerName}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Proje detayını kapat"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40">
        {[
          { label: "Görev", value: project.taskCount },
          { label: "Tamamlanma", value: `${project.avgProgress}%` },
          { label: "Kişi", value: project.assigneeCount },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center py-3 px-2">
            <span className="text-base font-bold tabular-nums text-foreground">{stat.value}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <ActionCard
          icon={<BarChart2 className="size-5 text-white" aria-hidden />}
          iconBg="bg-gradient-to-br from-[#4776E6] to-[#8E54E9] shadow-[0_4px_10px_rgba(71,118,230,0.3)]"
          title="Gantt Chart"
          description="Zaman çizelgesi ve bağımlılıklar."
          buttonLabel="Görüntüle"
          buttonStyle="indigo"
          onAction={onNavigateGantt}
        />
        <ActionCard
          icon={<Ticket className="size-5 text-white" aria-hidden />}
          iconBg="bg-gradient-to-br from-[#43A047] to-[#66BB6A] shadow-[0_4px_10px_rgba(67,160,71,0.3)]"
          title="Tickets"
          description="Görevleri yönetin ve takip edin."
          buttonLabel="Görüntüle"
          buttonStyle="green"
          onAction={onNavigateTickets}
        />
        <ActionCard
          icon={<Users className="size-5 text-white" aria-hidden />}
          iconBg="bg-gradient-to-br from-[#5C6BC0] to-[#7986CB] shadow-[0_4px_10px_rgba(92,107,192,0.3)]"
          title="Ekip"
          description="Projeye atanmış ekip üyeleri."
          buttonLabel="Görüntüle"
          buttonStyle="slate"
          onAction={onOpenTeam}
        />
      </div>
    </div>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────

interface CompanyDashboardViewProps {
  workCompany: WorkCompanyDto;
  workload: CompanyGanttWorkload;
  isLoading: boolean;
  onReturn: () => void;
  onNavigateTickets: (projectId: string) => void;
  onOpenTeam: (projectId: string) => void;
  chartBasePath?: string;
  listBadge?: string;
}

const CompanyDashboardView = ({
  workCompany,
  workload,
  isLoading,
  onReturn,
  onNavigateTickets,
  onOpenTeam,
  chartBasePath = "/projectmanagement/chart",
  listBadge = "Proje Yönetimi",
}: CompanyDashboardViewProps) => {
  const navigate = useNavigate();
  const { getPhoto } = useUserPhotos();
  const [selectedProject, setSelectedProject] = useState<ProjectWorkloadSummary | null>(null);

  const activeProjects = workload.projects.filter((p) => p.isActive).length;
  const totalTasks = workload.projects.reduce((s, p) => s + p.taskCount, 0);
  const avgProgress =
    workload.projects.length > 0
      ? Math.round(workload.projects.reduce((s, p) => s + p.avgProgress, 0) / workload.projects.length)
      : 0;

  const handleSelectProject = (project: ProjectWorkloadSummary) => {
    setSelectedProject((prev) => (prev?.projectId === project.projectId ? null : project));
  };

  const displayPersonnel = useMemo(() => {
    if (!selectedProject) return workload.personnel;
    return filterPersonnelForProject(workload.personnel, selectedProject.projectId);
  }, [workload.personnel, selectedProject]);

  const handleNavigateGantt = () => {
    if (!selectedProject) return;
    navigate(
      `${chartBasePath}?cid=${encodeURIComponent(workCompany.id ?? "")}&pid=${encodeURIComponent(selectedProject.projectId)}`,
      {
        state: {
          workCompanyName: workCompany.name,
          projectName: selectedProject.projectName,
          projectSubName: selectedProject.subProjectName,
        },
      },
    );
  };

  return (
    <div className="relative h-full overflow-y-auto bg-background">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 className="size-9 animate-spin text-indigo-600" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">Proje verileri yükleniyor...</p>
        </div>
      )}

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onReturn}
          aria-label="Şirket seçimine geri dön"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Geri
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-foreground truncate">
            {workCompany.name}
          </span>
          {selectedProject && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
              <span className="text-sm text-muted-foreground/80 truncate hidden sm:inline">
                {selectedProject.projectName}
              </span>
            </>
          )}
          <Badge
            variant="secondary"
            className="hidden bg-indigo-100 text-indigo-700 text-xs sm:inline-flex dark:bg-indigo-950 dark:text-indigo-300 shrink-0"
          >
            {listBadge}
          </Badge>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 flex flex-col gap-6">
        {/* Company header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{workCompany.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workload.projects.length} proje · {workload.personnel.length} ekip üyesi
          </p>
        </div>

        {/* KPI row */}
        <DashboardKpiRow
          totalProjects={workload.projects.length}
          activeProjects={activeProjects}
          totalTasks={totalTasks}
          avgProgress={avgProgress}
        />

        {/* Project detail panel (when a project is selected) */}
        {selectedProject && (
          <ProjectDetailPanel
            project={selectedProject}
            workCompany={workCompany}
            onClose={() => setSelectedProject(null)}
            onNavigateTickets={() => onNavigateTickets(selectedProject.projectId)}
            onOpenTeam={() => onOpenTeam(selectedProject.projectId)}
            onNavigateGantt={handleNavigateGantt}
          />
        )}

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: project list */}
          <div className="lg:col-span-4">
            <div className="sticky top-[57px]">
              <ProjectListPanel
                projects={workload.projects}
                selectedProjectId={selectedProject?.projectId ?? null}
                onSelect={handleSelectProject}
              />
            </div>
          </div>

          {/* Right: personnel workload */}
          <div className="lg:col-span-8">
            <PersonnelWorkloadGrid
              personnel={displayPersonnel}
              getPhoto={getPhoto}
              viewMode={selectedProject ? "project" : "company"}
              selectedProject={selectedProject}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboardView;
