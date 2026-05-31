import { useEffect, useState, useMemo } from "react";
import {
  TicketProjectsApi,
  WorkCompanyApi,
  TicketProjectsListDto,
  WorkCompanyDto,
} from "api/generated";
import getConfiguration from "confiuration";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";

export const getProjectLabel = (p: TicketProjectsListDto): string =>
  p.subProjectName ? `${p.name} - ${p.subProjectName}` : p.name ?? "";

export interface ProjectStats {
  total: number;
  done: number;
}

export interface UseProjectCatalogResult {
  projects: TicketProjectsListDto[];
  companies: WorkCompanyDto[];
  loading: boolean;
  taskStats: Map<string, ProjectStats>;
  noProjectStats: ProjectStats;
}

export function useProjectCatalog(allData: KanbanTasksListDtoFixed[]): UseProjectCatalogResult {
  const [projects, setProjects] = useState<TicketProjectsListDto[]>([]);
  const [companies, setCompanies] = useState<WorkCompanyDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        // Use GetActiveProjectsWithManager (no companyId = all projects) so workCompanyId is populated
        const [projRes, compRes] = await Promise.all([
          new TicketProjectsApi(getConfiguration()).apiTicketProjectsGetActiveProjectsWithManagerGet(),
          new WorkCompanyApi(getConfiguration()).apiWorkCompanyGetCompanyListInProjectIsManagerTrueGet(),
        ]);
        setProjects(projRes.data ?? []);
        setCompanies(compRes.data ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const taskStats = useMemo(() => {
    const map = new Map<string, ProjectStats>();
    for (const d of allData) {
      if (!d.projectId) continue;
      const cur = map.get(d.projectId) ?? { total: 0, done: 0 };
      cur.total++;
      if (d.Status === "Done") cur.done++;
      map.set(d.projectId, cur);
    }
    return map;
  }, [allData]);

  const noProjectStats = useMemo<ProjectStats>(() => {
    const cards = allData.filter((d) => !d.projectId);
    return {
      total: cards.length,
      done: cards.filter((d) => d.Status === "Done").length,
    };
  }, [allData]);

  return { projects, companies, loading, taskStats, noProjectStats };
}
