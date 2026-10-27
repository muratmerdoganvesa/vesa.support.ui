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
  return response.data ?? { isDepartmentManager: false, items: [] };
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
