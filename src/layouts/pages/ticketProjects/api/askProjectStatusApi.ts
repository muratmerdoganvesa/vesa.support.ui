import { axiosInstance } from "utils/axiosInstance";

export type AskProjectStatusPayload = {
  targetUserId: string;
  message?: string | null;
  projectId?: string | null;
  taskId?: number | null;
  planId?: string | null;
  customerName?: string | null;
  projectDescription?: string | null;
  projectSubDescription?: string | null;
  kalemName?: string | null;
  statusLabel?: string | null;
};

export const askProjectStatus = async (payload: AskProjectStatusPayload): Promise<string> => {
  const response = await axiosInstance.post<{ message?: string }>(
    "/api/TicketProjects/AskProjectStatus",
    {
      targetUserId: payload.targetUserId,
      message: payload.message ?? null,
      projectId: payload.projectId ?? null,
      taskId: payload.taskId ?? null,
      planId: payload.planId ?? null,
      customerName: payload.customerName ?? null,
      projectDescription: payload.projectDescription ?? null,
      projectSubDescription: payload.projectSubDescription ?? null,
      kalemName: payload.kalemName ?? null,
      statusLabel: payload.statusLabel ?? null,
    },
  );

  return response.data?.message ?? "Durum sorusu gönderildi.";
};
