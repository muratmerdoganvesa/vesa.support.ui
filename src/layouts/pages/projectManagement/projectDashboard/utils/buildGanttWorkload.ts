import { TicketProjectsListDto, ProjectTasksListDto } from "api/generated";
import {
  CompanyGanttWorkload,
  PersonGanttWorkload,
  ProjectWorkloadSummary,
} from "../types";

/**
 * Extracts the flat list of assignee IDs + name from a task's `users` field.
 * Mirrors the same normalization used in chart/index.tsx transform.
 */
const extractUsers = (task: ProjectTasksListDto): Array<{ id: string; name: string }> => {
  const raw = (task as any).Users || (task as any).users || task.users || [];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((u: any) => u && u.id)
    .map((u: any) => ({
      id: String(u.id),
      name: `${u.firstName ?? u.fullName ?? ""} ${u.lastName ?? ""}`.trim() || u.userName || u.id,
    }));
};

/**
 * Leaf task check: tasks with a `parentId` that is also present in the dataset are
 * summary rows in Syncfusion Gantt — we count all tasks (including summaries) to
 * match what the chart displays. Pass `leafOnly: true` to exclude them.
 */
const buildProjectWorkloadSummary = (
  project: TicketProjectsListDto,
  tasks: ProjectTasksListDto[],
): ProjectWorkloadSummary => {
  const managerName = project.manager
    ? `${project.manager.firstName ?? ""} ${project.manager.lastName ?? ""}`.trim() || undefined
    : undefined;

  if (tasks.length === 0) {
    return {
      projectId: project.id!,
      projectName: project.name ?? "",
      subProjectName: project.subProjectName,
      isActive: project.isActive ?? true,
      taskCount: 0,
      avgProgress: 0,
      assigneeCount: 0,
      managerId: project.managerId,
      managerName,
      projectStatus: project.projectStatus ?? project.projectType ?? null,
    };
  }

  const uniqueAssignees = new Set<string>();
  let progressSum = 0;

  for (const task of tasks) {
    progressSum += task.progress ?? 0;
    for (const u of extractUsers(task)) {
      uniqueAssignees.add(u.id);
    }
  }

  return {
    projectId: project.id!,
    projectName: project.name ?? "",
    subProjectName: project.subProjectName,
    isActive: project.isActive ?? true,
    taskCount: tasks.length,
    avgProgress: Math.round(progressSum / tasks.length),
    assigneeCount: uniqueAssignees.size,
    managerId: project.managerId,
    managerName,
    projectStatus: project.projectStatus ?? project.projectType ?? null,
  };
};

export const buildGanttWorkload = (
  projects: TicketProjectsListDto[],
  tasksByProjectId: Map<string, ProjectTasksListDto[]>,
): CompanyGanttWorkload => {
  // ── Project summaries ───────────────────────────────────────────────────
  const projectSummaries: ProjectWorkloadSummary[] = projects
    .filter((p) => p.id)
    .map((p) => buildProjectWorkloadSummary(p, tasksByProjectId.get(p.id!) ?? []));

  // ── Personnel aggregation ───────────────────────────────────────────────
  const personnelMap = new Map<
    string,
    {
      userId: string;
      name: string;
      totalTasks: number;
      totalProgress: number;
      byProject: Map<string, { projectId: string; projectName: string; subProjectName?: string | null; count: number; progressSum: number }>;
    }
  >();

  for (const project of projects) {
    if (!project.id) continue;
    const tasks = tasksByProjectId.get(project.id) ?? [];
    for (const task of tasks) {
      for (const user of extractUsers(task)) {
        if (!personnelMap.has(user.id)) {
          personnelMap.set(user.id, {
            userId: user.id,
            name: user.name,
            totalTasks: 0,
            totalProgress: 0,
            byProject: new Map(),
          });
        }
        const person = personnelMap.get(user.id)!;
        person.totalTasks += 1;
        person.totalProgress += task.progress ?? 0;

        if (!person.byProject.has(project.id)) {
          person.byProject.set(project.id, {
            projectId: project.id,
            projectName: project.name ?? "",
            subProjectName: project.subProjectName,
            count: 0,
            progressSum: 0,
          });
        }
        const bp = person.byProject.get(project.id)!;
        bp.count += 1;
        bp.progressSum += task.progress ?? 0;
      }
    }
  }

  const personnel: PersonGanttWorkload[] = Array.from(personnelMap.values())
    .filter((p) => p.totalTasks > 0)
    .map((p) => ({
      userId: p.userId,
      name: p.name,
      totalTasks: p.totalTasks,
      avgProgress: p.totalTasks > 0 ? Math.round(p.totalProgress / p.totalTasks) : 0,
      byProject: Array.from(p.byProject.values()).map((bp) => ({
        projectId: bp.projectId,
        projectName: bp.projectName,
        subProjectName: bp.subProjectName,
        taskCount: bp.count,
        avgProgress: bp.count > 0 ? Math.round(bp.progressSum / bp.count) : 0,
      })),
    }))
    .sort((a, b) => b.totalTasks - a.totalTasks);

  return { projects: projectSummaries, personnel };
};

/**
 * Derives chart-page stats from already-fetched project task data.
 * No extra API calls needed — data is the same set used by GanttComponent.
 */
export const buildProjectGanttStats = (tasks: any[], resources: any[]) => {
  if (!tasks || tasks.length === 0) {
    return { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, avgProgress: 0, assigneeCount: 0 };
  }

  const uniqueAssignees = new Set<string>();
  let progressSum = 0;
  let completedTasks = 0;

  for (const task of tasks) {
    const progress = task.Progress ?? task.progress ?? 0;
    progressSum += progress;
    if (progress >= 100) completedTasks += 1;

    const taskUsers = task.resources ?? task.users ?? task.Users ?? [];
    if (Array.isArray(taskUsers)) {
      for (const u of taskUsers) {
        if (u?.id) uniqueAssignees.add(String(u.id));
      }
    }
  }

  // Also count from resources list (Syncfusion uses separate resources array)
  if (Array.isArray(resources)) {
    for (const r of resources) {
      if (r?.id) uniqueAssignees.add(String(r.id));
    }
  }

  return {
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks: tasks.length - completedTasks,
    avgProgress: Math.round(progressSum / tasks.length),
    assigneeCount: uniqueAssignees.size,
  };
};
