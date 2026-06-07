import { KanbanTasksListDtoFixed } from "./fetchKanbanData";

export type DueDateStatus = "none" | "overdue" | "dueToday" | "dueSoon" | "ok";

const toDateOnly = (value: string): Date => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const todayDateOnly = (): Date => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const parseDueDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  try {
    return toDateOnly(value);
  } catch {
    return null;
  }
};

export const formatDueDate = (value: string | null | undefined): string => {
  const d = parseDueDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
};

export const isOverdue = (task: Pick<KanbanTasksListDtoFixed, "dueDate" | "Status">): boolean => {
  if (!task.dueDate) return false;
  if (task.Status === "Done") return false;
  const due = parseDueDate(task.dueDate);
  if (!due) return false;
  return due < todayDateOnly();
};

export const isDueToday = (task: Pick<KanbanTasksListDtoFixed, "dueDate">): boolean => {
  if (!task.dueDate) return false;
  const due = parseDueDate(task.dueDate);
  if (!due) return false;
  const today = todayDateOnly();
  return due.getTime() === today.getTime();
};

export const isDueThisWeek = (task: Pick<KanbanTasksListDtoFixed, "dueDate">): boolean => {
  if (!task.dueDate) return false;
  const due = parseDueDate(task.dueDate);
  if (!due) return false;
  const today = todayDateOnly();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return due >= monday && due <= sunday;
};

export const getDueDateStatus = (
  task: Pick<KanbanTasksListDtoFixed, "dueDate" | "Status">
): DueDateStatus => {
  if (!task.dueDate) return "none";
  if (task.Status === "Done") return "ok";
  if (isOverdue(task)) return "overdue";
  if (isDueToday(task)) return "dueToday";
  const due = parseDueDate(task.dueDate);
  if (!due) return "none";
  const today = todayDateOnly();
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 3) return "dueSoon";
  return "ok";
};
