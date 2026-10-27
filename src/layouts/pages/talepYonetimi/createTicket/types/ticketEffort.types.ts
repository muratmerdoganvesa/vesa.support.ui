export interface TicketEffortListDto {
  id?: string;
  ticketsId?: string;
  userAppId?: string | null;
  userAppName?: string | null;
  effortHours?: number;
  invoiceHours?: number | null;
  description?: string | null;
  createdDate?: string;
  isOwn?: boolean;
}

export interface TicketEffortListResponseDto {
  isDepartmentManager?: boolean;
  items?: TicketEffortListDto[] | null;
}

export interface TicketEffortInsertDto {
  effortHours: number;
  invoiceHours?: number | null;
  description?: string | null;
}

export interface TicketEffortUpdateDto {
  effortHours: number;
  invoiceHours?: number | null;
  description?: string | null;
}
