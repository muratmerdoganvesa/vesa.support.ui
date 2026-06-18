import { axiosInstance } from "utils/axiosInstance";
import type { UserProjectStatsDto } from "../types";

type FetchUserProjectStatsParams = {
  departmentId?: string;
  userId?: string;
};

const normalizeStatsItem = (item: Record<string, unknown>): UserProjectStatsDto => ({
  userId: String(item.userId ?? item.UserId ?? ""),
  firstName: String(item.firstName ?? item.FirstName ?? ""),
  lastName: String(item.lastName ?? item.LastName ?? ""),
  departmentText: (item.departmentText ?? item.DepartmentText) as string | null | undefined,
  projectCount: Number(item.projectCount ?? item.ProjectCount ?? 0),
  projectNames: (item.projectNames ?? item.ProjectNames ?? []) as string[],
});

export const fetchUserProjectStats = async ({
  departmentId,
  userId,
}: FetchUserProjectStatsParams): Promise<UserProjectStatsDto[]> => {
  const basePath = import.meta.env.VITE_BASE_PATH || "";
  const response = await axiosInstance.get<Record<string, unknown>[]>(
    `${basePath}/api/TicketProjects/GetUserProjectStats`,
    {
      params: {
        departmentId: departmentId || undefined,
        userId: userId || undefined,
      },
    },
  );

  return (response.data ?? []).map(normalizeStatsItem);
};
