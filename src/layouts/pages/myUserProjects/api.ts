import {
  CompanyGanttWorkloadDto,
  ProjectTasksListDto,
  WorkCompanyDto,
} from "api/generated";
import { axiosInstance } from "utils/axiosInstance";

export const fetchMyProjectCompanies = async (): Promise<WorkCompanyDto[]> => {
  const response = await axiosInstance.get<WorkCompanyDto[]>(
    "/api/WorkCompany/GetCompanyListInProjectForUser",
  );
  return response.data ?? [];
};

export const fetchMyCompanyGanttWorkload = async (
  workCompanyId: string,
): Promise<CompanyGanttWorkloadDto> => {
  const response = await axiosInstance.get<CompanyGanttWorkloadDto>(
    "/api/ProjectTasks/GetCompanyGanttWorkloadForUser",
    { params: { workCompanyId } },
  );
  return response.data ?? { projects: [], personnel: [] };
};

export const fetchMyGanttTasks = async (
  projectId: string,
): Promise<ProjectTasksListDto[]> => {
  const response = await axiosInstance.get<ProjectTasksListDto[]>(
    "/api/ProjectTasks/GetMyGanttTasks",
    { params: { projectId } },
  );
  return response.data ?? [];
};
