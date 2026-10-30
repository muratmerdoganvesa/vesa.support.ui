export const TicketEffortStatus = {
  SentToEffortManager: 1,
  UnderReview: 2,
  WaitingCustomerApproval: 3,
  CustomerApproved: 4,
  CustomerRejected: 5,
  ReturnedToDepartment: 6,
} as const;

export interface TicketEffortManagementStatusDto {
  exists?: boolean;
  id?: string | null;
  ticketId?: string | null;
  status?: number | null;
  statusText?: string | null;
  sentByUserId?: string | null;
  sentByUserName?: string | null;
  sentAt?: string | null;
  effortManagerUserId?: string | null;
  effortManagerUserName?: string | null;
  effortManagerAssignedAt?: string | null;
  returnNote?: string | null;
  returnedAt?: string | null;
}

export interface TicketEffortManagementListItemDto {
  id?: string;
  ticketId?: string;
  ticketNumber?: number;
  ticketCode?: string | null;
  title?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  workCompanyName?: string | null;
  departmentName?: string | null;
  departmentManagerName?: string | null;
  sentByUserId?: string | null;
  sentByUserName?: string | null;
  sentAt?: string | null;
  status?: number;
  statusText?: string | null;
  effortManagerUserName?: string | null;
}

export interface TicketEffortManagementListResultDto {
  count?: number;
  items?: TicketEffortManagementListItemDto[] | null;
}

export interface TicketEffortManagementCustomerOptionDto {
  id?: string;
  name?: string | null;
}

export interface TicketEffortManagementDetailDto {
  id?: string;
  ticketId?: string;
  ticketNumber?: number;
  ticketCode?: string | null;
  title?: string | null;
  description?: string | null;
  ticketStatusText?: string | null;
  priorityText?: string | null;
  typeText?: string | null;
  departmentName?: string | null;
  departmentManagerName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  workCompanyId?: string;
  workCompanyName?: string | null;
  ticketCreatedDate?: string | null;
  ticketCreatedBy?: string | null;
  ticketOwnerName?: string | null;
  isEffortEnter?: boolean;
  status?: number;
  statusText?: string | null;
  sentByUserId?: string | null;
  sentByUserName?: string | null;
  sentAt?: string | null;
  effortManagerUserId?: string | null;
  effortManagerUserName?: string | null;
  effortManagerAssignedAt?: string | null;
  canClaim?: boolean;
  canReturn?: boolean;
  claimedByCurrentUser?: boolean;
  returnNote?: string | null;
  returnedAt?: string | null;
  comments?: TicketEffortManagementCommentDto[] | null;
}

export interface TicketEffortManagementCommentDto {
  id?: string;
  body?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdDate?: string;
}

export interface TicketEffortManagementEffortItemDto {
  id?: string;
  userAppId?: string | null;
  userAppName?: string | null;
  userTitle?: string | null;
  effortHours?: number;
  invoiceHours?: number | null;
  description?: string | null;
  createdDate?: string;
}

export interface TicketEffortManagementEffortsDto {
  ticketId?: string;
  totalEffortHours?: number;
  totalInvoiceHours?: number;
  items?: TicketEffortManagementEffortItemDto[] | null;
}

export const effortStatusClassName = (status?: number | null): string => {
  if (status === TicketEffortStatus.SentToEffortManager) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (status === TicketEffortStatus.UnderReview) {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }
  if (status === TicketEffortStatus.CustomerApproved) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === TicketEffortStatus.CustomerRejected || status === TicketEffortStatus.ReturnedToDepartment) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return "bg-slate-50 text-slate-600 ring-slate-200";
};
