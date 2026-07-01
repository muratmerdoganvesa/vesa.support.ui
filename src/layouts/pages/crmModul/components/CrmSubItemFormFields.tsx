import {
  CurrencyType,
  ListModuleDto,
  OpportunityStage,
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
  OPPORTUNITY_STAGE_OPTIONS,
  TYPE_CODE_OPTIONS,
} from "../constants";
import { calculateEstimatedDiscountedValueString, calculateEstimatedValueString, type CrmSubItemFormValues } from "../formMappers";
import { ModuleMultiSelect } from "./ModuleMultiSelect";

type CrmSubItemFormFieldsProps = {
  values: CrmSubItemFormValues;
  modules: ListModuleDto[];
  onChange: (values: CrmSubItemFormValues) => void;
  className?: string;
};

const Field = ({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
      {label}
    </Label>
    {children}
  </div>
);

export const CrmSubItemFormFields = ({
  values,
  modules,
  onChange,
  className,
}: CrmSubItemFormFieldsProps) => {
  const handleFieldChange = <K extends keyof CrmSubItemFormValues>(
    key: K,
    value: CrmSubItemFormValues[K]
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

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      <Field label="SuccessFactors Modülü" className="sm:col-span-2 lg:col-span-3">
        <ModuleMultiSelect
          options={modules}
          value={values.solutionModuleIds}
          onChange={(ids) => handleFieldChange("solutionModuleIds", ids)}
          placeholder="SuccessFactors modülü seçin..."
        />
      </Field>

      <Field label="Tip">
        <Select
          value={String(values.typeCode)}
          onValueChange={(v) => handleFieldChange("typeCode", Number(v) as TypeCodes)}
        >
          <SelectTrigger className="h-10 w-full bg-white">
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

      <Field label="Fırsat Aşaması">
        <Select
          value={String(values.opportunityStage)}
          onValueChange={(v) =>
            handleFieldChange("opportunityStage", Number(v) as OpportunityStage)
          }
        >
          <SelectTrigger className="h-10 w-full bg-white">
            <SelectValue placeholder="Aşama seçin" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[1200]">
            {OPPORTUNITY_STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Para Birimi">
        <Select
          value={String(values.currencyType)}
          onValueChange={(v) => handleFieldChange("currencyType", Number(v) as CurrencyType)}
        >
          <SelectTrigger className="h-10 w-full bg-white">
            <SelectValue placeholder="Para birimi seçin" />
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

      <Field label="Birim Fiyat" htmlFor={`sub-unit-price-${values.clientKey}`}>
        <InputGroup className="h-10 bg-white">
          <InputGroupAddon>
            <InputGroupText>{getCurrencySymbol(values.currencyType)}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={`sub-unit-price-${values.clientKey}`}
            type="number"
            min="0"
            step="0.01"
            value={values.unitPrice}
            onChange={(e) => handlePricingChange(e.target.value, values.personCount)}
            placeholder="0.00"
            className="h-10"
          />
        </InputGroup>
      </Field>

      <Field label="Kişi Sayısı" htmlFor={`sub-person-count-${values.clientKey}`}>
        <Input
          id={`sub-person-count-${values.clientKey}`}
          type="number"
          min="0"
          step="1"
          value={values.personCount}
          onChange={(e) => handlePricingChange(values.unitPrice, e.target.value)}
          placeholder="0"
          className="h-10 bg-white"
        />
      </Field>

      <Field label="İndirim (%)" htmlFor={`sub-discount-${values.clientKey}`}>
        <Input
          id={`sub-discount-${values.clientKey}`}
          type="number"
          min="0"
          max="100"
          step="1"
          value={values.discount}
          onChange={(e) => handleDiscountChange(e.target.value)}
          placeholder="0"
          className="h-10 bg-white"
        />
      </Field>

      <Field label="Tahmini Değer" htmlFor={`sub-estimated-value-${values.clientKey}`}>
        <InputGroup className="h-10 bg-white">
          <InputGroupAddon>
            <InputGroupText>{getCurrencySymbol(values.currencyType)}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={`sub-estimated-value-${values.clientKey}`}
            value={estimatedValueDisplay}
            readOnly
            disabled
            placeholder="—"
            className="h-10"
            aria-readonly
          />
        </InputGroup>
      </Field>

      <Field label="İndirimli Tahmini Değer" htmlFor={`sub-discounted-value-${values.clientKey}`}>
        <InputGroup className="h-10 bg-white">
          <InputGroupAddon>
            <InputGroupText>{getCurrencySymbol(values.currencyType)}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={`sub-discounted-value-${values.clientKey}`}
            value={estimatedDiscountedValueDisplay}
            readOnly
            disabled
            placeholder="—"
            className="h-10"
            aria-readonly
          />
        </InputGroup>
      </Field>

      <Field label="Beklenen Kapanış Tarihi">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 w-full justify-start gap-2 font-normal bg-white",
                !values.expectedCloseDate && "text-muted-foreground"
              )}
            >
              <CalendarDays className="size-4 opacity-60 shrink-0" />
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

      <Field label="Son Temas Tarihi">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 w-full justify-start gap-2 font-normal bg-white",
                !values.lastContactDate && "text-muted-foreground"
              )}
            >
              <CalendarDays className="size-4 opacity-60 shrink-0" />
              {values.lastContactDate
                ? format(values.lastContactDate, "dd.MM.yyyy", { locale: tr })
                : "Tarih seçin"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={values.lastContactDate}
              onSelect={(date) => handleFieldChange("lastContactDate", date)}
              locale={tr}
            />
          </PopoverContent>
        </Popover>
      </Field>
    </div>
  );
};
