import { useCallback, useMemo, useState } from "react";
import {
  getProjectColumnKey,
  getProjectTypeColumns,
  type ProjectTypeColumnKey,
} from "../projectTypeHelpers";
import type { TicketProjectStatsDto } from "../types";

export type PersonItem = { id: string; name: string; count: number };
export type LabelCountItem = { name: string; count: number };
export type StatusItem = { key: ProjectTypeColumnKey; label: string; count: number };

type FilterParams = {
  searchTerm: string;
  selectedPersonId: string;
  selectedCustomer: string;
  selectedModule: string;
  selectedStatus: ProjectTypeColumnKey | "All";
  selectedDepartment: string;
};

const getProjectPersonIds = (project: TicketProjectStatsDto): string[] => {
  const ids: string[] = [];
  if (project.projectManager?.id) ids.push(project.projectManager.id);
  for (const e of project.employees) {
    if (e.id) ids.push(e.id);
  }
  return ids;
};

const projectMatchesDepartment = (
  project: TicketProjectStatsDto,
  department: string,
  userDepartmentById: Map<string, string>,
): boolean => {
  const personIds = getProjectPersonIds(project);
  return personIds.some((id) => userDepartmentById.get(id) === department);
};

const applyClientFilters = (
  projects: TicketProjectStatsDto[],
  params: FilterParams,
  userDepartmentById: Map<string, string>,
): TicketProjectStatsDto[] => {
  let filtered = projects;
  const {
    searchTerm,
    selectedPersonId,
    selectedCustomer,
    selectedModule,
    selectedStatus,
    selectedDepartment,
  } = params;

  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter((p) => {
      const persons = [p.projectManager?.fullName ?? "", ...p.employees.map((e) => e.fullName)]
        .join(" ")
        .toLowerCase();
      return (
        (p.projectDescription ?? "").toLowerCase().includes(q) ||
        (p.projectSubDescription ?? "").toLowerCase().includes(q) ||
        (p.customerName ?? "").toLowerCase().includes(q) ||
        persons.includes(q)
      );
    });
  }

  if (selectedPersonId !== "All") {
    filtered = filtered.filter(
      (p) =>
        p.projectManager?.id === selectedPersonId ||
        p.employees.some((e) => e.id === selectedPersonId),
    );
  }

  if (selectedCustomer !== "All") {
    filtered = filtered.filter((p) => p.customerName === selectedCustomer);
  }

  if (selectedModule !== "All") {
    filtered = filtered.filter((p) => p.modules.includes(selectedModule));
  }

  if (selectedStatus !== "All") {
    filtered = filtered.filter(
      (p) => getProjectColumnKey(p.projectStatus) === selectedStatus,
    );
  }

  if (selectedDepartment !== "All") {
    filtered = filtered.filter((p) =>
      projectMatchesDepartment(p, selectedDepartment, userDepartmentById),
    );
  }

  return filtered;
};

export const useProjectStatisticsFilters = (
  projects: TicketProjectStatsDto[],
  userDepartmentById: Map<string, string>,
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<ProjectTypeColumnKey | "All">("All");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");

  const filterParams = useMemo(
    (): FilterParams => ({
      searchTerm,
      selectedPersonId,
      selectedCustomer,
      selectedModule,
      selectedStatus,
      selectedDepartment,
    }),
    [
      searchTerm,
      selectedPersonId,
      selectedCustomer,
      selectedModule,
      selectedStatus,
      selectedDepartment,
    ],
  );

  const filteredProjects = useMemo(
    () => applyClientFilters(projects, filterParams, userDepartmentById),
    [projects, filterParams, userDepartmentById],
  );

  const baseForPerson = useMemo(
    () =>
      applyClientFilters(
        projects,
        { ...filterParams, selectedPersonId: "All" },
        userDepartmentById,
      ),
    [projects, filterParams, userDepartmentById],
  );

  const baseForCustomer = useMemo(
    () =>
      applyClientFilters(
        projects,
        { ...filterParams, selectedCustomer: "All" },
        userDepartmentById,
      ),
    [projects, filterParams, userDepartmentById],
  );

  const baseForModule = useMemo(
    () =>
      applyClientFilters(
        projects,
        { ...filterParams, selectedModule: "All" },
        userDepartmentById,
      ),
    [projects, filterParams, userDepartmentById],
  );

  const baseForStatus = useMemo(
    () =>
      applyClientFilters(
        projects,
        { ...filterParams, selectedStatus: "All" },
        userDepartmentById,
      ),
    [projects, filterParams, userDepartmentById],
  );

  const baseForDepartment = useMemo(
    () =>
      applyClientFilters(
        projects,
        { ...filterParams, selectedDepartment: "All" },
        userDepartmentById,
      ),
    [projects, filterParams, userDepartmentById],
  );

  const allPersons = useMemo((): { id: string; name: string }[] => {
    const map = new Map<string, string>();
    for (const p of projects) {
      if (p.projectManager) map.set(p.projectManager.id, p.projectManager.fullName);
      for (const e of p.employees) map.set(e.id, e.fullName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [projects]);

  const uniquePersons = useMemo(
    (): PersonItem[] =>
      allPersons.map(({ id, name }) => ({
        id,
        name,
        count: baseForPerson.filter(
          (p) => p.projectManager?.id === id || p.employees.some((e) => e.id === id),
        ).length,
      })),
    [allPersons, baseForPerson],
  );

  const uniqueCustomers = useMemo(
    (): LabelCountItem[] =>
      Array.from(new Set(baseForCustomer.map((p) => p.customerName).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "tr"))
        .map((name) => ({
          name,
          count: baseForCustomer.filter((p) => p.customerName === name).length,
        })),
    [baseForCustomer],
  );

  const uniqueModules = useMemo((): LabelCountItem[] => {
    const countMap = new Map<string, number>();
    for (const p of baseForModule) {
      for (const m of p.modules) {
        countMap.set(m, (countMap.get(m) ?? 0) + 1);
      }
    }
    return Array.from(countMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "tr"))
      .map(([name, count]) => ({ name, count }));
  }, [baseForModule]);

  const uniqueStatuses = useMemo((): StatusItem[] => {
    const columns = getProjectTypeColumns();
    return columns.map(({ key, label }) => ({
      key,
      label,
      count: baseForStatus.filter((p) => getProjectColumnKey(p.projectStatus) === key).length,
    }));
  }, [baseForStatus]);

  const uniqueDepartments = useMemo((): LabelCountItem[] => {
    const deptSet = new Set<string>();
    for (const p of baseForDepartment) {
      for (const id of getProjectPersonIds(p)) {
        const dept = userDepartmentById.get(id)?.trim();
        if (dept) deptSet.add(dept);
      }
    }
    return Array.from(deptSet)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((name) => ({
        name,
        count: baseForDepartment.filter((p) =>
          projectMatchesDepartment(p, name, userDepartmentById),
        ).length,
      }));
  }, [baseForDepartment, userDepartmentById]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePersonSelect = useCallback((id: string) => {
    setSelectedPersonId(id);
    setPersonSearch("");
  }, []);

  const handleCustomerSelect = useCallback((customer: string) => {
    setSelectedCustomer(customer);
  }, []);

  const handleModuleSelect = useCallback((module: string) => {
    setSelectedModule(module);
  }, []);

  const handleStatusSelect = useCallback((status: ProjectTypeColumnKey | "All") => {
    setSelectedStatus(status);
  }, []);

  const handleDepartmentSelect = useCallback((department: string) => {
    setSelectedDepartment(department);
  }, []);

  const activeFilterCount = useMemo(
    () =>
      [
        searchTerm.trim() ? 1 : 0,
        selectedPersonId !== "All" ? 1 : 0,
        selectedCustomer !== "All" ? 1 : 0,
        selectedModule !== "All" ? 1 : 0,
        selectedStatus !== "All" ? 1 : 0,
        selectedDepartment !== "All" ? 1 : 0,
      ].reduce((a, b) => a + b, 0),
    [
      searchTerm,
      selectedPersonId,
      selectedCustomer,
      selectedModule,
      selectedStatus,
      selectedDepartment,
    ],
  );

  return {
    searchTerm,
    selectedPersonId,
    selectedCustomer,
    selectedModule,
    selectedStatus,
    selectedDepartment,
    personSearch,
    setPersonSearch,
    sidebarOpen,
    setSidebarOpen,
    handleSearchChange,
    handlePersonSelect,
    handleCustomerSelect,
    handleModuleSelect,
    handleStatusSelect,
    handleDepartmentSelect,
    filteredProjects,
    uniquePersons,
    uniqueCustomers,
    uniqueModules,
    uniqueStatuses,
    uniqueDepartments,
    departmentAllCount: baseForDepartment.length,
    activeFilterCount,
    totalCount: projects.length,
    filteredCount: filteredProjects.length,
  };
};
