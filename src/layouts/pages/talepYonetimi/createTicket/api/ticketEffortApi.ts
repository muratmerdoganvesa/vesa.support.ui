import { axiosInstance } from "utils/axiosInstance";
import type {
  TicketEffortInsertDto,
  TicketEffortListDto,
  TicketEffortListResponseDto,
  TicketEffortUpdateDto,
} from "../types/ticketEffort.types";

export const fetchTicketEfforts = async (
  ticketId: string
): Promise<TicketEffortListResponseDto> => {
  const response = await axiosInstance.get<TicketEffortListResponseDto>(
    `/api/Ticket/${ticketId}/efforts`
  );
  return response.data ?? {
    isDepartmentManager: false,
    isEffortEnter: false,
    canEnterEffort: false,
    items: [],
  };
};

export const setTicketEffortEnter = async (
  ticketId: string,
  isEffortEnter: boolean
): Promise<boolean> => {
  const response = await axiosInstance.post<{ isEffortEnter?: boolean }>(
    "/api/Ticket/SetEffortEnter",
    { ticketId, isEffortEnter }
  );
  return Boolean(response.data?.isEffortEnter);
};

export const readEffortApiError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof data === "string" && data.trim() !== "") return data;
    if (typeof data === "object" && data !== null) {
      const record = data as { errors?: unknown; message?: unknown; title?: unknown };
      if (Array.isArray(record.errors) && record.errors.length > 0) {
        return record.errors.map(String).join(", ");
      }
      if (typeof record.message === "string" && record.message.trim() !== "") return record.message;
      if (typeof record.title === "string" && record.title.trim() !== "") return record.title;
    }
  }
  if (error instanceof Error && error.message.trim() !== "") return error.message;
  return "Beklenmeyen bir hata oluştu.";
};

export const addTicketEffort = async (
  ticketId: string,
  dto: TicketEffortInsertDto
): Promise<TicketEffortListDto> => {
  const response = await axiosInstance.post<TicketEffortListDto>(`/api/Ticket/${ticketId}/efforts`, dto);
  return response.data;
};

export const updateTicketEffort = async (
  ticketId: string,
  effortId: string,
  dto: TicketEffortUpdateDto
): Promise<TicketEffortListDto> => {
  const response = await axiosInstance.put<TicketEffortListDto>(
    `/api/Ticket/${ticketId}/efforts/${effortId}`,
    dto
  );
  return response.data;
};

export const deleteTicketEffort = async (ticketId: string, effortId: string): Promise<void> => {
  await axiosInstance.delete(`/api/Ticket/${ticketId}/efforts/${effortId}`);
};
