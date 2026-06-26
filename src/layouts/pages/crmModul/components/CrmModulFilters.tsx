import { OpportunityStage } from "api/generated";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
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
import { CalendarDays, Search, X } from "lucide-react";
import { cn } from "lib/utils";
import { OPPORTUNITY_STAGE_OPTIONS } from "../constants";

export type CrmModulFilterValues = {
  companySearch: string;
  contactSearch: string;
  opportunityStage: OpportunityStage | "all";
  dateFrom?: Date;
  dateTo?: Date;
};

type CrmModulFiltersProps = {
  values: CrmModulFilterValues;
  onChange: (values: CrmModulFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
};

const DateFilterButton = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (date?: Date) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-9 w-full justify-start gap-2 border-slate-200 font-normal",
          !value && "text-slate-400"
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

export const CrmModulFilters = ({ values, onChange, onApply, onReset }: CrmModulFiltersProps) => {
  const handleFieldChange = <K extends keyof CrmModulFilterValues>(
    key: K,
    value: CrmModulFilterValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Şirket Adı
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={values.companySearch}
              onChange={(e) => handleFieldChange("companySearch", e.target.value)}
              placeholder="Şirket ara..."
              className="pl-9 h-9 border-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            İlgili Kişi
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={values.contactSearch}
              onChange={(e) => handleFieldChange("contactSearch", e.target.value)}
              placeholder="Kişi ara..."
              className="pl-9 h-9 border-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Fırsat Aşaması
          </label>
          <Select
            value={String(values.opportunityStage)}
            onValueChange={(v) =>
              handleFieldChange(
                "opportunityStage",
                v === "all" ? "all" : (Number(v) as OpportunityStage)
              )
            }
          >
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {OPPORTUNITY_STAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Son Temas Başlangıç
          </label>
          <DateFilterButton
            label="Başlangıç tarihi"
            value={values.dateFrom}
            onChange={(date) => handleFieldChange("dateFrom", date)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Son Temas Bitiş
          </label>
          <DateFilterButton
            label="Bitiş tarihi"
            value={values.dateTo}
            onChange={(date) => handleFieldChange("dateTo", date)}
          />
        </div>

        <div className="flex items-end gap-2">
          <Button type="button" onClick={onApply} className="h-9 bg-indigo-600 hover:bg-indigo-700">
            Filtrele
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="h-9">
            Temizle
          </Button>
        </div>
      </div>
    </div>
  );
};
