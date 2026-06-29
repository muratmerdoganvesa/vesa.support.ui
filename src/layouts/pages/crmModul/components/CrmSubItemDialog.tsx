import {
  CrmCurrencyType,
  ListModuleDto,
  TypeCodes,
} from "api/generated";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
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
import { useEffect, useState } from "react";
import {
  CURRENCY_TYPE_OPTIONS,
  getCurrencySymbol,
  TYPE_CODE_OPTIONS,
} from "../constants";
import {
  calculateEstimatedValueString,
  emptyCrmSubItemFormValues,
  type CrmSubItemFormValues,
} from "../formMappers";
import { ModuleMultiSelect } from "./ModuleMultiSelect";

type CrmSubItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: CrmSubItemFormValues | null;
  isEditMode?: boolean;
  modules: ListModuleDto[];
  onSave: (values: CrmSubItemFormValues) => void;
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
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

export const CrmSubItemDialog = ({
  open,
  onOpenChange,
  initialValues,
  isEditMode = false,
  modules,
  onSave,
}: CrmSubItemDialogProps) => {
  const [values, setValues] = useState<CrmSubItemFormValues>(emptyCrmSubItemFormValues());

  useEffect(() => {
    if (open) {
      setValues(initialValues ? { ...initialValues } : emptyCrmSubItemFormValues());
    }
  }, [open, initialValues]);

  const handleFieldChange = <K extends keyof CrmSubItemFormValues>(
    key: K,
    value: CrmSubItemFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handlePricingChange = (unitPrice: string, personCount: string) => {
    setValues((prev) => ({
      ...prev,
      unitPrice,
      personCount,
      estimatedValue: calculateEstimatedValueString(unitPrice, personCount),
    }));
  };

  const handleSave = () => {
    onSave({
      ...values,
      estimatedValue: calculateEstimatedValueString(values.unitPrice, values.personCount),
    });
    onOpenChange(false);
  };

  const estimatedValueDisplay = calculateEstimatedValueString(values.unitPrice, values.personCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modülü Düzenle" : "Yeni Modül Ekle"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <Field label="SuccessFactors Modülü" className="sm:col-span-2">
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
              <SelectContent position="popper" className="z-[1200] w-(--radix-select-trigger-width)">
                {TYPE_CODE_OPTIONS.map((opt) => (
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
              onValueChange={(v) =>
                handleFieldChange("currencyType", Number(v) as CrmCurrencyType)
              }
            >
              <SelectTrigger className="h-10 w-full bg-white">
                <SelectValue placeholder="Para birimi seçin" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[1200] w-(--radix-select-trigger-width)">
                {CURRENCY_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Birim Fiyat" htmlFor="sub-unit-price">
            <InputGroup className="h-10 bg-white">
              <InputGroupAddon>
                <InputGroupText>{getCurrencySymbol(values.currencyType)}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="sub-unit-price"
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

          <Field label="Kişi Sayısı" htmlFor="sub-person-count">
            <Input
              id="sub-person-count"
              type="number"
              min="0"
              step="1"
              value={values.personCount}
              onChange={(e) => handlePricingChange(values.unitPrice, e.target.value)}
              placeholder="0"
              className="h-10 bg-white"
            />
          </Field>

          <Field label="Tahmini Değer" htmlFor="sub-estimated-value">
            <InputGroup className="h-10 bg-white">
              <InputGroupAddon>
                <InputGroupText>{getCurrencySymbol(values.currencyType)}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="sub-estimated-value"
                value={estimatedValueDisplay}
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isEditMode ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
