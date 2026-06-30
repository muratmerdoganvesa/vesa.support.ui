import { axiosInstance } from "utils/axiosInstance";
import type { StatsBoardItem, TicketProjectStatsPersonDto } from "../types";
import { ProjectTypes } from "api/generated";

const normalizePerson = (item: Record<string, unknown>): TicketProjectStatsPersonDto => ({
  id: String(item.id ?? item.Id ?? ""),
  fullName: String(item.fullName ?? item.FullName ?? ""),
});

const normalizeCommonFields = (item: Record<string, unknown>) => {
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

  const projectId = String(item.projectId ?? item.ProjectId ?? item.id ?? item.Id ?? "");

  return {
    id: String(item.id ?? item.Id ?? projectId),
    projectId,
    customerName: String(item.customerName ?? item.CustomerName ?? ""),
    projectDescription: String(item.projectDescription ?? item.ProjectDescription ?? ""),
    projectSubDescription: (item.projectSubDescription ?? item.ProjectSubDescription) as
      | string
      | null
      | undefined,
    createdDate: (item.createdDate ?? item.CreatedDate) as string | null | undefined,
    modules,
    employees,
    projectManager,
  };
};

const normalizeStatsItem = (item: Record<string, unknown>): StatsBoardItem | null => {
  const common = normalizeCommonFields(item);

  const rawTaskId = item.taskId ?? item.TaskId;
  const taskId =
    rawTaskId == null || rawTaskId === "" ? null : Number(rawTaskId);

  const rawStatus = item.projectStatus ?? item.ProjectStatus;
  const projectStatus =
    rawStatus == null || rawStatus === "" ? null : (Number(rawStatus) as ProjectTypes);

  const isProjectFallback =
    (taskId == null || Number.isNaN(taskId)) && projectStatus == null;

  if (isProjectFallback) {
    return {
      kind: "project",
      ...common,
      taskId: null,
      kalemName: null,
      projectStatus: null,
    };
  }

  if (taskId == null || Number.isNaN(taskId) || projectStatus == null) {
    return null;
  }

  return {
    kind: "kalem",
    ...common,
    taskId,
    kalemName: String(item.kalemName ?? item.KalemName ?? ""),
    projectStatus,
  };
};

export const fetchProjectStatistics = async (): Promise<StatsBoardItem[]> => {
  const basePath = import.meta.env.VITE_BASE_PATH || "";
  const response = await axiosInstance.get<Record<string, unknown>[]>(
    `${basePath}/api/TicketProjects/GetProjectStatistics`,
    {
      timeout: 90_000,
    },
  );

  return (response.data ?? [])
    .map(normalizeStatsItem)
    .filter((item): item is StatsBoardItem => item != null);
};
