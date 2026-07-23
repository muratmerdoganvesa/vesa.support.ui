import { useCallback, useMemo, useState } from "react";
import {
  getProjectTypeColumns,
  UNASSIGNED_PROJECT_TYPE_KEY,
  type ProjectTypeColumnKey,
} from "../projectTypeHelpers";
import type { StatsBoardItem } from "../types";

export type PersonItem = { id: string; name: string; count: number };
export type LabelCountItem = { name: string; count: number };
export type StatusItem = { key: ProjectTypeColumnKey; label: string; count: number };
/** all: hepsi · plansOnly: sadece simülasyon planları · hidePlans: planları gizle */
export type PlanVisibility = "all" | "plansOnly" | "hidePlans";

type FilterParams = {
  searchTerm: string;
  selectedPersonId: string;
  selectedCustomer: string;
  selectedModule: string;
  selectedStatus: ProjectTypeColumnKey | "All";
  selectedDepartment: string;
  selectedLevel: string;
  planVisibility: PlanVisibility;
};

const getItemPersonIds = (item: StatsBoardItem): string[] => {
  const ids: string[] = [];
  if (item.projectManager?.id) ids.push(item.projectManager.id);
  for (const e of item.employees) {
    if (e.id) ids.push(e.id);
  }
  return ids;
};

const itemMatchesLookup = (
  item: StatsBoardItem,
  value: string,
  lookupById: Map<string, string>,
): boolean => {
  const personIds = getItemPersonIds(item);
  return personIds.some((id) => lookupById.get(id) === value);
};

const itemMatchesStatus = (
  item: StatsBoardItem,
  selectedStatus: ProjectTypeColumnKey,
): boolean => {
  if (selectedStatus === UNASSIGNED_PROJECT_TYPE_KEY) {
    return (
      item.kind === "project" ||
      (item.kind === "simulated" && item.projectStatus == null)
    );
  }
  return (
    (item.kind === "kalem" || item.kind === "simulated") &&
    item.projectStatus === selectedStatus
  );
};

const applyClientFilters = (
  items: StatsBoardItem[],
  params: FilterParams,
  userDepartmentById: Map<string, string>,
  userLevelById: Map<string, string>,
): StatsBoardItem[] => {
  let filtered = items;
  const {
    searchTerm,
    selectedPersonId,
    selectedCustomer,
    selectedModule,
    selectedStatus,
    selectedDepartment,
    selectedLevel,
    planVisibility,
  } = params;

  if (planVisibility === "plansOnly") {
    filtered = filtered.filter((item) => item.kind === "simulated");
  } else if (planVisibility === "hidePlans") {
    filtered = filtered.filter((item) => item.kind !== "simulated");
  }

  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter((item) => {
      const persons = [
        item.projectManager?.fullName ?? "",
        ...item.employees.map((e) => e.fullName),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (item.kalemName ?? "").toLowerCase().includes(q) ||
        (item.projectDescription ?? "").toLowerCase().includes(q) ||
        (item.projectSubDescription ?? "").toLowerCase().includes(q) ||
        (item.customerName ?? "").toLowerCase().includes(q) ||
        persons.includes(q)
      );
    });
  }

  if (selectedPersonId !== "All") {
    filtered = filtered.filter(
      (item) =>
        item.projectManager?.id === selectedPersonId ||
        item.employees.some((e) => e.id === selectedPersonId),
    );
  }

  if (selectedCustomer !== "All") {
    filtered = filtered.filter((item) => item.customerName === selectedCustomer);
  }

  if (selectedModule !== "All") {
    filtered = filtered.filter((item) => item.modules.includes(selectedModule));
  }

  if (selectedStatus !== "All") {
    filtered = filtered.filter((item) => itemMatchesStatus(item, selectedStatus));
  }

  if (selectedDepartment !== "All") {
    filtered = filtered.filter((item) =>
      itemMatchesLookup(item, selectedDepartment, userDepartmentById),
    );
  }

  if (selectedLevel !== "All") {
    filtered = filtered.filter((item) => itemMatchesLookup(item, selectedLevel, userLevelById));
  }

  return filtered;
};

export const useProjectStatisticsFilters = (
  items: StatsBoardItem[],
  userDepartmentById: Map<string, string>,
  userLevelById: Map<string, string>,
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<ProjectTypeColumnKey | "All">("All");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [planVisibility, setPlanVisibility] = useState<PlanVisibility>("all");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");

  const filterParams = useMemo(
    (): FilterParams => ({
      searchTerm,
      selectedPersonId,
      selectedCustomer,
      selectedModule,
      selectedStatus,
      selectedDepartment,
      selectedLevel,
      planVisibility,
    }),
    [
      searchTerm,
      selectedPersonId,
      selectedCustomer,
      selectedModule,
      selectedStatus,
      selectedDepartment,
      selectedLevel,
      planVisibility,
    ],
  );

  const filteredItems = useMemo(
    () => applyClientFilters(items, filterParams, userDepartmentById, userLevelById),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const baseForPerson = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, selectedPersonId: "All" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const baseForCustomer = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, selectedCustomer: "All" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const baseForModule = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, selectedModule: "All" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const baseForStatus = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, selectedStatus: "All" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const baseForDepartment = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, selectedDepartment: "All" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const baseForLevel = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, selectedLevel: "All" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  /** Diğer tüm filtreler uygulanmış ama arama terimi hariç bırakılmış öğeler.
   * Kişi görünümünde arama, kartları değil kişileri süzmek için kullanılır. */
  const filteredItemsIgnoringSearch = useMemo(
    () =>
      applyClientFilters(
        items,
        { ...filterParams, searchTerm: "" },
        userDepartmentById,
        userLevelById,
      ),
    [items, filterParams, userDepartmentById, userLevelById],
  );

  const allPersons = useMemo((): { id: string; name: string }[] => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.projectManager) map.set(item.projectManager.id, item.projectManager.fullName);
      for (const e of item.employees) map.set(e.id, e.fullName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [items]);

  const uniquePersons = useMemo(
    (): PersonItem[] =>
      allPersons.map(({ id, name }) => ({
        id,
        name,
        count: baseForPerson.filter(
          (item) =>
            item.projectManager?.id === id || item.employees.some((e) => e.id === id),
        ).length,
      })),
    [allPersons, baseForPerson],
  );

  const uniqueCustomers = useMemo(
    (): LabelCountItem[] =>
      Array.from(new Set(baseForCustomer.map((item) => item.customerName).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "tr"))
        .map((name) => ({
          name,
          count: baseForCustomer.filter((item) => item.customerName === name).length,
        })),
    [baseForCustomer],
  );

  const uniqueModules = useMemo((): LabelCountItem[] => {
    const countMap = new Map<string, number>();
    for (const item of baseForModule) {
      for (const m of item.modules) {
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
      count: baseForStatus.filter((item) => itemMatchesStatus(item, key)).length,
    }));
  }, [baseForStatus]);

  const uniqueDepartments = useMemo((): LabelCountItem[] => {
    const deptSet = new Set<string>();
    for (const item of baseForDepartment) {
      for (const id of getItemPersonIds(item)) {
        const dept = userDepartmentById.get(id)?.trim();
        if (dept) deptSet.add(dept);
      }
    }
    return Array.from(deptSet)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((name) => ({
        name,
        count: baseForDepartment.filter((item) =>
          itemMatchesLookup(item, name, userDepartmentById),
        ).length,
      }));
  }, [baseForDepartment, userDepartmentById]);

  const uniqueLevels = useMemo((): LabelCountItem[] => {
    const levelSet = new Set<string>();
    for (const item of baseForLevel) {
      for (const id of getItemPersonIds(item)) {
        const level = userLevelById.get(id)?.trim();
        if (level) levelSet.add(level);
      }
    }
    return Array.from(levelSet)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((name) => ({
        name,
        count: baseForLevel.filter((item) => itemMatchesLookup(item, name, userLevelById)).length,
      }));
  }, [baseForLevel, userLevelById]);

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

  const handleLevelSelect = useCallback((level: string) => {
    setSelectedLevel(level);
  }, []);

  const handlePlanVisibilitySelect = useCallback((visibility: PlanVisibility) => {
    setPlanVisibility(visibility);
  }, []);

  const planVisibilityCounts = useMemo(() => {
    const base = applyClientFilters(
      items,
      { ...filterParams, planVisibility: "all" },
      userDepartmentById,
      userLevelById,
    );
    const plans = base.filter((item) => item.kind === "simulated").length;
    return {
      all: base.length,
      plansOnly: plans,
      hidePlans: base.length - plans,
    };
  }, [items, filterParams, userDepartmentById, userLevelById]);

  const activeFilterCount = useMemo(
    () =>
      [
        searchTerm.trim() ? 1 : 0,
        selectedPersonId !== "All" ? 1 : 0,
        selectedCustomer !== "All" ? 1 : 0,
        selectedModule !== "All" ? 1 : 0,
        selectedStatus !== "All" ? 1 : 0,
        selectedDepartment !== "All" ? 1 : 0,
        selectedLevel !== "All" ? 1 : 0,
        planVisibility !== "all" ? 1 : 0,
      ].reduce((a, b) => a + b, 0),
    [
      searchTerm,
      selectedPersonId,
      selectedCustomer,
      selectedModule,
      selectedStatus,
      selectedDepartment,
      selectedLevel,
      planVisibility,
    ],
  );

  return {
    searchTerm,
    selectedPersonId,
    selectedCustomer,
    selectedModule,
    selectedStatus,
    selectedDepartment,
    selectedLevel,
    planVisibility,
    personSearch,
    setPersonSearch,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    handleSearchChange,
    handlePersonSelect,
    handleCustomerSelect,
    handleModuleSelect,
    handleStatusSelect,
    handleDepartmentSelect,
    handleLevelSelect,
    handlePlanVisibilitySelect,
    filteredItems,
    filteredItemsIgnoringSearch,
    uniquePersons,
    uniqueCustomers,
    uniqueModules,
    uniqueStatuses,
    uniqueDepartments,
    uniqueLevels,
    planVisibilityCounts,
    departmentAllCount: baseForDepartment.length,
    activeFilterCount,
    totalCount: items.length,
    filteredCount: filteredItems.length,
  };
};
