import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  WorkCompanyDto,
  TicketProjectsApi,
  TicketProjectsListDto,
  ProjectTasksApi,
  UserAppDto,
} from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";

import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import {
  ArrowLeft,
  BarChart2,
  Check,
  Folder,
  Loader2,
  Search,
  Ticket,
  Users,
  X,
} from "lucide-react";
import TeamDialog from "./teamMembersDialog/teamDialog";

interface ProjectDashboardProps {
  selectedWorkCompany: WorkCompanyDto;
  onReturn: () => void;
  showTest: boolean;
}

const getProjectLabel = (p: TicketProjectsListDto) =>
  p.subProjectName ? `${p.name} - ${p.subProjectName}` : p.name;

function ProjectDashboard({ selectedWorkCompany, onReturn, showTest }: ProjectDashboardProps) {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const location = useLocation();
  const projectId = location.state?.projectId;

  const [selectedTicketProject, setSelectedTicketProject] =
    useState<TicketProjectsListDto | null>(null);
  const [projectData, setProjectData] = useState<TicketProjectsListDto[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<UserAppDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedWorkCompany || !showTest) return;
      try {
        setIsLoading(true);
        const config = getConfiguration();
        const projectApi = new TicketProjectsApi(config);
        const response = await projectApi.apiTicketProjectsGetActiveProjectsWithManagerGet(
          selectedWorkCompany.id,
        );
        setProjectData(response.data);

        if (projectId) {
          const found = response.data.find(
            (project: TicketProjectsListDto) => project.id === projectId,
          );
          if (!found) {
            setIsLoading(false);
            return;
          } else {
            setSelectedTicketProject(found);
            navigate(location.pathname, { replace: true, state: null });
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [selectedWorkCompany, showTest]);

  const handleNavigateToTickets = () => {
    if (!selectedTicketProject) {
      dispatchAlert({ message: "Lütfen bir proje seçiniz", type: "Error" });
      return;
    }
    if (!selectedWorkCompany) {
      dispatchAlert({ message: "Lütfen bir şirket seçiniz", type: "Error" });
      return;
    }
    navigate("/solveAllTicket", {
      state: {
        workCompanyId: selectedWorkCompany?.id,
        workCompanyName: selectedWorkCompany?.name,
        projectId: selectedTicketProject?.id,
        projectName: selectedTicketProject?.name,
        projectSubName: selectedTicketProject?.subProjectName,
      },
    });
  };

  const handleTeamMembersDialog = async () => {
    if (!selectedTicketProject) {
      dispatchAlert({ message: "Lütfen bir proje seçiniz", type: "Error" });
      return;
    }
    if (!selectedWorkCompany) {
      dispatchAlert({ message: "Lütfen bir şirket seçiniz", type: "Error" });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      const config = getConfiguration();
      const projectApi = new ProjectTasksApi(config);
      const response = await projectApi.apiProjectTasksGetProjectUsersWithPhotoGet(
        selectedTicketProject?.id,
        1,
      );
      setTeamMembers(response.data);
      setOpen(true);
    } catch (error) {
      console.log(error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handlePageChange = async (page: number) => {
    try {
      dispatchBusy({ isBusy: true });
      const config = getConfiguration();
      const projectApi = new ProjectTasksApi(config);
      const response = await projectApi.apiProjectTasksGetProjectUsersWithPhotoGet(
        selectedTicketProject?.id,
        page,
      );
      setTeamMembers(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const filteredProjects = projectData.filter((p) =>
    getProjectLabel(p).toLowerCase().includes(projectSearch.toLowerCase()),
  );

  return (
    <div className="relative h-full overflow-y-auto bg-background">
      {/* ── Loading overlay ────────────────────────────────────────── */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 className="size-9 animate-spin text-indigo-600" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">
            {projectId ? "Seçili proje yükleniyor..." : "Projeler yükleniyor..."}
          </p>
        </div>
      )}

      {/* ── Sticky top bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectedTicketProject(null);
            onReturn();
          }}
          aria-label="Geri dön"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Geri
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {selectedWorkCompany?.name}
          </span>
          <Badge
            variant="secondary"
            className="hidden bg-indigo-100 text-indigo-700 text-xs sm:inline-flex dark:bg-indigo-950 dark:text-indigo-300"
          >
            Proje Yönetimi
          </Badge>
        </div>
      </div>

      <div className=" px-4 py-6 sm:px-6">
        {/* ── Two-column layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* ── LEFT: Project selector ─────────────────────────── */}
          <div className="lg:col-span-4">
            <div className="sticky top-[57px] rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/60 px-4 py-3">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Proje Seç
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {projectData.length} proje mevcut
                </p>
              </div>

              {/* Search */}
              <div className="border-b border-border/40 px-3 py-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    placeholder="Proje ara..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="h-8 pl-8 pr-7 text-sm"
                    aria-label="Proje ara"
                  />
                  {projectSearch && (
                    <button
                      type="button"
                      aria-label="Aramayı temizle"
                      onClick={() => setProjectSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded text-muted-foreground/60 hover:text-foreground"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  )}
                </div>
              </div>

              {/* Project list */}
              <div
                role="listbox"
                aria-label="Proje listesi"
                className="max-h-72 overflow-y-auto overscroll-contain"
              >
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => {
                    const isSelected = selectedTicketProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedTicketProject(p)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-border/30 px-4 py-3 text-left last:border-0",
                          "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Folder
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            isSelected ? "text-indigo-500" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 font-medium leading-snug">
                          {getProjectLabel(p)}
                        </span>
                        {isSelected && (
                          <Check className="mt-0.5 size-3.5 shrink-0 text-indigo-500" aria-hidden />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Proje bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Details + Actions ───────────────────────── */}
          <div className="space-y-5 lg:col-span-8">
            {/* Project info card */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/60 px-5 py-3">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Proje Bilgileri
                </h3>
              </div>

              {selectedTicketProject ? (
                <div className="grid grid-cols-1 gap-0 divide-y divide-border/40 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  {/* Left: general info */}
                  <div className="space-y-3 px-5 py-4">
                    <InfoRow label="Proje Tanımı" value={selectedTicketProject.name} />
                    <InfoRow
                      label="Proje Alt Tanımı"
                      value={selectedTicketProject.subProjectName ?? "—"}
                    />
                    <InfoRow label="Proje Riskleri" value={selectedTicketProject.risks ?? "—"} />
                    <InfoRow
                      label="Modül"
                      value={selectedTicketProject.module?.name ?? "—"}
                    />
                    <InfoRow
                      label="Destek Süresi"
                      value={selectedTicketProject.projectSupportPeriod ?? "—"}
                    />
                  </div>

                  {/* Right: metadata */}
                  <div className="space-y-3 px-5 py-4">
                    <MetaRow
                      label="Oluşturulma"
                      value={
                        selectedTicketProject.createdDate
                          ? new Date(selectedTicketProject.createdDate).toLocaleDateString("tr-TR")
                          : "—"
                      }
                    />
                    <MetaRow
                      label="Kategori"
                      value={selectedTicketProject.projectCategory?.name ?? "—"}
                    />
                    <MetaRow
                      label="Yönetici"
                      value={
                        selectedTicketProject.manager
                          ? `${selectedTicketProject.manager.firstName ?? ""} ${selectedTicketProject.manager.lastName ?? ""}`.trim()
                          : "—"
                      }
                    />
                    <MetaRow
                      label="Proje Süresi"
                      value={selectedTicketProject.projectPeriod ?? "—"}
                    />
                    <MetaRow
                      label="Masraf Durumu"
                      value={selectedTicketProject.costStatus ?? "—"}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Folder
                    className="size-10 text-muted-foreground/30"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <p className="text-sm text-muted-foreground">
                    Bilgileri görüntülemek için bir proje seçin.
                  </p>
                </div>
              )}
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ActionCard
                icon={<BarChart2 className="size-6 text-white" aria-hidden />}
                iconBg="bg-linear-to-br from-[#4776E6] to-[#8E54E9]"
                iconShadow="shadow-[0_6px_14px_rgba(71,118,230,0.35)]"
                title="Gantt Chart"
                description="Zaman çizelgesi, bağımlılıklar ve görev planlaması."
                buttonLabel="Görüntüle"
                buttonStyle="indigo"
                onAction={() => {
                  if (!selectedTicketProject) {
                    dispatchAlert({ message: "Lütfen bir proje seçiniz", type: "Error" });
                    return;
                  }
                  if (!selectedWorkCompany) {
                    dispatchAlert({ message: "Lütfen bir şirket seçiniz", type: "Error" });
                    return;
                  }
                  navigate(
                    `/projectmanagement/chart?cid=${encodeURIComponent(selectedWorkCompany.id)}&pid=${encodeURIComponent(selectedTicketProject.id)}`,
                    {
                      state: {
                        workCompanyName: selectedWorkCompany.name,
                        projectName: selectedTicketProject.name,
                        projectSubName: selectedTicketProject.subProjectName,
                      },
                    }
                  );
                }}
              />

              <ActionCard
                icon={<Ticket className="size-6 text-white" aria-hidden />}
                iconBg="bg-linear-to-br from-[#43A047] to-[#66BB6A]"
                iconShadow="shadow-[0_6px_14px_rgba(67,160,71,0.35)]"
                title="Tickets"
                description="Ticketları ve görevleri yönetin, ilerlemeyi takip edin."
                buttonLabel="Görüntüle"
                buttonStyle="green"
                onAction={handleNavigateToTickets}
              />

              <ActionCard
                icon={<Users className="size-6 text-white" aria-hidden />}
                iconBg="bg-linear-to-br from-[#5C6BC0] to-[#7986CB]"
                iconShadow="shadow-[0_6px_14px_rgba(92,107,192,0.35)]"
                title="Ekip"
                description="Projeye atanmış ekip üyelerini ve yöneticiyi görün."
                buttonLabel="Görüntüle"
                buttonStyle="slate"
                onAction={handleTeamMembersDialog}
              />
            </div>
          </div>
        </div>
      </div>

      <TeamDialog
        open={open}
        onClose={() => setOpen(false)}
        teamMembers={teamMembers}
        selectedProjectId={selectedTicketProject?.id || ""}
        handlePageChange={handlePageChange}
      />
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

const buttonStyleMap = {
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  slate: "bg-slate-700 text-white hover:bg-slate-800",
} as const;

interface ActionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconShadow: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonStyle: keyof typeof buttonStyleMap;
  onAction: () => void;
}

function ActionCard({
  icon,
  iconBg,
  iconShadow,
  title,
  description,
  buttonLabel,
  buttonStyle,
  onAction,
}: ActionCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "mb-3 flex size-12 shrink-0 items-center justify-center rounded-xl",
          iconBg,
          iconShadow,
        )}
        aria-hidden
      >
        {icon}
      </div>

      <h5 className="mb-1 text-sm font-semibold tracking-tight text-foreground">{title}</h5>
      <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{description}</p>

      <button
        type="button"
        onClick={onAction}
        className={cn(
          "w-full rounded-lg px-3 py-2 text-xs font-semibold transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          buttonStyleMap[buttonStyle],
        )}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default ProjectDashboard;
