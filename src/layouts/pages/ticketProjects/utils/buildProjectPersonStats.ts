import { ProjectTypes } from "api/generated";
import { getStatsBoardColumnKey, type ProjectTypeColumnKey } from "../projectTypeHelpers";
import type { StatsBoardItem, TicketProjectStatsPersonDto } from "../types";

export type ProjectPersonStats = {
  personId: string;
  name: string;
  total: number;
  byColumn: Partial<Record<ProjectTypeColumnKey, number>>;
  donePercent: number;
  activeCount: number;
};

const DONE_COLUMN_KEY: ProjectTypeColumnKey = ProjectTypes.NUMBER_5;

const getItemPersons = (item: StatsBoardItem): TicketProjectStatsPersonDto[] => {
  const persons: TicketProjectStatsPersonDto[] = [];
  if (item.projectManager?.id) persons.push(item.projectManager);
  for (const employee of item.employees) {
    if (employee.id) persons.push(employee);
  }
  return persons;
};

/** Kişi bazlı proje istatistikleri; her kalem/proje kartı bir kişiyi bir kez sayar. */
export const buildProjectPersonStats = (items: StatsBoardItem[]): ProjectPersonStats[] => {
  const map = new Map<string, ProjectPersonStats>();

  for (const item of items) {
    const columnKey = getStatsBoardColumnKey(item);
    const seenPersonIds = new Set<string>();

    for (const person of getItemPersons(item)) {
      if (seenPersonIds.has(person.id)) continue;
      seenPersonIds.add(person.id);

      if (!map.has(person.id)) {
        map.set(person.id, {
          personId: person.id,
          name: person.fullName,
          total: 0,
          byColumn: {},
          donePercent: 0,
          activeCount: 0,
        });
      }

      const stats = map.get(person.id)!;
      stats.total += 1;
      stats.byColumn[columnKey] = (stats.byColumn[columnKey] ?? 0) + 1;
    }
  }

  const result = Array.from(map.values());

  for (const stats of result) {
    const doneCount = stats.byColumn[DONE_COLUMN_KEY] ?? 0;
    stats.donePercent = stats.total > 0 ? Math.round((doneCount / stats.total) * 100) : 0;
    stats.activeCount = stats.total - doneCount;
  }

  result.sort((a, b) => b.donePercent - a.donePercent || b.total - a.total);

  return result;
};
