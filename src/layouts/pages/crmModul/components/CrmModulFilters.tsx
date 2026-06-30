import { LeadSource, OpportunityStage } from "api/generated";
import { Button } from "components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Calendar } from "components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, Filter, RotateCcw, Search, X } from "lucide-react";
import { cn } from "lib/utils";
import { type ReactNode, useMemo } from "react";
import { CrmModulFilterOptions } from "../utils";

export type CrmModulFilterValues = {
  company: string;
  leadSource: LeadSource | "all";
  opportunityStage: OpportunityStage | "all";
  contactPerson: string;
  accountManager: string;
  dateFrom?: Date;
  dateTo?: Date;
};

type CrmModulFiltersProps = {
  values: CrmModulFilterValues;
  options: CrmModulFilterOptions;
  onChange: (values: CrmModulFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
};

const DateFilterButton = ({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value?: Date;
  onChange: (date?: Date) => void;
  className?: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-9 w-full sm:w-[160px] justify-start gap-2 border-slate-200 bg-white font-normal shadow-none",
          !value && "text-slate-400",
          className
        )}
      >
        <CalendarDays className="size-4 shrink-0 opacity-60" />
        <span className="truncate text-sm">
          {value ? format(value, "dd.MM.yyyy", { locale: tr }) : label}
        </span>
        {value && (
          <X
            className="ml-auto size-3.5 shrink-0 opacity-50 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          />
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={value} onSelect={onChange} locale={tr} />
    </PopoverContent>
  </Popover>
);

const FilterSelect = ({
  label,
  value,
  placeholder,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <label className="text-xs font-medium text-slate-600">{label}</label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 w-full border-slate-200 bg-white shadow-none">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  </div>
);

const countActiveFilters = (values: CrmModulFilterValues): number => {
  let count = 0;
  if (values.company !== "all") count += 1;
  if (values.leadSource !== "all") count += 1;
  if (values.opportunityStage !== "all") count += 1;
  if (values.contactPerson !== "all") count += 1;
  if (values.accountManager !== "all") count += 1;
  if (values.dateFrom) count += 1;
  if (values.dateTo) count += 1;
  return count;
};

export const CrmModulFilters = ({
  values,
  options,
  onChange,
  onApply,
  onReset,
}: CrmModulFiltersProps) => {
  const activeFilterCount = useMemo(() => countActiveFilters(values), [values]);

  const handleFieldChange = <K extends keyof CrmModulFilterValues>(
    key: K,
    value: CrmModulFilterValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="size-4 text-slate-400" aria-hidden />
        <span className="text-sm font-medium text-slate-700">Filtreler</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-[11px] font-semibold text-indigo-700">
            {activeFilterCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Şirket"
          value={values.company}
          placeholder="Tümü"
          onValueChange={(v) => handleFieldChange("company", v)}
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.companies.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Lead Kaynağı"
          value={String(values.leadSource)}
          placeholder="Tümü"
          onValueChange={(v) =>
            handleFieldChange("leadSource", v === "all" ? "all" : (Number(v) as LeadSource))
          }
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.leadSources.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Fırsat Aşaması"
          value={String(values.opportunityStage)}
          placeholder="Tümü"
          onValueChange={(v) =>
            handleFieldChange(
              "opportunityStage",
              v === "all" ? "all" : (Number(v) as OpportunityStage)
            )
          }
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.opportunityStages.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="İlgili Kişi"
          value={values.contactPerson}
          placeholder="Tümü"
          onValueChange={(v) => handleFieldChange("contactPerson", v)}
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.contactPersons.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Hesap Yöneticisi"
          value={values.accountManager}
          placeholder="Tümü"
          onValueChange={(v) => handleFieldChange("accountManager", v)}
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.accountManagers.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-slate-200/70 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <span className="text-xs font-medium text-slate-600 sm:mr-1 sm:pb-2">Son Temas</span>
          <DateFilterButton
            label="Başlangıç"
            value={values.dateFrom}
            onChange={(date) => handleFieldChange("dateFrom", date)}
          />
          <span className="hidden self-center text-slate-300 sm:block" aria-hidden>
            —
          </span>
          <DateFilterButton
            label="Bitiş"
            value={values.dateTo}
            onChange={(date) => handleFieldChange("dateTo", date)}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <Button
            type="button"
            onClick={onApply}
            className="h-9 gap-1.5 bg-indigo-600 px-4 hover:bg-indigo-700"
          >
            <Search className="size-4" aria-hidden />
            Filtrele
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={activeFilterCount === 0}
            className="h-9 gap-1.5 border-slate-200 bg-white px-4 shadow-none"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Temizle
          </Button>
        </div>
      </div>
    </div>
  );
};
