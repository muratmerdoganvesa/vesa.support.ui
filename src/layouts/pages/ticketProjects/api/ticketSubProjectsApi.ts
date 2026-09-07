import { ListModuleDto, UserAppDto } from "api/generated";
import { axiosInstance } from "utils/axiosInstance";

export type TicketSubProjectDto = {
  id: string;
  ticketProjectId: string;
  name: string;
  userIds: string[];
  users: UserAppDto[];
  moduleIds: string[];
  modules: ListModuleDto[];
  effortDuration: number | null;
  createdDate?: string | null;
};

export type TicketSubProjectPayload = {
  ticketProjectId: string;
  name: string;
  userIds: string[];
  moduleIds: string[];
  effortDuration: number | null;
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.length > 0);
};

export const normalizeTicketSubProject = (item: Record<string, unknown>): TicketSubProjectDto => {
  const rawUsers = item.users ?? item.Users;
  const users = Array.isArray(rawUsers) ? (rawUsers as UserAppDto[]) : [];
  const rawModules = item.modules ?? item.Modules;
  const modules = Array.isArray(rawModules) ? (rawModules as ListModuleDto[]) : [];

  const effortRaw = item.effortDuration ?? item.EffortDuration;
  const effortDuration =
    effortRaw == null || effortRaw === "" ? null : Number(effortRaw);

  return {
    id: String(item.id ?? item.Id ?? ""),
    ticketProjectId: String(item.ticketProjectId ?? item.TicketProjectId ?? ""),
    name: String(item.name ?? item.Name ?? ""),
    userIds: toStringList(item.userIds ?? item.UserIds),
    users,
    moduleIds: toStringList(item.moduleIds ?? item.ModuleIds),
    modules,
    effortDuration: Number.isFinite(effortDuration) ? effortDuration : null,
    createdDate: (item.createdDate ?? item.CreatedDate) as string | null | undefined,
  };
};

export const fetchTicketSubProjectsByProject = async (
  ticketProjectId: string
): Promise<TicketSubProjectDto[]> => {
  const response = await axiosInstance.get<Record<string, unknown>[]>(
    `/api/TicketSubProjects/ByProject/${ticketProjectId}`
  );
  return (response.data ?? []).map(normalizeTicketSubProject);
};

export const createTicketSubProject = async (payload: TicketSubProjectPayload): Promise<void> => {
  await axiosInstance.post("/api/TicketSubProjects", payload);
};

export const updateTicketSubProject = async (
  id: string,
  payload: TicketSubProjectPayload
): Promise<void> => {
  await axiosInstance.put("/api/TicketSubProjects", { id, ...payload });
};

export const deleteTicketSubProject = async (id: string): Promise<void> => {
  await axiosInstance.delete("/api/TicketSubProjects", { params: { id } });
};
