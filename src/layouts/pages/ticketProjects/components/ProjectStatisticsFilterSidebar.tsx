import { useState } from "react";
import { Building2, Package, Search, User, X } from "lucide-react";
import { cn } from "lib/utils";
import type { WorkCompanyDto } from "api/generated";
import type { LabelCountItem, PersonItem } from "../hooks/useProjectStatisticsFilters";

type Props = {
  isLoading: boolean;
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  // Company (server-side filter)
  companies: WorkCompanyDto[];
  selectedCompanyId: string;
  onCompanySelect: (id: string) => void;
  // Person
  uniquePersons: PersonItem[];
  selectedPersonId: string;
  onPersonSelect: (id: string) => void;
  personSearch: string;
  onPersonSearchChange: (s: string) => void;
  // Customer
  uniqueCustomers: LabelCountItem[];
  selectedCustomer: string;
  onCustomerSelect: (name: string) => void;
  // Module
  uniqueModules: LabelCountItem[];
  selectedModule: string;
  onModuleSelect: (name: string) => void;
  // Counts
  totalCount: number;
  filteredCount: number;
};

const SectionLabel = ({
  icon,
  label,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  onClear?: () => void;
}) => (
  <div className="px-2 mb-1.5 flex items-center justify-between">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    {onClear && (
      <button
        type="button"
        onClick={onClear}
        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
      >
        Temizle
      </button>
    )}
  </div>
);

const SectionSearch = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
}) => (
  <div className="relative mx-1 mb-2">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="w-full h-7 pl-7 pr-6 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label={`${ariaLabel} temizle`}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

const FilterButton = ({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
      isActive ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50",
    )}
  >
    {children}
  </button>
);

const CountBadge = ({ count, isActive }: { count: number; isActive: boolean }) => (
  <span
    className={cn(
      "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
      isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400",
    )}
  >
    {count}
  </span>
);

const ProjectStatisticsFilterSidebar = ({
  isLoading,
  searchTerm,
  onSearchChange,
  companies,
  selectedCompanyId,
  onCompanySelect,
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
}: Props) => {
  const [companySearch, setCompanySearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredCompanyList = companies.filter(
    ({ name }) => !companySearch || (name ?? "").toLowerCase().includes(companySearch.toLowerCase()),
  );

  const filteredPersonList = uniquePersons.filter(
    ({ name }) => !personSearch || name.toLowerCase().includes(personSearch.toLowerCase()),
  );

  const filteredCustomerList = uniqueCustomers.filter(
    ({ name }) => !customerSearch || name.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  return (
    <div className="mt-1 flex-1 overflow-y-auto pt-3 space-y-5 px-2">

      {/* ARAMA */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Proje, müşteri, kişi ara..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Projelerde ara"
          disabled={isLoading}
          className="w-full h-8 pl-9 pr-8 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white disabled:opacity-50"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Aramayı temizle"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Toplam sayaç */}
      <div className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-[10px] text-slate-400 font-medium">
          <span className="tabular-nums font-bold text-slate-600">{filteredCount}</span>
          {" / "}
          <span className="tabular-nums">{totalCount}</span>
          {" proje"}
        </p>
      </div>

      {/* ŞİRKET */}
      {companies.length > 0 && (
        <div>
          <SectionLabel
            icon={<Building2 className="w-3 h-3" />}
            label="Şirket"
            onClear={selectedCompanyId !== "All" ? () => onCompanySelect("All") : undefined}
          />
          <SectionSearch
            value={companySearch}
            onChange={setCompanySearch}
            placeholder="Şirket ara..."
            ariaLabel="Şirket ara"
          />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            <FilterButton isActive={selectedCompanyId === "All"} onClick={() => onCompanySelect("All")}>
              {selectedCompanyId === "All" && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              )}
              <span className={cn("flex-1 truncate text-xs", selectedCompanyId !== "All" && "pl-3.5")}>
                Tümü
              </span>
              <CountBadge count={totalCount} isActive={selectedCompanyId === "All"} />
            </FilterButton>
            {filteredCompanyList.map((company) => {
              const id = company.id ?? "";
              const isActive = selectedCompanyId === id;
              return (
                <FilterButton key={id} isActive={isActive} onClick={() => onCompanySelect(id)}>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                  <span className={cn("flex-1 truncate text-xs", !isActive && "pl-3.5")}>
                    {company.name ?? "—"}
                  </span>
                </FilterButton>
              );
            })}
            {companySearch && filteredCompanyList.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-slate-400 text-center">Şirket bulunamadı</p>
            )}
          </div>
        </div>
      )}

      {/* KİŞİ */}
      {uniquePersons.length > 0 && (
        <div>
          <SectionLabel
            icon={<User className="w-3 h-3" />}
            label="Kişi"
            onClear={selectedPersonId !== "All" ? () => onPersonSelect("All") : undefined}
          />
          <SectionSearch
            value={personSearch}
            onChange={onPersonSearchChange}
            placeholder="Kişi ara..."
            ariaLabel="Kişilerde ara"
          />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            <FilterButton isActive={selectedPersonId === "All"} onClick={() => onPersonSelect("All")}>
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                ∗
              </span>
              <span className="flex-1 truncate text-xs">Tümü</span>
              <CountBadge
                count={uniquePersons.reduce((s, p) => s + p.count, 0)}
                isActive={selectedPersonId === "All"}
              />
            </FilterButton>
            {filteredPersonList.map(({ id, name, count }) => {
              const isActive = selectedPersonId === id;
              const initials = name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("");
              return (
                <FilterButton key={id} isActive={isActive} onClick={() => onPersonSelect(id)}>
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ring-1 ring-white",
                      isActive ? "bg-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-600",
                    )}
                  >
                    {initials || "?"}
                  </span>
                  <span className="flex-1 truncate text-xs">{name}</span>
                  <CountBadge count={count} isActive={isActive} />
                </FilterButton>
              );
            })}
            {personSearch && filteredPersonList.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-slate-400 text-center">Kişi bulunamadı</p>
            )}
          </div>
        </div>
      )}

      {/* MÜŞTERİ */}
      {uniqueCustomers.length > 0 && (
        <div>
          <SectionLabel
            icon={<Building2 className="w-3 h-3" />}
            label="Müşteri"
            onClear={selectedCustomer !== "All" ? () => onCustomerSelect("All") : undefined}
          />
          <SectionSearch
            value={customerSearch}
            onChange={setCustomerSearch}
            placeholder="Müşteri ara..."
            ariaLabel="Müşteri ara"
          />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            <FilterButton
              isActive={selectedCustomer === "All"}
              onClick={() => onCustomerSelect("All")}
            >
              <span className="w-2 h-2 rounded-full shrink-0 bg-slate-300" />
              <span className="flex-1 truncate text-xs">Tümü</span>
              <CountBadge count={uniqueCustomers.reduce((s, c) => s + c.count, 0)} isActive={selectedCustomer === "All"} />
            </FilterButton>
            {filteredCustomerList.map(({ name, count }) => {
              const isActive = selectedCustomer === name;
              return (
                <FilterButton key={name} isActive={isActive} onClick={() => onCustomerSelect(name)}>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                  )}
                  <span className="flex-1 truncate text-xs">{name}</span>
                  <CountBadge count={count} isActive={isActive} />
                </FilterButton>
              );
            })}
            {customerSearch && filteredCustomerList.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-slate-400 text-center">Müşteri bulunamadı</p>
            )}
          </div>
        </div>
      )}

      {/* MODÜL */}
      {uniqueModules.length > 0 && (
        <div>
          <SectionLabel
            icon={<Package className="w-3 h-3" />}
            label="Modül"
            onClear={selectedModule !== "All" ? () => onModuleSelect("All") : undefined}
          />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            <FilterButton
              isActive={selectedModule === "All"}
              onClick={() => onModuleSelect("All")}
            >
              <span className="w-2 h-2 rounded-full shrink-0 bg-slate-300" />
              <span className="flex-1 truncate text-xs">Tümü</span>
              <CountBadge count={uniqueModules.reduce((s, m) => s + m.count, 0)} isActive={selectedModule === "All"} />
            </FilterButton>
            {uniqueModules.map(({ name, count }) => {
              const isActive = selectedModule === name;
              return (
                <FilterButton key={name} isActive={isActive} onClick={() => onModuleSelect(name)}>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />
                  )}
                  <span className="flex-1 truncate text-xs">{name}</span>
                  <CountBadge count={count} isActive={isActive} />
                </FilterButton>
              );
            })}
          </div>
        </div>
      )}

      {/* Veri yükleniyor state: tüm bölümler disabled */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 rounded-xl" aria-hidden />
      )}
    </div>
  );
};

export default ProjectStatisticsFilterSidebar;
