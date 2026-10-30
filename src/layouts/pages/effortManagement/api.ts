import { axiosInstance } from "utils/axiosInstance";
import { readEffortApiError } from "layouts/pages/talepYonetimi/createTicket/api/ticketEffortApi";
import type {
  TicketEffortManagementCustomerOptionDto,
  TicketEffortManagementDetailDto,
  TicketEffortManagementEffortsDto,
  TicketEffortManagementListResultDto,
  TicketEffortManagementStatusDto,
} from "./types";

export { readEffortApiError };

export interface EffortManagementListQuery {
  skip?: number;
  top?: number;
  status?: number | null;
  customerId?: string | null;
  search?: string | null;
}

export const fetchEffortManagementByTicket = async (
  ticketId: string
): Promise<TicketEffortManagementStatusDto> => {
  const response = await axiosInstance.get<TicketEffortManagementStatusDto>(
    `/api/TicketEffortManagement/by-ticket/${ticketId}`
  );
  return response.data ?? { exists: false, ticketId };
};

export const sendTicketEffortManagement = async (
  ticketId: string
): Promise<TicketEffortManagementStatusDto> => {
  const response = await axiosInstance.post<TicketEffortManagementStatusDto>(
    "/api/TicketEffortManagement/send",
    { ticketId }
  );
  return response.data;
};

export const fetchEffortManagementList = async (
  query: EffortManagementListQuery
): Promise<TicketEffortManagementListResultDto> => {
  const response = await axiosInstance.get<TicketEffortManagementListResultDto>(
    "/api/TicketEffortManagement",
    {
      params: {
        skip: query.skip ?? 0,
        top: query.top ?? 20,
        status: query.status ?? undefined,
        customerId: query.customerId || undefined,
        search: query.search?.trim() || undefined,
      },
    }
  );
  return response.data ?? { count: 0, items: [] };
};

export const fetchEffortManagementCustomers = async (): Promise<
  TicketEffortManagementCustomerOptionDto[]
> => {
  const response = await axiosInstance.get<TicketEffortManagementCustomerOptionDto[]>(
    "/api/TicketEffortManagement/customers"
  );
  return response.data ?? [];
};

export const fetchEffortManagementDetail = async (
  id: string
): Promise<TicketEffortManagementDetailDto> => {
  const response = await axiosInstance.get<TicketEffortManagementDetailDto>(
    `/api/TicketEffortManagement/${id}`
  );
  return response.data;
};

export const fetchEffortManagementEfforts = async (
  id: string
): Promise<TicketEffortManagementEffortsDto> => {
  const response = await axiosInstance.get<TicketEffortManagementEffortsDto>(
    `/api/TicketEffortManagement/${id}/efforts`
  );
  return response.data ?? { items: [], totalEffortHours: 0, totalInvoiceHours: 0 };
};

export const claimEffortManagement = async (
  id: string
): Promise<TicketEffortManagementStatusDto> => {
  const response = await axiosInstance.post<TicketEffortManagementStatusDto>(
    `/api/TicketEffortManagement/${id}/claim`
  );
  return response.data;
};

export const returnEffortManagement = async (
  id: string,
  note: string
): Promise<TicketEffortManagementStatusDto> => {
  const response = await axiosInstance.post<TicketEffortManagementStatusDto>(
    `/api/TicketEffortManagement/${id}/return`,
    { note }
  );
  return response.data;
};
