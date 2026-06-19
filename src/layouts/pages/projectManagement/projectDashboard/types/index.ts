import { ProjectTypes } from "api/generated";

export type ProjectWorkloadSummary = {
  projectId: string;
  projectName: string;
  subProjectName?: string | null;
  isActive: boolean;
  taskCount: number;
  avgProgress: number;
  assigneeCount: number;
  managerId?: string | null;
  managerName?: string | null;
  projectStatus?: ProjectTypes | null;
};

export type PersonProjectBreakdown = {
  projectId: string;
  projectName: string;
  subProjectName?: string | null;
  taskCount: number;
  avgProgress: number;
};

export type PersonGanttWorkload = {
  userId: string;
  name: string;
  totalTasks: number;
  avgProgress: number;
  isBlocked?: boolean;
  byProject: PersonProjectBreakdown[];
};

export type CompanyGanttWorkload = {
  projects: ProjectWorkloadSummary[];
  personnel: PersonGanttWorkload[];
};
