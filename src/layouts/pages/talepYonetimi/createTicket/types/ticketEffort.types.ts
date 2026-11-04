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
  isEffortEnter?: boolean;
  canEnterEffort?: boolean;
  /** Aktif IsEffort ataması veya departman yöneticisi — Efor Bilgisi sekmesi */
  canSeeEffortTab?: boolean;
  isEffortLockedInApproval?: boolean;
  canCompleteEffort?: boolean;
  isEffortComplated?: boolean;
  canApproveEffortAsManager?: boolean;
  pendingEffortApprovalWorkflowHeadId?: string | null;
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
