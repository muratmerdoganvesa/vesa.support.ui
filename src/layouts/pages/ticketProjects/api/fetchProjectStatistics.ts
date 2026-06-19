import { axiosInstance } from "utils/axiosInstance";
import type { TicketProjectStatsDto, TicketProjectStatsPersonDto } from "../types";
import { ProjectTypes } from "api/generated";

const normalizePerson = (item: Record<string, unknown>): TicketProjectStatsPersonDto => ({
  id: String(item.id ?? item.Id ?? ""),
  fullName: String(item.fullName ?? item.FullName ?? ""),
});

const normalizeStatsItem = (item: Record<string, unknown>): TicketProjectStatsDto => {
  const rawStatus = item.projectStatus ?? item.ProjectStatus;
  const projectStatus =
    rawStatus == null ? null : (Number(rawStatus) as ProjectTypes);

  const rawModules = item.modules ?? item.Modules;
  const modules = Array.isArray(rawModules) ? rawModules.map(String) : [];

  const rawEmployees = item.employees ?? item.Employees;
  const employees = Array.isArray(rawEmployees)
    ? rawEmployees.map((e) => normalizePerson(e as Record<string, unknown>))
    : [];

  const rawManager = item.projectManager ?? item.ProjectManager;
  const projectManager =
    rawManager && typeof rawManager === "object"
      ? normalizePerson(rawManager as Record<string, unknown>)
      : null;

  return {
    id: String(item.id ?? item.Id ?? ""),
    customerName: String(item.customerName ?? item.CustomerName ?? ""),
    projectDescription: String(item.projectDescription ?? item.ProjectDescription ?? ""),
    projectSubDescription: (item.projectSubDescription ?? item.ProjectSubDescription) as
      | string
      | null
      | undefined,
    createdDate: (item.createdDate ?? item.CreatedDate) as string | null | undefined,
    projectStatus,
    modules,
    employees,
    projectManager,
  };
};

export const fetchProjectStatistics = async (
  workCompanyId?: string,
): Promise<TicketProjectStatsDto[]> => {
  const basePath = import.meta.env.VITE_BASE_PATH || "";
  const response = await axiosInstance.get<Record<string, unknown>[]>(
    `${basePath}/api/TicketProjects/GetProjectStatistics`,
    {
      params: {
        workCompanyId: workCompanyId || undefined,
      },
      timeout: 90_000,
    },
  );

  return (response.data ?? []).map(normalizeStatsItem);
};
