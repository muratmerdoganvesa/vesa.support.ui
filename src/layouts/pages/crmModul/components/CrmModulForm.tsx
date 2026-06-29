import { LeadSource, OpportunityStage } from "api/generated";
import { type ReactNode } from "react";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { cn } from "lib/utils";
import { LEAD_SOURCE_OPTIONS, OPPORTUNITY_STAGE_OPTIONS } from "../constants";
import { type CrmModulFormValues } from "../formMappers";
import { formatPhoneNumberTr } from "../utils";

type CrmModulFormFieldsProps = {
  values: CrmModulFormValues;
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

export const CrmModulFormFields = ({ values, onChange }: CrmModulFormFieldsProps) => {
  const handleFieldChange = <K extends keyof CrmModulFormValues>(
    key: K,
    value: CrmModulFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handlePhoneChange = (raw: string) => {
    handleFieldChange("phoneNumber", formatPhoneNumberTr(raw));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <SectionCard title="Şirket Bilgileri">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Şirket Adı" htmlFor="crm-partner-company" required className="sm:col-span-2">
            <Input
              id="crm-partner-company"
              value={values.partnerCompanyName}
              onChange={(e) => handleFieldChange("partnerCompanyName", e.target.value)}
              placeholder="Şirket adı"
              className="h-10 bg-white"
            />
          </Field>
          <Field label="Lead Kaynağı">
            <Select
              value={String(values.leadSource)}
              onValueChange={(v) => handleFieldChange("leadSource", Number(v) as LeadSource)}
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
          <Field label="Hesap Yöneticisi" htmlFor="crm-account-manager" className="sm:col-span-2">
            <Input
              id="crm-account-manager"
              value={values.accountManager}
              onChange={(e) => handleFieldChange("accountManager", e.target.value)}
              placeholder="Hesap yöneticisi"
              className="h-10 bg-white"
            />
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
  );
};
