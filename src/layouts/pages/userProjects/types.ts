export type UserProjectStatsDto = {
  userId: string;
  firstName: string;
  lastName: string;
  departmentText?: string | null;
  projectCount: number;
  projectNames: string[];
};

export type UserProjectsTab = "consultant" | "stats";
