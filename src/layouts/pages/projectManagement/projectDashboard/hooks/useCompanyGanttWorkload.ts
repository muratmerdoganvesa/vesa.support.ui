import { useEffect, useRef, useState } from "react";
import {
  ProjectTasksApi,
  TicketProjectsApi,
  CompanyGanttProjectWorkloadDto,
  CompanyGanttPersonnelWorkloadDto,
  CompanyGanttPersonnelByProjectDto,
  TicketProjectsListDto,
} from "api/generated";
import getConfiguration from "confiuration";
import { fetchMyCompanyGanttWorkload } from "layouts/pages/myUserProjects/api";
import { CompanyGanttWorkload, PersonGanttWorkload, PersonProjectBreakdown, ProjectWorkloadSummary } from "../types";

const EMPTY_WORKLOAD: CompanyGanttWorkload = { projects: [], personnel: [] };

/** 60-second TTL cache keyed by workCompanyId to avoid re-fetching on tab switch. */
type CacheEntry = { data: CompanyGanttWorkload; ts: number };
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

// ─── DTO → frontend type mappers ─────────────────────────────────────────────

const mapProject = (
  dto: CompanyGanttProjectWorkloadDto,
  managerMap: Map<string, TicketProjectsListDto>,
): ProjectWorkloadSummary => {
  const managerInfo = dto.projectId ? managerMap.get(dto.projectId) : undefined;
  const managerName = managerInfo?.manager
    ? `${managerInfo.manager.firstName ?? ""} ${managerInfo.manager.lastName ?? ""}`.trim() || undefined
    : undefined;

  return {
    projectId: dto.projectId ?? "",
    projectName: dto.projectName ?? "",
    subProjectName: dto.subProjectName ?? null,
    isActive: dto.isActive ?? false,
    taskCount: dto.taskCount ?? 0,
    avgProgress: Math.round(dto.avgProgress ?? 0),
    assigneeCount: dto.assigneeCount ?? 0,
    managerId: managerInfo?.managerId ?? null,
    managerName,
    projectStatus: managerInfo?.projectStatus ?? managerInfo?.projectType ?? null,
  };
};

const mapPersonProjectBreakdown = (dto: CompanyGanttPersonnelByProjectDto): PersonProjectBreakdown => ({
  projectId: dto.projectId ?? "",
  projectName: dto.projectName ?? "",
  subProjectName: null, // backend doesn't return subProjectName in byProject, lookup separately if needed
  taskCount: dto.taskCount ?? 0,
  avgProgress: Math.round(dto.avgProgress ?? 0),
});

const mapPersonnel = (dto: CompanyGanttPersonnelWorkloadDto): PersonGanttWorkload => ({
  userId: dto.userId ?? "",
  name: dto.fullName ?? "",
  totalTasks: dto.totalTasks ?? 0,
  avgProgress: Math.round(dto.avgProgress ?? 0),
  isBlocked: dto.isBlocked ?? false,
  byProject: (dto.byProject ?? []).map(mapPersonProjectBreakdown),
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCompanyGanttWorkload = (
  workCompanyId: string | undefined,
  options?: { forCurrentUser?: boolean },
) => {
  const forCurrentUser = options?.forCurrentUser === true;
  const cacheKey = workCompanyId
    ? forCurrentUser
      ? `${workCompanyId}:me`
      : workCompanyId
    : undefined;
  const [workload, setWorkload] = useState<CompanyGanttWorkload>(EMPTY_WORKLOAD);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!workCompanyId || !cacheKey) {
      setWorkload(EMPTY_WORKLOAD);
      return;
    }

    // Return cached data if still fresh
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setWorkload(cached.data);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const config = getConfiguration();
        const tasksApi = new ProjectTasksApi(config);
        const projectApi = new TicketProjectsApi(config);

        // Parallel: workload aggregation + active projects (for manager info)
        const [workloadRes, activeProjectsRes] = await Promise.all([
          forCurrentUser
            ? fetchMyCompanyGanttWorkload(workCompanyId).then((data) => ({ data }))
            : tasksApi.apiProjectTasksGetCompanyGanttWorkloadGet(workCompanyId),
          projectApi.apiTicketProjectsGetActiveProjectsWithManagerGet(workCompanyId),
        ]);

        if (controller.signal.aborted) return;

        // Build a lookup map projectId → TicketProjectsListDto for manager info
        const managerMap = new Map<string, TicketProjectsListDto>(
          activeProjectsRes.data
            .filter((p) => p.id)
            .map((p) => [p.id!, p]),
        );

        const dto = workloadRes.data;

        const projects: ProjectWorkloadSummary[] = (dto.projects ?? [])
          .filter((p) => p.projectId)
          .map((p) => mapProject(p, managerMap));

        const personnel: PersonGanttWorkload[] = (dto.personnel ?? [])
          .filter((p) => p.userId)
          .map(mapPersonnel);

        // Enrich personnel byProject with subProjectName from the project list
        const projectSubNameMap = new Map(
          projects.map((p) => [p.projectId, p.subProjectName]),
        );
        for (const person of personnel) {
          for (const bp of person.byProject) {
            bp.subProjectName = projectSubNameMap.get(bp.projectId) ?? null;
          }
        }

        const built: CompanyGanttWorkload = { projects, personnel };
        cache.set(cacheKey, { data: built, ts: Date.now() });
        setWorkload(built);
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("useCompanyGanttWorkload error:", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      controller.abort();
    };
  }, [workCompanyId, cacheKey, forCurrentUser]);

  /** Invalidates cache for this company so next render triggers a fresh fetch. */
  const invalidate = () => {
    if (cacheKey) cache.delete(cacheKey);
  };

  return { workload, isLoading, invalidate };
};
