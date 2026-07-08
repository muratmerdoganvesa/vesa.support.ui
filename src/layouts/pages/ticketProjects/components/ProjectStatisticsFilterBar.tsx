import { useMemo, useState } from "react";
import {
  Building2,
  CircleDot,
  Landmark,
  Package,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "components/ui/accordion";
import { getProjectTypeColumnColors } from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { ProjectTypeColumnKey } from "layouts/pages/ticketProjects/projectTypeHelpers";
import type { LabelCountItem, PersonItem, StatusItem } from "../hooks/useProjectStatisticsFilters";

type Props = {
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  uniqueStatuses: StatusItem[];
  selectedStatus: ProjectTypeColumnKey | "All";
  onStatusSelect: (status: ProjectTypeColumnKey | "All") => void;
  uniqueDepartments: LabelCountItem[];
  selectedDepartment: string;
  onDepartmentSelect: (department: string) => void;
  departmentAllCount: number;
  uniquePersons: PersonItem[];
  selectedPersonId: string;
  onPersonSelect: (id: string) => void;
  personSearch: string;
  onPersonSearchChange: (s: string) => void;
  uniqueCustomers: LabelCountItem[];
  selectedCustomer: string;
  onCustomerSelect: (name: string) => void;
  uniqueModules: LabelCountItem[];
  selectedModule: string;
  onModuleSelect: (name: string) => void;
  totalCount: number;
  filteredCount: number;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (open: boolean) => void;
};

type FilterOption = {
  key: string;
  label: string;
  count: number;
  indicator: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
};

type FilterGroupConfig = {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeLabel?: string;
  activeCount?: number;
  options: FilterOption[];
  searchSlot?: React.ReactNode;
  emptyMessage?: string;
};

type ActiveFilterChip = {
  key: string;
  label: string;
  onClear: () => void;
};

const NeutralDot = ({ isSelected }: { isSelected: boolean }) => (
  <span
    className={cn("size-2 shrink-0 rounded-full", isSelected ? "bg-slate-800" : "bg-slate-300")}
    aria-hidden
  />
);

const PersonDot = ({ name, isSelected }: { name: string; isSelected: boolean }) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ring-1 ring-white",
        isSelected ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600",
      )}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
};

const SearchField = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  className,
  size = "default",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm";
}) => (
  <div className={cn("relative", className)}>
    <Search
      className={cn(
        "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400",
        size === "sm" ? "size-3" : "size-3.5",
      )}
      aria-hidden
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 disabled:opacity-50 dark:border-border dark:bg-card dark:text-foreground",
        size === "sm" ? "h-7 pl-7 pr-6 text-xs" : "h-9 pl-8 pr-8 text-sm",
      )}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label={`${ariaLabel} - temizle`}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
      >
        <X className={size === "sm" ? "size-3" : "size-3.5"} />
      </button>
    )}
  </div>
);

const FilterOptionList = ({
  options,
  emptyMessage,
  maxHeightClassName = "max-h-56",
}: {
  options: FilterOption[];
  emptyMessage?: string;
  maxHeightClassName?: string;
}) => (
  <div
    className={cn("space-y-0.5 overflow-y-auto pr-0.5", maxHeightClassName)}
    role="listbox"
  >
    {options.map((option) => (
      <button
        key={option.key}
        type="button"
        role="option"
        aria-selected={option.isSelected}
        onClick={option.onSelect}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
          option.isSelected
            ? "bg-slate-100 font-semibold text-slate-900 dark:bg-muted dark:text-foreground"
            : "text-slate-600 hover:bg-slate-50 dark:text-muted-foreground dark:hover:bg-muted/50",
        )}
      >
        {option.indicator}
        <span className="flex-1 truncate">{option.label}</span>
        <span
          className={cn(
            "min-w-[20px] shrink-0 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
            option.isSelected ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-400",
          )}
        >
          {option.count}
        </span>
      </button>
    ))}
    {options.length <= 1 && emptyMessage && (
      <p className="px-2.5 py-2 text-center text-xs text-slate-400">{emptyMessage}</p>
    )}
  </div>
);

const FilterLabelContent = ({
  icon,
  label,
  activeLabel,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  activeLabel?: string;
  count?: number;
}) => (
  <span className="flex min-w-0 flex-1 items-center gap-1.5">
    <span className="shrink-0 text-slate-400" aria-hidden>
      {icon}
    </span>
    <span className="truncate">
      {activeLabel ? (
        <>
          <span className="text-slate-500">{label}:</span> {activeLabel}
        </>
      ) : (
        label
      )}
    </span>
    {typeof count === "number" && (
      <Badge
        variant="secondary"
        className="h-4 shrink-0 px-1.5 text-[10px] tabular-nums"
      >
        {count}
      </Badge>
    )}
  </span>
);

const ActiveFilterChipsRow = ({
  chips,
  onResetAll,
}: {
  chips: ActiveFilterChip[];
  onResetAll: () => void;
}) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Aktif filtreler">
      {chips.map((chip) => (
        <span
          key={chip.key}
          role="listitem"
          className="inline-flex h-6 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-2.5 pr-1 text-[11px] font-medium text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onClear}
            aria-label={`${chip.label} filtresini kaldır`}
            className="flex size-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onResetAll}
        aria-label="Tüm filtreleri temizle"
        className="text-[11px] font-semibold text-slate-500 underline-offset-2 transition-colors hover:text-slate-800 hover:underline"
      >
        Tümünü temizle
      </button>
    </div>
  );
};

const ProjectStatisticsFilterBar = ({
  isLoading,
  searchTerm,
  onSearchChange,
  uniqueStatuses,
  selectedStatus,
  onStatusSelect,
  uniqueDepartments,
  selectedDepartment,
  onDepartmentSelect,
  departmentAllCount,
  uniquePersons,
  selectedPersonId,
  onPersonSelect,
  personSearch,
  onPersonSearchChange,
  uniqueCustomers,
  selectedCustomer,
  onCustomerSelect,
  uniqueModules,
  selectedModule,
  onModuleSelect,
  totalCount,
  filteredCount,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
}: Props) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");

  const filteredPersonList = uniquePersons.filter(
    ({ name }) => !personSearch || name.toLowerCase().includes(personSearch.toLowerCase()),
  );
  const filteredCustomerList = uniqueCustomers.filter(
    ({ name }) => !customerSearch || name.toLowerCase().includes(customerSearch.toLowerCase()),
  );
  const filteredDepartmentList = uniqueDepartments.filter(
    ({ name }) => !departmentSearch || name.toLowerCase().includes(departmentSearch.toLowerCase()),
  );

  const statusGroup: FilterGroupConfig | null = useMemo(() => {
    if (uniqueStatuses.length === 0) return null;
    const totalStatusCount = uniqueStatuses.reduce((s, st) => s + st.count, 0);
    const activeStatus = uniqueStatuses.find((s) => s.key === selectedStatus);
    const options: FilterOption[] = [
      {
        key: "All",
        label: "Tümü",
        count: totalStatusCount,
        indicator: <NeutralDot isSelected={selectedStatus === "All"} />,
        isSelected: selectedStatus === "All",
        onSelect: () => onStatusSelect("All"),
      },
      ...uniqueStatuses.map(({ key, label, count }) => ({
        key: String(key),
        label,
        count,
        indicator: (
          <span
            className={cn("size-2 shrink-0 rounded-full", getProjectTypeColumnColors(label).dot)}
            aria-hidden
          />
        ),
        isSelected: selectedStatus === key,
        onSelect: () => onStatusSelect(key),
      })),
    ];
    return {
      key: "status",
      label: "Durum",
      icon: <CircleDot className="size-3.5" />,
      activeLabel: activeStatus?.label,
      activeCount: activeStatus?.count,
      options,
    };
  }, [uniqueStatuses, selectedStatus, onStatusSelect]);

  const departmentGroup: FilterGroupConfig | null = useMemo(() => {
    if (uniqueDepartments.length === 0) return null;
    const options: FilterOption[] = [
      {
        key: "All",
        label: "Tümü",
        count: departmentAllCount,
        indicator: <NeutralDot isSelected={selectedDepartment === "All"} />,
        isSelected: selectedDepartment === "All",
        onSelect: () => onDepartmentSelect("All"),
      },
      ...filteredDepartmentList.map(({ name, count }) => ({
        key: name,
        label: name,
        count,
        indicator: <NeutralDot isSelected={selectedDepartment === name} />,
        isSelected: selectedDepartment === name,
        onSelect: () => onDepartmentSelect(name),
      })),
    ];
    return {
      key: "department",
      label: "Departman",
      icon: <Landmark className="size-3.5" />,
      activeLabel: selectedDepartment !== "All" ? selectedDepartment : undefined,
      activeCount:
        selectedDepartment !== "All"
          ? uniqueDepartments.find((d) => d.name === selectedDepartment)?.count
          : undefined,
      options,
      emptyMessage: "Departman bulunamadı",
      searchSlot: (
        <SearchField
          value={departmentSearch}
          onChange={setDepartmentSearch}
          placeholder="Departman ara..."
          ariaLabel="Departmanlarda ara"
          size="sm"
          className="mb-2"
        />
      ),
    };
  }, [
    uniqueDepartments,
    filteredDepartmentList,
    selectedDepartment,
    departmentAllCount,
    onDepartmentSelect,
    departmentSearch,
  ]);

  const personGroup: FilterGroupConfig | null = useMemo(() => {
    if (uniquePersons.length === 0) return null;
    const totalPersonCount = uniquePersons.reduce((s, p) => s + p.count, 0);
    const activePerson = uniquePersons.find((p) => p.id === selectedPersonId);
    const options: FilterOption[] = [
      {
        key: "All",
        label: "Tümü",
        count: totalPersonCount,
        indicator: <PersonDot name="∗" isSelected={selectedPersonId === "All"} />,
        isSelected: selectedPersonId === "All",
        onSelect: () => onPersonSelect("All"),
      },
      ...filteredPersonList.map(({ id, name, count }) => ({
        key: id,
        label: name,
        count,
        indicator: <PersonDot name={name} isSelected={selectedPersonId === id} />,
        isSelected: selectedPersonId === id,
        onSelect: () => onPersonSelect(id),
      })),
    ];
    return {
      key: "person",
      label: "Kişi",
      icon: <User className="size-3.5" />,
      activeLabel: activePerson?.name,
      activeCount: activePerson?.count,
      options,
      emptyMessage: "Kişi bulunamadı",
      searchSlot: (
        <SearchField
          value={personSearch}
          onChange={onPersonSearchChange}
          placeholder="Kişi ara..."
          ariaLabel="Kişilerde ara"
          size="sm"
          className="mb-2"
        />
      ),
    };
  }, [uniquePersons, filteredPersonList, selectedPersonId, onPersonSelect, personSearch, onPersonSearchChange]);

  const customerGroup: FilterGroupConfig | null = useMemo(() => {
    if (uniqueCustomers.length === 0) return null;
    const totalCustomerCount = uniqueCustomers.reduce((s, c) => s + c.count, 0);
    const options: FilterOption[] = [
      {
        key: "All",
        label: "Tümü",
        count: totalCustomerCount,
        indicator: <NeutralDot isSelected={selectedCustomer === "All"} />,
        isSelected: selectedCustomer === "All",
        onSelect: () => onCustomerSelect("All"),
      },
      ...filteredCustomerList.map(({ name, count }) => ({
        key: name,
        label: name,
        count,
        indicator: <NeutralDot isSelected={selectedCustomer === name} />,
        isSelected: selectedCustomer === name,
        onSelect: () => onCustomerSelect(name),
      })),
    ];
    return {
      key: "customer",
      label: "Müşteri",
      icon: <Building2 className="size-3.5" />,
      activeLabel: selectedCustomer !== "All" ? selectedCustomer : undefined,
      activeCount:
        selectedCustomer !== "All"
          ? uniqueCustomers.find((c) => c.name === selectedCustomer)?.count
          : undefined,
      options,
      emptyMessage: "Müşteri bulunamadı",
      searchSlot: (
        <SearchField
          value={customerSearch}
          onChange={setCustomerSearch}
          placeholder="Müşteri ara..."
          ariaLabel="Müşteri ara"
          size="sm"
          className="mb-2"
        />
      ),
    };
  }, [uniqueCustomers, filteredCustomerList, selectedCustomer, onCustomerSelect, customerSearch]);

  const moduleGroup: FilterGroupConfig | null = useMemo(() => {
    if (uniqueModules.length === 0) return null;
    const totalModuleCount = uniqueModules.reduce((s, m) => s + m.count, 0);
    const options: FilterOption[] = [
      {
        key: "All",
        label: "Tümü",
        count: totalModuleCount,
        indicator: <NeutralDot isSelected={selectedModule === "All"} />,
        isSelected: selectedModule === "All",
        onSelect: () => onModuleSelect("All"),
      },
      ...uniqueModules.map(({ name, count }) => ({
        key: name,
        label: name,
        count,
        indicator: <NeutralDot isSelected={selectedModule === name} />,
        isSelected: selectedModule === name,
        onSelect: () => onModuleSelect(name),
      })),
    ];
    return {
      key: "module",
      label: "Modül",
      icon: <Package className="size-3.5" />,
      activeLabel: selectedModule !== "All" ? selectedModule : undefined,
      activeCount:
        selectedModule !== "All"
          ? uniqueModules.find((m) => m.name === selectedModule)?.count
          : undefined,
      options,
    };
  }, [uniqueModules, selectedModule, onModuleSelect]);

  const filterGroups = useMemo(
    () => [statusGroup, departmentGroup, personGroup, customerGroup, moduleGroup].filter(
      (g): g is FilterGroupConfig => g !== null,
    ),
    [statusGroup, departmentGroup, personGroup, customerGroup, moduleGroup],
  );

  const activeChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    if (searchTerm.trim()) {
      chips.push({
        key: "search",
        label: `Arama: "${searchTerm.trim()}"`,
        onClear: () => onSearchChange(""),
      });
    }
    if (selectedStatus !== "All") {
      const found = uniqueStatuses.find((s) => s.key === selectedStatus);
      chips.push({
        key: "status",
        label: `Durum: ${found?.label ?? "—"}`,
        onClear: () => onStatusSelect("All"),
      });
    }
    if (selectedDepartment !== "All") {
      chips.push({
        key: "department",
        label: `Departman: ${selectedDepartment}`,
        onClear: () => onDepartmentSelect("All"),
      });
    }
    if (selectedPersonId !== "All") {
      const found = uniquePersons.find((p) => p.id === selectedPersonId);
      chips.push({
        key: "person",
        label: `Kişi: ${found?.name ?? "—"}`,
        onClear: () => onPersonSelect("All"),
      });
    }
    if (selectedCustomer !== "All") {
      chips.push({
        key: "customer",
        label: `Müşteri: ${selectedCustomer}`,
        onClear: () => onCustomerSelect("All"),
      });
    }
    if (selectedModule !== "All") {
      chips.push({
        key: "module",
        label: `Modül: ${selectedModule}`,
        onClear: () => onModuleSelect("All"),
      });
    }
    return chips;
  }, [
    searchTerm,
    selectedStatus,
    selectedDepartment,
    selectedPersonId,
    selectedCustomer,
    selectedModule,
    uniqueStatuses,
    uniquePersons,
    onSearchChange,
    onStatusSelect,
    onDepartmentSelect,
    onPersonSelect,
    onCustomerSelect,
    onModuleSelect,
  ]);

  const handleResetAll = () => {
    onSearchChange("");
    onStatusSelect("All");
    onDepartmentSelect("All");
    onPersonSelect("All");
    onCustomerSelect("All");
    onModuleSelect("All");
  };

  const activeFilterCount = activeChips.length;

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-1 pb-3 pt-2 backdrop-blur-sm dark:border-border dark:bg-card/95">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Proje, müşteri, kişi ara..."
            ariaLabel="Projelerde ara"
            disabled={isLoading}
            className="min-w-[180px] flex-1 sm:max-w-xs"
          />

          <div className="hidden flex-wrap items-center gap-1.5 md:flex">
            {filterGroups.map((group) => (
              <Popover key={group.key}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    aria-label={`${group.label} filtresi${
                      group.activeLabel ? `, seçili: ${group.activeLabel}` : ""
                    }`}
                    className={cn(
                      "max-w-[190px] justify-start border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-border dark:bg-card dark:text-muted-foreground",
                      group.activeLabel &&
                        "border-slate-300 bg-slate-50 text-slate-900 dark:bg-muted dark:text-foreground",
                    )}
                  >
                    <FilterLabelContent
                      icon={group.icon}
                      label={group.label}
                      activeLabel={group.activeLabel}
                      count={group.activeLabel ? group.activeCount : undefined}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-64 duration-200 motion-reduce:animate-none motion-reduce:duration-0"
                >
                  {group.searchSlot}
                  <FilterOptionList options={group.options} emptyMessage={group.emptyMessage} />
                </PopoverContent>
              </Popover>
            ))}
          </div>

          <div className="md:hidden">
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  aria-label={`Filtreleri aç${
                    activeFilterCount > 0 ? `, ${activeFilterCount} aktif filtre` : ""
                  }`}
                  className="gap-1.5 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-muted-foreground"
                >
                  <SlidersHorizontal className="size-3.5" />
                  Filtrele
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] tabular-nums">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="flex max-h-[85vh] flex-col rounded-t-2xl p-0 motion-reduce:transition-none"
              >
                <SheetHeader className="border-b border-slate-100 px-4 pb-3 pt-4 dark:border-border">
                  <SheetTitle>Filtreler</SheetTitle>
                  <SheetDescription>
                    <span className="tabular-nums font-semibold text-slate-600 dark:text-foreground">
                      {filteredCount}
                    </span>
                    {" / "}
                    <span className="tabular-nums">{totalCount}</span>
                    {" kart"}
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4">
                  <Accordion type="multiple" defaultValue={["status"]}>
                    {filterGroups.map((group) => (
                      <AccordionItem key={group.key} value={group.key}>
                        <AccordionTrigger
                          aria-label={`${group.label} filtresi${
                            group.activeLabel ? `, seçili: ${group.activeLabel}` : ""
                          }`}
                          className="hover:no-underline"
                        >
                          <FilterLabelContent
                            icon={group.icon}
                            label={group.label}
                            activeLabel={group.activeLabel}
                            count={group.activeLabel ? group.activeCount : undefined}
                          />
                        </AccordionTrigger>
                        <AccordionContent>
                          {group.searchSlot}
                          <FilterOptionList
                            options={group.options}
                            emptyMessage={group.emptyMessage}
                            maxHeightClassName="max-h-48"
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <SheetFooter className="flex-row justify-between border-t border-slate-100 px-4 py-3 dark:border-border">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={activeFilterCount === 0}
                    aria-label="Tüm filtreleri temizle"
                    className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40"
                  >
                    Tümünü temizle
                  </button>
                  <Button type="button" size="sm" onClick={() => setIsMobileFilterOpen(false)}>
                    Kapat
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <ActiveFilterChipsRow chips={activeChips} onResetAll={handleResetAll} />
      </div>
    </div>
  );
};

export default ProjectStatisticsFilterBar;
