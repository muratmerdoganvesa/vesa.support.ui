import {
  CrmCurrencyType,
  LeadSource,
  ListModuleDto,
  OpportunityStage,
  TypeCodes,
} from "api/generated";
import { type ReactNode } from "react";
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
import { Textarea } from "components/ui/textarea";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "lib/utils";
import {
  CURRENCY_TYPE_OPTIONS,
  getCurrencySymbol,
  LEAD_SOURCE_OPTIONS,
  OPPORTUNITY_STAGE_OPTIONS,
  TYPE_CODE_OPTIONS,
} from "../constants";
import { calculateEstimatedValueString, type CrmModulFormValues } from "../formMappers";
import { formatPhoneNumberTr } from "../utils";
import { ModuleMultiSelect } from "./ModuleMultiSelect";

type CrmModulFormFieldsProps = {
  values: CrmModulFormValues;
  modules: ListModuleDto[];
  onChange: (values: CrmModulFormValues) => void;
};

const SectionCard = ({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-lg border border-slate-200 bg-slate-50/40 p-4 space-y-4",
      className
    )}
  >
    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
      {title}
    </h3>
    {children}
  </section>
);

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
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <Label htmlFor={htmlFor}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

const DatePickerField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (date?: Date) => void;
}) => (
  <Field label={label}>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-start gap-2 font-normal bg-white",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarDays className="size-4 opacity-60 shrink-0" />
          {value ? format(value, "dd.MM.yyyy", { locale: tr }) : "Tarih seçin"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} locale={tr} />
      </PopoverContent>
    </Popover>
  </Field>
);

const CurrencyInput = ({
  id,
  value,
  onChange,
  currencyType,
  placeholder,
  readOnly = false,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange?: (value: string) => void;
  currencyType: CrmCurrencyType;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
}) => (
  <InputGroup className="h-10 bg-white">
    <InputGroupAddon>
      <InputGroupText>{getCurrencySymbol(currencyType)}</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput
      id={id}
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      className="h-10"
      aria-readonly={readOnly}
    />
  </InputGroup>
);

export const CrmModulFormFields = ({ values, modules, onChange }: CrmModulFormFieldsProps) => {
  const handleFieldChange = <K extends keyof CrmModulFormValues>(
    key: K,
    value: CrmModulFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handlePhoneChange = (raw: string) => {
    handleFieldChange("phoneNumber", formatPhoneNumberTr(raw));
  };

  const handlePricingChange = (unitPrice: string, personCount: string) => {
    onChange({
      ...values,
      unitPrice,
      personCount,
      estimatedValue: calculateEstimatedValueString(unitPrice, personCount),
    });
  };

  const estimatedValueDisplay = calculateEstimatedValueString(
    values.unitPrice,
    values.personCount
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="flex flex-col gap-5">
        <SectionCard title="Şirket Bilgileri">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Şirket Adı" htmlFor="crm-partner-company" required className="sm:col-span-2">
              <Input
                id="crm-partner-company"
                value={values.partnerCompanyName}
                onChange={(e) => handleFieldChange("partnerCompanyName", e.target.value)}
                placeholder="Şirket Adı"
                className="h-10 bg-white"
              />
            </Field>
            <Field label="Lead Kaynağı">
              <Select
                value={String(values.leadSource)}
                onValueChange={(v) =>
                  handleFieldChange("leadSource", Number(v) as LeadSource)
                }
              >
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue placeholder="Lead kaynağı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
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
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue placeholder="Aşama seçin" />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="İletişim Bilgileri">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="İlgili Kişi" htmlFor="crm-contact-person">
              <Input
                id="crm-contact-person"
                value={values.contactPerson}
                onChange={(e) => handleFieldChange("contactPerson", e.target.value)}
                placeholder="İlgili kişi"
                className="h-10 bg-white"
              />
            </Field>
            <Field label="Pozisyon" htmlFor="crm-contact-title">
              <Input
                id="crm-contact-title"
                value={values.contactTitle}
                onChange={(e) => handleFieldChange("contactTitle", e.target.value)}
                placeholder="Pozisyon"
                className="h-10 bg-white"
              />
            </Field>
            <Field label="Telefon" htmlFor="crm-phone">
              <Input
                id="crm-phone"
                type="tel"
                inputMode="tel"
                value={values.phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0(5XX)-XXX-XX-XX"
                className="h-10 bg-white font-mono tracking-wide"
                maxLength={16}
                aria-label="Telefon numarası"
              />
            </Field>
            <Field label="Email" htmlFor="crm-email">
              <Input
                id="crm-email"
                type="email"
                value={values.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="email@ornek.com"
                className="h-10 bg-white"
              />
            </Field>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-5">
        <SectionCard title="Fırsat & Satış">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hesap Yöneticisi" htmlFor="crm-account-manager">
              <Input
                id="crm-account-manager"
                value={values.accountManager}
                onChange={(e) => handleFieldChange("accountManager", e.target.value)}
                placeholder="Hesap yöneticisi"
                className="h-10 bg-white"
              />
            </Field>
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
                onValueChange={(v) =>
                  handleFieldChange("typeCode", Number(v) as TypeCodes)
                }
              >
                <SelectTrigger className="h-10 bg-white">
                  <SelectValue placeholder="Tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_CODE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fiyat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Para Birimi">
                <Select
                  value={String(values.currencyType)}
                  onValueChange={(v) =>
                    handleFieldChange("currencyType", Number(v) as CrmCurrencyType)
                  }
                >
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue placeholder="Para birimi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Birim Fiyat" htmlFor="crm-unit-price">
                <CurrencyInput
                  id="crm-unit-price"
                  value={values.unitPrice}
                  currencyType={values.currencyType}
                  onChange={(unitPrice) =>
                    handlePricingChange(unitPrice, values.personCount)
                  }
                  placeholder="0.00"
                />
              </Field>
              <Field label="Kişi Sayısı" htmlFor="crm-person-count">
                <Input
                  id="crm-person-count"
                  type="number"
                  min="0"
                  step="1"
                  value={values.personCount}
                  onChange={(e) =>
                    handlePricingChange(values.unitPrice, e.target.value)
                  }
                  placeholder="0"
                  className="h-10 bg-white"
                />
              </Field>
              <Field label="Tahmini Değer" htmlFor="crm-estimated-value">
                <CurrencyInput
                  id="crm-estimated-value"
                  value={estimatedValueDisplay}
                  currencyType={values.currencyType}
                  placeholder="—"
                  readOnly
                  disabled
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Tahmini değer otomatik: birim fiyat × kişi sayısı
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Tarihler">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePickerField
              label="Beklenen Kapanış Tarihi"
              value={values.expectedCloseDate}
              onChange={(date) => handleFieldChange("expectedCloseDate", date)}
            />
            <DatePickerField
              label="Son Temas Tarihi"
              value={values.lastContactDate}
              onChange={(date) => handleFieldChange("lastContactDate", date)}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Diğer" className="xl:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Sonraki Aksiyon" htmlFor="crm-next-action">
            <Textarea
              id="crm-next-action"
              value={values.nextAction}
              onChange={(e) => handleFieldChange("nextAction", e.target.value)}
              placeholder="Sonraki aksiyon"
              rows={3}
              className="bg-white resize-none"
            />
          </Field>
          <Field label="Notlar" htmlFor="crm-notes">
            <Textarea
              id="crm-notes"
              value={values.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Notlar"
              rows={3}
              className="bg-white resize-none"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
};
