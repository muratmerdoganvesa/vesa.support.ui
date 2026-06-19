import { PersonGanttWorkload } from "../types";

export const filterPersonnelForProject = (
  personnel: PersonGanttWorkload[],
  projectId: string,
): PersonGanttWorkload[] =>
  personnel
    .map((person) => {
      const projectBreakdown = person.byProject.find((bp) => bp.projectId === projectId);
      if (!projectBreakdown) return null;

      return {
        ...person,
        totalTasks: projectBreakdown.taskCount,
        avgProgress: projectBreakdown.avgProgress,
        byProject: [projectBreakdown],
      };
    })
    .filter((person): person is PersonGanttWorkload => person !== null)
    .sort((a, b) => b.totalTasks - a.totalTasks);
