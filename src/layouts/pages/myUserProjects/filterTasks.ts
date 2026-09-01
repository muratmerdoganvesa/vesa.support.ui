type GanttTaskLike = {
  id?: string;
  Id?: string;
  taskId?: number | null;
  parentId?: string | null;
  ParentId?: string | null;
  users?: Array<{ id?: string | null } | null> | null;
  Users?: Array<{ id?: string | null } | null> | null;
  UserIds?: string | null;
};

const parseUserIds = (raw?: string | null): string[] =>
  (raw ?? "")
    .split(/[;,]/)
    .map((id) => id.trim())
    .filter(Boolean);

const taskAssignedToUser = (task: GanttTaskLike, userId: string): boolean => {
  const userLists = [...(task.users ?? []), ...(task.Users ?? [])];
  const fromUsers = userLists.some(
    (u) => (u?.id ?? "").toLowerCase() === userId.toLowerCase(),
  );
  if (fromUsers) return true;
  return parseUserIds(task.UserIds).some((id) => id.toLowerCase() === userId.toLowerCase());
};

/**
 * Kapsamdaki kullanıcılara atanan görevler + bu görevlere bağlı tüm alt görevler.
 * Görünmeyen ebeveyne bağlı kayıtların ParentId'si temizlenir (kök olarak gösterilir).
 */
export const filterAssignedTasksAndDescendants = <T extends GanttTaskLike>(
  tasks: T[],
  userId: string | string[],
): T[] => {
  const userIds = (Array.isArray(userId) ? userId : [userId])
    .map((id) => id.trim())
    .filter(Boolean);
  if (userIds.length === 0 || tasks.length === 0) return [];

  const assigned = tasks.filter((t) => userIds.some((id) => taskAssignedToUser(t, id)));
  if (assigned.length === 0) return [];

  const childrenByParent = new Map<string, T[]>();
  for (const task of tasks) {
    const parentKey = (task.parentId ?? task.ParentId ?? "").trim();
    if (!parentKey) continue;
    const list = childrenByParent.get(parentKey) ?? [];
    list.push(task);
    childrenByParent.set(parentKey, list);
  }

  const visible = new Map<string, T>();
  const queue: T[] = [];
  for (const task of assigned) {
    const key = String(task.id ?? task.Id ?? "");
    if (!key || visible.has(key)) continue;
    visible.set(key, task);
    queue.push(task);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const parentKey = current.taskId == null ? "" : String(current.taskId);
    if (!parentKey) continue;
    const children = childrenByParent.get(parentKey) ?? [];
    for (const child of children) {
      const childKey = String(child.id ?? child.Id ?? "");
      if (!childKey || visible.has(childKey)) continue;
      visible.set(childKey, child);
      queue.push(child);
    }
  }

  const visibleTaskIds = new Set(
    [...visible.values()]
      .map((t) => (t.taskId == null ? "" : String(t.taskId)))
      .filter(Boolean),
  );

  return [...visible.values()].map((task) => {
    const parent = (task.parentId ?? task.ParentId ?? "").trim();
    if (!parent || visibleTaskIds.has(parent)) return task;
    return { ...task, parentId: null, ParentId: null };
  });
};

