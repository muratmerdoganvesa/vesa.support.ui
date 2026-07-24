import { ProjectTypes } from "api/generated";
import { getStatsBoardColumnKey, type ProjectTypeColumnKey } from "../projectTypeHelpers";
import type { StatsBoardItem } from "../types";

export type ProjectModuleStats = {
  moduleName: string;
  total: number;
  byColumn: Partial<Record<ProjectTypeColumnKey, number>>;
  donePercent: number;
  activeCount: number;
  customers: string[];
  customerCount: number;
  projectCount: number;
  /** Simülasyon / plan kartı sayısı */
  planCount: number;
  plans: string[];
  personCount: number;
};

type ModuleStatsAccumulator = {
  moduleName: string;
  total: number;
  byColumn: Partial<Record<ProjectTypeColumnKey, number>>;
  customerSet: Set<string>;
  projectIdSet: Set<string>;
  personIdSet: Set<string>;
  planCount: number;
  planLabels: Set<string>;
};

const DONE_COLUMN_KEY: ProjectTypeColumnKey = ProjectTypes.NUMBER_5;

const getItemModuleNames = (item: StatsBoardItem): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const raw of item.modules ?? []) {
    const name = String(raw ?? "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
};

/** Modül bazlı proje istatistikleri; her kalem/proje kartı bir modülü bir kez sayar. */
export const buildProjectModuleStats = (items: StatsBoardItem[]): ProjectModuleStats[] => {
  const map = new Map<string, ModuleStatsAccumulator>();

  for (const item of items) {
    const columnKey = getStatsBoardColumnKey(item);
    const moduleNames = getItemModuleNames(item);
    if (moduleNames.length === 0) continue;

    for (const moduleName of moduleNames) {
      if (!map.has(moduleName)) {
        map.set(moduleName, {
          moduleName,
          total: 0,
          byColumn: {},
          customerSet: new Set(),
          projectIdSet: new Set(),
          personIdSet: new Set(),
          planCount: 0,
          planLabels: new Set(),
        });
      }

      const acc = map.get(moduleName)!;
      acc.total += 1;
      acc.byColumn[columnKey] = (acc.byColumn[columnKey] ?? 0) + 1;
      if (item.customerName) acc.customerSet.add(item.customerName);
      if (item.projectId) acc.projectIdSet.add(item.projectId);

      if (item.projectManager?.id) acc.personIdSet.add(item.projectManager.id);
      for (const employee of item.employees ?? []) {
        if (employee.id) acc.personIdSet.add(employee.id);
      }

      if (item.kind === "simulated") {
        acc.planCount += 1;
        const planLabel = item.customerName
          ? `${item.customerName} — ${item.projectDescription}`
          : item.projectDescription;
        if (planLabel?.trim()) acc.planLabels.add(planLabel.trim());
      }
    }
  }

  const result: ProjectModuleStats[] = Array.from(map.values()).map((acc) => {
    const doneCount = acc.byColumn[DONE_COLUMN_KEY] ?? 0;
    return {
      moduleName: acc.moduleName,
      total: acc.total,
      byColumn: acc.byColumn,
      donePercent: acc.total > 0 ? Math.round((doneCount / acc.total) * 100) : 0,
      activeCount: acc.total - doneCount,
      customers: Array.from(acc.customerSet).sort((a, b) => a.localeCompare(b, "tr")),
      customerCount: acc.customerSet.size,
      projectCount: acc.projectIdSet.size,
      planCount: acc.planCount,
      plans: Array.from(acc.planLabels).sort((a, b) => a.localeCompare(b, "tr")),
      personCount: acc.personIdSet.size,
    };
  });

  result.sort((a, b) => b.donePercent - a.donePercent || b.total - a.total);

  return result;
};
