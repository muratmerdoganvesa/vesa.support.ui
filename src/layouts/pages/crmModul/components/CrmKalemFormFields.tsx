import {
  CurrencyType,
  ListModuleDto,
  TypeCodes,
} from "api/generated";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { Input } from "components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "components/ui/input-group";
import { Label } from "components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "lib/utils";
import {
  CURRENCY_TYPE_OPTIONS,
  getCurrencySymbol,
  TYPE_CODE_OPTIONS,
} from "../constants";
import {
  calculateEstimatedDiscountedValueString,
  calculateEstimatedValueString,
  isPricingGroupTouched,
  type CrmKalemFormValues,
} from "../formMappers";
import { ModuleMultiSelect } from "./ModuleMultiSelect";

type CrmKalemFormFieldsProps = {
  values: CrmKalemFormValues;
  modules: ListModuleDto[];
  onChange: (values: CrmKalemFormValues) => void;
  index?: number;
  className?: string;
};

const Field = ({
  label,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-1", className)}>
    <Label htmlFor={htmlFor} className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5 normal-case">*</span>}
    </Label>
    {children}
  </div>
);

export const CrmKalemFormFields = ({
  values,
  modules,
  onChange,
  index = 0,
  className,
}: CrmKalemFormFieldsProps) => {
  const handleFieldChange = <K extends keyof CrmKalemFormValues>(
    key: K,
    value: CrmKalemFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handlePricingChange = (unitPrice: string, personCount: string, discount?: string) => {
    const nextDiscount = discount ?? values.discount;
    onChange({
      ...values,
      unitPrice,
      personCount,
      discount: nextDiscount,
      estimatedValue: calculateEstimatedValueString(unitPrice, personCount),
      estimatedDiscountedValue: calculateEstimatedDiscountedValueString(
        unitPrice,
        personCount,
        nextDiscount
      ),
    });
  };

  const handleDiscountChange = (discount: string) => {
    onChange({
      ...values,
      discount,
      estimatedDiscountedValue: calculateEstimatedDiscountedValueString(
        values.unitPrice,
        values.personCount,
        discount
      ),
    });
  };

  const estimatedValueDisplay = calculateEstimatedValueString(values.unitPrice, values.personCount);
  const estimatedDiscountedValueDisplay = calculateEstimatedDiscountedValueString(
    values.unitPrice,
    values.personCount,
    values.discount
  );
  const pricingRequired = isPricingGroupTouched(values);
  const fieldId = values.clientKey;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <span className="flex size-6 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white tabular-nums">
          {index + 1}
        </span>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Kalem</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="SuccessFactors Modülü" className="sm:col-span-2 lg:col-span-4">
          <ModuleMultiSelect
            options={modules}
            value={values.solutionModuleIds}
            onChange={(ids) => handleFieldChange("solutionModuleIds", ids)}
            placeholder="Modül seçin..."
            single
          />
        </Field>

        <Field label="Tip">
          <Select
            value={String(values.typeCode)}
            onValueChange={(v) => handleFieldChange("typeCode", Number(v) as TypeCodes)}
          >
            <SelectTrigger className="h-9 w-full bg-slate-50/50 border-slate-200">
              <SelectValue placeholder="Tip seçin" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[1200]">
              {TYPE_CODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Para Birimi" required={pricingRequired}>
          <Select
            value={String(values.currencyType)}
            onValueChange={(v) => handleFieldChange("currencyType", Number(v) as CurrencyType)}
          >
            <SelectTrigger className="h-9 w-full bg-slate-50/50 border-slate-200">
              <SelectValue placeholder="Para birimi" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[1200]">
              {CURRENCY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Birim Fiyat" htmlFor={`kalem-unit-${fieldId}`} required={pricingRequired}>
          <InputGroup className="h-9 bg-slate-50/50">
            <InputGroupAddon>
              <InputGroupText className="text-xs">{getCurrencySymbol(values.currencyType)}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id={`kalem-unit-${fieldId}`}
              type="number"
              min="0"
              step="0.01"
              value={values.unitPrice}
              onChange={(e) => handlePricingChange(e.target.value, values.personCount)}
              placeholder="0.00"
              className="h-9"
            />
          </InputGroup>
        </Field>

        <Field label="Kişi Sayısı" htmlFor={`kalem-person-${fieldId}`} required={pricingRequired}>
          <Input
            id={`kalem-person-${fieldId}`}
            type="number"
            min="0"
            step="1"
            value={values.personCount}
            onChange={(e) => handlePricingChange(values.unitPrice, e.target.value)}
            placeholder="0"
            className="h-9 bg-slate-50/50 border-slate-200"
          />
        </Field>

        <Field label="İndirim (%)" htmlFor={`kalem-discount-${fieldId}`}>
          <Input
            id={`kalem-discount-${fieldId}`}
            type="number"
            min="0"
            max="100"
            step="1"
            value={values.discount}
            onChange={(e) => handleDiscountChange(e.target.value)}
            placeholder="0"
            className="h-9 bg-slate-50/50 border-slate-200"
          />
        </Field>

        <Field label="Tahmini Değer">
          <InputGroup className="h-9 bg-slate-100/60">
            <InputGroupAddon>
              <InputGroupText className="text-xs">{getCurrencySymbol(values.currencyType)}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              value={estimatedValueDisplay}
              readOnly
              disabled
              placeholder="—"
              className="h-9 font-medium"
              aria-readonly
            />
          </InputGroup>
        </Field>

        <Field label="İndirimli Değer">
          <InputGroup className="h-9 bg-emerald-50/50">
            <InputGroupAddon>
              <InputGroupText className="text-xs text-emerald-700">{getCurrencySymbol(values.currencyType)}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              value={estimatedDiscountedValueDisplay}
              readOnly
              disabled
              placeholder="—"
              className="h-9 font-semibold text-emerald-800"
              aria-readonly
            />
          </InputGroup>
        </Field>

        <Field label="Beklenen Kapanış">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start gap-2 font-normal bg-slate-50/50 border-slate-200",
                  !values.expectedCloseDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="size-3.5 opacity-50 shrink-0" />
                {values.expectedCloseDate
                  ? format(values.expectedCloseDate, "dd.MM.yyyy", { locale: tr })
                  : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={values.expectedCloseDate}
                onSelect={(date) => handleFieldChange("expectedCloseDate", date)}
                locale={tr}
              />
            </PopoverContent>
          </Popover>
        </Field>

        <Field label="Son Temas">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start gap-2 font-normal bg-slate-50/50 border-slate-200",
                  !values.lastContactDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="size-3.5 opacity-50 shrink-0" />
                {values.lastContactDate
                  ? format(values.lastContactDate, "dd.MM.yyyy", { locale: tr })
                  : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={values.lastContactDate}
                defaultMonth={values.lastContactDate}
                onSelect={(date) => handleFieldChange("lastContactDate", date)}
                locale={tr}
              />
            </PopoverContent>
          </Popover>
        </Field>
      </div>
    </div>
  );
};
