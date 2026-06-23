import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkCompanyApi, WorkCompanyDto } from "api/generated";
import getConfiguration from "confiuration";
import type { TicketProjectStatsDto } from "../types";

export type PersonItem = { id: string; name: string; count: number };
export type LabelCountItem = { name: string; count: number };

const applyClientFilters = (
  projects: TicketProjectStatsDto[],
  searchTerm: string,
  selectedPersonId: string,
  selectedCustomer: string,
  selectedModule: string,
): TicketProjectStatsDto[] => {
  let filtered = projects;

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

  return filtered;
};

export const useProjectStatisticsFilters = (projects: TicketProjectStatsDto[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedCompanyId, setSelectedCompanyId] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const [companies, setCompanies] = useState<WorkCompanyDto[]>([]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const api = new WorkCompanyApi(getConfiguration());
        const res = await api.apiWorkCompanyGetAssingListGet();
        setCompanies(res.data ?? []);
      } catch {
        // ignore — companies are optional enhancement
      }
    };
    loadCompanies();
  }, []);

  const filteredProjects = useMemo(
    () => applyClientFilters(projects, searchTerm, selectedPersonId, selectedCustomer, selectedModule),
    [projects, searchTerm, selectedPersonId, selectedCustomer, selectedModule],
  );

  // Base for each section's counts: apply all filters EXCEPT the section's own filter
  const baseForPerson = useMemo(
    () => applyClientFilters(projects, searchTerm, "All", selectedCustomer, selectedModule),
    [projects, searchTerm, selectedCustomer, selectedModule],
  );

  const baseForCustomer = useMemo(
    () => applyClientFilters(projects, searchTerm, selectedPersonId, "All", selectedModule),
    [projects, searchTerm, selectedPersonId, selectedModule],
  );

  const baseForModule = useMemo(
    () => applyClientFilters(projects, searchTerm, selectedPersonId, selectedCustomer, "All"),
    [projects, searchTerm, selectedPersonId, selectedCustomer],
  );

  // All unique persons across all loaded projects (for the sidebar list)
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

  const handleCompanySelect = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
    // Reset all client-side filters when the data source changes
    setSearchTerm("");
    setSelectedPersonId("All");
    setSelectedCustomer("All");
    setSelectedModule("All");
    setPersonSearch("");
  }, []);

  const activeFilterCount = useMemo(
    () =>
      [
        searchTerm.trim() ? 1 : 0,
        selectedPersonId !== "All" ? 1 : 0,
        selectedCustomer !== "All" ? 1 : 0,
        selectedModule !== "All" ? 1 : 0,
      ].reduce((a, b) => a + b, 0),
    [searchTerm, selectedPersonId, selectedCustomer, selectedModule],
  );

  return {
    searchTerm,
    selectedPersonId,
    selectedCustomer,
    selectedModule,
    selectedCompanyId,
    personSearch,
    setPersonSearch,
    sidebarOpen,
    setSidebarOpen,
    handleSearchChange,
    handlePersonSelect,
    handleCustomerSelect,
    handleModuleSelect,
    handleCompanySelect,
    filteredProjects,
    uniquePersons,
    uniqueCustomers,
    uniqueModules,
    companies,
    activeFilterCount,
    totalCount: projects.length,
    filteredCount: filteredProjects.length,
  };
};
