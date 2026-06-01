import { KanbanTasksListDtoFixed } from "./fetchKanbanData";

export type KanbanStatus = "Backlog" | "Realization" | "UAT" | "Preparation" | "Done";

export const KANBAN_STATUSES: KanbanStatus[] = [
  "Backlog",
  "Realization",
  "UAT",
  "Preparation",
  "Done",
];

export type PersonKanbanStats = {
  userId: string;
  name: string;
  total: number;
  byStatus: Record<KanbanStatus, number>;
  criticalCount: number;
  donePercent: number;
  activeCount: number;
};

const EMPTY_BY_STATUS: Record<KanbanStatus, number> = {
  Backlog: 0,
  Realization: 0,
  UAT: 0,
  Preparation: 0,
  Done: 0,
};

export const buildPersonStats = (tasks: KanbanTasksListDtoFixed[]): PersonKanbanStats[] => {
  const map = new Map<string, PersonKanbanStats>();

  for (const task of tasks) {
    if (!task.AssigneeId || !task.Assignee) continue;

    if (!map.has(task.AssigneeId)) {
      map.set(task.AssigneeId, {
        userId: task.AssigneeId,
        name: task.Assignee,
        total: 0,
        byStatus: { ...EMPTY_BY_STATUS },
        criticalCount: 0,
        donePercent: 0,
        activeCount: 0,
      });
    }

    const person = map.get(task.AssigneeId)!;
    person.total += 1;

    const status = task.Status as KanbanStatus;
    if (KANBAN_STATUSES.includes(status)) {
      person.byStatus[status] = (person.byStatus[status] ?? 0) + 1;
    }

    if (task.Priority === "Critical" || task.Priority === "Release Breaker") {
      person.criticalCount += 1;
    }
  }

  const result = Array.from(map.values()).filter((p) => p.total >= 1);

  for (const p of result) {
    p.donePercent = p.total > 0 ? Math.round((p.byStatus.Done / p.total) * 100) : 0;
    p.activeCount = p.total - p.byStatus.Done;
  }

  result.sort((a, b) => b.donePercent - a.donePercent || b.total - a.total);

  return result;
};
