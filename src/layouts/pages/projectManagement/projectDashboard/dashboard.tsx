import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { WorkCompanyDto, ProjectTasksApi, UserAppDto } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";

import CompanyDashboardView from "./components/CompanyDashboardView";
import TeamDialog from "./teamMembersDialog/teamDialog";
import { useCompanyGanttWorkload } from "./hooks/useCompanyGanttWorkload";
import { ProjectWorkloadSummary } from "./types";

interface ProjectDashboardProps {
  selectedWorkCompany: WorkCompanyDto;
  onReturn: () => void;
  showTest: boolean;
  forCurrentUser?: boolean;
  chartBasePath?: string;
  listBadge?: string;
}

function ProjectDashboard({
  selectedWorkCompany,
  onReturn,
  showTest,
  forCurrentUser = false,
  chartBasePath,
  listBadge,
}: ProjectDashboardProps) {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<UserAppDto[]>([]);
  const [teamProjectId, setTeamProjectId] = useState<string>("");

  const { workload, isLoading } = useCompanyGanttWorkload(
    showTest ? selectedWorkCompany.id : undefined,
    { forCurrentUser },
  );

  const handleNavigateTickets = (projectId: string) => {
    const project = workload.projects.find((p: ProjectWorkloadSummary) => p.projectId === projectId);
    if (!project) {
      dispatchAlert({ message: "Proje bulunamadı", type: "Error" });
      return;
    }
    navigate("/solveAllTicket", {
      state: {
        workCompanyId: selectedWorkCompany.id,
        workCompanyName: selectedWorkCompany.name,
        projectId: project.projectId,
        projectName: project.projectName,
        projectSubName: project.subProjectName,
      },
    });
  };

  const handleOpenTeam = async (projectId: string) => {
    try {
      dispatchBusy({ isBusy: true });
      setTeamProjectId(projectId);
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const response = await api.apiProjectTasksGetProjectUsersWithPhotoGet(projectId, 1);
      setTeamMembers(response.data);
      setTeamDialogOpen(true);
    } catch {
      dispatchAlert({ message: "Ekip bilgileri yüklenemedi", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleTeamPageChange = async (page: number) => {
    try {
      dispatchBusy({ isBusy: true });
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const response = await api.apiProjectTasksGetProjectUsersWithPhotoGet(teamProjectId, page);
      setTeamMembers(response.data);
    } catch {
      /* ignore */
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <>
      <CompanyDashboardView
        workCompany={selectedWorkCompany}
        workload={workload}
        isLoading={isLoading}
        onReturn={onReturn}
        onNavigateTickets={handleNavigateTickets}
        onOpenTeam={handleOpenTeam}
        chartBasePath={chartBasePath}
        listBadge={listBadge}
      />

      <TeamDialog
        open={teamDialogOpen}
        onClose={() => setTeamDialogOpen(false)}
        teamMembers={teamMembers}
        selectedProjectId={teamProjectId}
        handlePageChange={handleTeamPageChange}
      />
    </>
  );
}

export default ProjectDashboard;
