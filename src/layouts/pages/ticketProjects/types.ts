import { ProjectTypes } from "api/generated";

export type TicketProjectStatsPersonDto = {
  id: string;
  fullName: string;
  profilePhoto?: string | null;
};

export type TicketProjectStatsDto = {
  id: string;
  customerName: string;
  projectDescription: string;
  projectSubDescription?: string | null;
  createdDate?: string | null;
  projectStatus?: ProjectTypes | null;
  modules: string[];
  employees: TicketProjectStatsPersonDto[];
  projectManager?: TicketProjectStatsPersonDto | null;
};
