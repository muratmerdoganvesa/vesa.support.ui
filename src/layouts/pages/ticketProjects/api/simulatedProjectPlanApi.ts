import { axiosInstance } from "utils/axiosInstance";
import { ProjectTypes } from "api/generated";
import type { StatsBoardItem, TicketProjectStatsPersonDto } from "../types";

export type SimulatedProjectPlanPayload = {
  customerName: string;
  projectDescription: string;
  projectSubDescription?: string | null;
  projectStatus?: ProjectTypes | null;
  modules?: string[];
  employeeUserIds?: string[];
  projectManagerId?: string | null;
};

export type UpdateSimulatedProjectPlanPayload = SimulatedProjectPlanPayload & {
  id: string;
  isActive?: boolean;
};

const normalizePerson = (item: Record<string, unknown>): TicketProjectStatsPersonDto => ({
  id: String(item.id ?? item.Id ?? ""),
  fullName: String(item.fullName ?? item.FullName ?? ""),
});

export const normalizeSimulatedPlanItem = (
  item: Record<string, unknown>,
): StatsBoardItem => {
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

  const id = String(item.id ?? item.Id ?? "");
  const rawStatus = item.projectStatus ?? item.ProjectStatus;
  const projectStatus =
    rawStatus == null || rawStatus === "" ? null : (Number(rawStatus) as ProjectTypes);

  const rawIsActive = item.isActive ?? item.IsActive;

  return {
    kind: "simulated",
    id,
    projectId: id,
    isActive: rawIsActive == null ? true : Boolean(rawIsActive),
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
    taskId: null,
    kalemName: null,
    projectStatus,
  };
};

export const fetchSimulatedProjectPlans = async (): Promise<StatsBoardItem[]> => {
  const response = await axiosInstance.get<Record<string, unknown>[]>(
    "/api/SimulatedProjectPlan",
  );
  return (response.data ?? []).map(normalizeSimulatedPlanItem);
};

export const createSimulatedProjectPlan = async (
  payload: SimulatedProjectPlanPayload,
): Promise<StatsBoardItem> => {
  const response = await axiosInstance.post<Record<string, unknown>>(
    "/api/SimulatedProjectPlan",
    {
      customerName: payload.customerName,
      projectDescription: payload.projectDescription,
      projectSubDescription: payload.projectSubDescription ?? null,
      projectStatus: payload.projectStatus ?? null,
      modules: payload.modules ?? [],
      employeeUserIds: payload.employeeUserIds ?? [],
      projectManagerId: payload.projectManagerId ?? null,
    },
  );
  return normalizeSimulatedPlanItem(response.data ?? {});
};

export const updateSimulatedProjectPlan = async (
  payload: UpdateSimulatedProjectPlanPayload,
): Promise<StatsBoardItem> => {
  const response = await axiosInstance.put<Record<string, unknown>>(
    "/api/SimulatedProjectPlan",
    {
      id: payload.id,
      customerName: payload.customerName,
      projectDescription: payload.projectDescription,
      projectSubDescription: payload.projectSubDescription ?? null,
      projectStatus: payload.projectStatus ?? null,
      modules: payload.modules ?? [],
      employeeUserIds: payload.employeeUserIds ?? [],
      projectManagerId: payload.projectManagerId ?? null,
      isActive: payload.isActive ?? true,
    },
  );
  return normalizeSimulatedPlanItem(response.data ?? {});
};

export const deleteSimulatedProjectPlan = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/SimulatedProjectPlan/${id}`);
};
