import { OpportunityStage, TypeCodes } from "api/generated";
import { Button } from "components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "components/ui/collapsible";
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
import { CalendarDays, ChevronDown, Filter, X } from "lucide-react";
import { cn } from "lib/utils";
import { type ReactNode, useMemo, useState } from "react";
import { getOpportunityStageLabel, TYPE_CODE_OPTIONS } from "../constants";
import { CrmModulFilterOptions } from "../utils";

export type CrmModulFilterValues = {
  company: string;
  partnerCompany: string;
  opportunityStage: OpportunityStage | "all";
  typeCode: TypeCodes | "all";
  accountManager: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export const DEFAULT_CRM_MODUL_FILTERS: CrmModulFilterValues = {
  company: "all",
  partnerCompany: "all",
  opportunityStage: "all",
  typeCode: "all",
  accountManager: "all",
  dateFrom: undefined,
  dateTo: undefined,
};

type CrmModulFiltersProps = {
  values: CrmModulFilterValues;
  options: CrmModulFilterOptions;
  onChange: (values: CrmModulFilterValues) => void;
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
  if (values.partnerCompany !== "all") count += 1;
  if (values.opportunityStage !== "all") count += 1;
  if (values.typeCode !== "all") count += 1;
  if (values.accountManager !== "all") count += 1;
  if (values.dateFrom) count += 1;
  if (values.dateTo) count += 1;
  return count;
};

const buildActiveFilterSummary = (values: CrmModulFilterValues): string[] => {
  const parts: string[] = [];
  if (values.company !== "all") parts.push(values.company);
  if (values.partnerCompany !== "all") parts.push(values.partnerCompany);
  if (values.opportunityStage !== "all") {
    parts.push(getOpportunityStageLabel(values.opportunityStage));
  }
  if (values.typeCode !== "all") {
    parts.push(TYPE_CODE_OPTIONS.find((o) => o.value === values.typeCode)?.label ?? "Tip");
  }
  if (values.accountManager !== "all") parts.push(values.accountManager);
  if (values.dateFrom) {
    parts.push(`Başlangıç: ${format(values.dateFrom, "dd.MM.yy", { locale: tr })}`);
  }
  if (values.dateTo) {
    parts.push(`Bitiş: ${format(values.dateTo, "dd.MM.yy", { locale: tr })}`);
  }
  return parts;
};

export const CrmModulFilters = ({
  values,
  options,
  onChange,
}: CrmModulFiltersProps) => {
  const [open, setOpen] = useState(false);
  const activeFilterCount = useMemo(() => countActiveFilters(values), [values]);
  const activeSummary = useMemo(() => buildActiveFilterSummary(values), [values]);

  const handleFieldChange = <K extends keyof CrmModulFilterValues>(
    key: K,
    value: CrmModulFilterValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handleClearFilters = () => {
    onChange(DEFAULT_CRM_MODUL_FILTERS);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2 px-6 py-2.5">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex flex-1 items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <Filter className="size-4 text-slate-400 shrink-0" aria-hidden />
              <span className="text-sm font-medium text-slate-700 shrink-0">Filtreler</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-[11px] font-semibold text-indigo-700 shrink-0">
                  {activeFilterCount}
                </span>
              )}
              {!open && activeSummary.length > 0 && (
                <span className="hidden sm:flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-thin">
                  {activeSummary.map((label) => (
                    <span
                      key={label}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 shrink-0"
                    >
                      {label}
                    </span>
                  ))}
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 shrink-0">
                {open ? "Gizle" : "Göster"}
                <ChevronDown
                  className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
                />
              </span>
            </button>
          </CollapsibleTrigger>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 shrink-0"
            >
              <X className="size-3.5" />
              Temizle
            </Button>
          )}
        </div>

        <CollapsibleContent>
          <div className="px-6 pb-4 pt-0">
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
          label="Partner Firma"
          value={values.partnerCompany}
          placeholder="Tümü"
          onValueChange={(v) => handleFieldChange("partnerCompany", v)}
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.partnerCompanies.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
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
          label="Tip"
          value={String(values.typeCode)}
          placeholder="Tümü"
          onValueChange={(v) =>
            handleFieldChange("typeCode", v === "all" ? "all" : (Number(v) as TypeCodes))
          }
        >
          <SelectItem value="all">Tümü</SelectItem>
          {options.typeCodes.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          label="SAP Hesap Yöneticisi"
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

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/70 pt-3 sm:flex-row sm:items-end">
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
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
