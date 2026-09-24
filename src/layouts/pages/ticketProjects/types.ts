import { ProjectTypes } from "api/generated";
import type { ProjectTaskChecklist } from "./projectTaskChecklist";

export type TicketProjectStatsPersonDto = {
  id: string;
  fullName: string;
};

export type StatsBoardItemKind = "kalem" | "project" | "simulated";

/** İstatistik board kartı — statuslü kalem, seçilmemiş proje veya simülasyon planı */
export type StatsBoardItem = {
  kind: StatsBoardItemKind;
  id: string;
  projectId: string;
  workCompanyId?: string | null;
  isActive?: boolean | null;
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
  /** Yalnızca statuslü kalem kartında; o görevin checklist cevapları */
  taskChecklist?: ProjectTaskChecklist;
};
