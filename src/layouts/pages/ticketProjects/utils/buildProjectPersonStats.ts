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
  customers: string[];
  customerCount: number;
  projectCount: number;
};

type PersonStatsAccumulator = {
  personId: string;
  name: string;
  total: number;
  byColumn: Partial<Record<ProjectTypeColumnKey, number>>;
  customerSet: Set<string>;
  projectIdSet: Set<string>;
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
  const map = new Map<string, PersonStatsAccumulator>();

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
          customerSet: new Set(),
          projectIdSet: new Set(),
        });
      }

      const acc = map.get(person.id)!;
      acc.total += 1;
      acc.byColumn[columnKey] = (acc.byColumn[columnKey] ?? 0) + 1;
      if (item.customerName) acc.customerSet.add(item.customerName);
      if (item.projectId) acc.projectIdSet.add(item.projectId);
    }
  }

  const result: ProjectPersonStats[] = Array.from(map.values()).map((acc) => {
    const doneCount = acc.byColumn[DONE_COLUMN_KEY] ?? 0;
    return {
      personId: acc.personId,
      name: acc.name,
      total: acc.total,
      byColumn: acc.byColumn,
      donePercent: acc.total > 0 ? Math.round((doneCount / acc.total) * 100) : 0,
      activeCount: acc.total - doneCount,
      customers: Array.from(acc.customerSet).sort((a, b) => a.localeCompare(b, "tr")),
      customerCount: acc.customerSet.size,
      projectCount: acc.projectIdSet.size,
    };
  });

  result.sort((a, b) => b.donePercent - a.donePercent || b.total - a.total);

  return result;
};
