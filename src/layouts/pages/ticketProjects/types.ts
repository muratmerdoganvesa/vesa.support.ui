import { ProjectTypes } from "api/generated";

export type TicketProjectStatsPersonDto = {
  id: string;
  fullName: string;
};

export type StatsBoardItemKind = "kalem" | "project";

/** İstatistik board kartı — statuslü kalem veya seçilmemiş proje */
export type StatsBoardItem = {
  kind: StatsBoardItemKind;
  id: string;
  projectId: string;
  workCompanyId?: string | null;
  customerName: string;
  projectDescription: string;
  projectSubDescription?: string | null;
  createdDate?: string | null;
  modules: string[];
  employees: TicketProjectStatsPersonDto[];
  projectManager?: TicketProjectStatsPersonDto | null;
  taskId?: number | null;
  kalemName?: string | null;
  projectStatus?: ProjectTypes | null;
};
