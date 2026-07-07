import { LeadSource } from "api/generated";
import { type ReactNode } from "react";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { cn } from "lib/utils";
import { LEAD_SOURCE_OPTIONS } from "../constants";
import { type CrmModulFormValues } from "../formMappers";
import { resolvePhoneNumberInput } from "../utils";

type CrmModulFormFieldsProps = {
  values: CrmModulFormValues;
  onChange: (values: CrmModulFormValues) => void;
  variant?: "default" | "detail";
};

const SectionCard = ({
  title,
  children,
  className,
  variant = "default",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "detail";
}) => (
  <section
    className={cn(
      variant === "detail"
        ? "rounded-xl border border-slate-200/60 bg-white shadow-sm p-4 space-y-3"
        : "rounded-lg border border-slate-200 bg-slate-50/40 p-4 space-y-4",
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
    <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

export const CrmModulFormFields = ({
  values,
  onChange,
  variant = "default",
}: CrmModulFormFieldsProps) => {
  const handleFieldChange = <K extends keyof CrmModulFormValues>(
    key: K,
    value: CrmModulFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handlePhoneChange = (raw: string) => {
    handleFieldChange("phoneNumber", resolvePhoneNumberInput(values.phoneNumber, raw));
  };

  const inputClass = variant === "detail" ? "h-9 bg-white border-slate-200" : "h-10 bg-white border-slate-200";
  const textareaClass = cn(
    "min-h-[88px] resize-y bg-white border-slate-200 text-sm",
    variant === "detail" ? "min-h-[72px]" : undefined
  );

  return (
    <div className="space-y-4">
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <SectionCard title="Şirket Bilgileri" variant={variant}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <Field label="Müşteri Adı" htmlFor="crm-company-name" required className="sm:col-span-12">
            <Input
              id="crm-company-name"
              value={values.companyName}
              onChange={(e) => handleFieldChange("companyName", e.target.value)}
              placeholder="Müşteri adı"
              className={inputClass}
            />
          </Field>
          <Field label="Partner Şirket Adı" htmlFor="crm-partner-company" className="sm:col-span-9">
            <Input
              id="crm-partner-company"
              value={values.partnerCompanyName}
              onChange={(e) => handleFieldChange("partnerCompanyName", e.target.value)}
              placeholder="Partner şirket adı (opsiyonel)"
              className={inputClass}
            />
          </Field>
          <Field label="Lead Kaynağı" className="sm:col-span-3">
            <Select
              value={String(values.leadSource)}
              onValueChange={(v) => handleFieldChange("leadSource", Number(v) as LeadSource)}
            >
              <SelectTrigger className={inputClass}>
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
          <Field label="Sap Hesap Yöneticisi" htmlFor="crm-sap-account-manager" className="sm:col-span-6">
            <Input
              id="crm-sap-account-manager"
              value={values.sapAccountManager}
              onChange={(e) => handleFieldChange("sapAccountManager", e.target.value)}
              placeholder="Sap hesap yöneticisi"
              className={inputClass}
            />
          </Field>
          <Field label="Vesa Hesap yöneticisi" htmlFor="crm-account-manager" className="sm:col-span-6">
            <Input
              id="crm-account-manager"
              value={values.accountManager}
              onChange={(e) => handleFieldChange("accountManager", e.target.value)}
              placeholder="Vesa hesap yöneticisi"
              className={inputClass}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="İletişim Bilgileri" variant={variant}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="İlgili Kişi" htmlFor="crm-contact-person">
            <Input
              id="crm-contact-person"
              value={values.contactPerson}
              onChange={(e) => handleFieldChange("contactPerson", e.target.value)}
              placeholder="İlgili kişi"
              className={inputClass}
            />
          </Field>
          <Field label="Pozisyon" htmlFor="crm-contact-title">
            <Input
              id="crm-contact-title"
              value={values.contactTitle}
              onChange={(e) => handleFieldChange("contactTitle", e.target.value)}
              placeholder="Pozisyon"
              className={inputClass}
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
              className={cn(inputClass, "font-mono tracking-wide")}
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
              className={inputClass}
              aria-invalid={values.email.trim() !== "" && !values.email.includes("@")}
            />
          </Field>
        </div>

        <div className="border-t border-slate-200/80 pt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ürün & Rekabet Bilgisi
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Müşteri Kullandığı SAP veya Non SAP Ürünler" htmlFor="crm-used-products">
              <Textarea
                id="crm-used-products"
                value={values.usedSapNonSapProducts}
                onChange={(e) => handleFieldChange("usedSapNonSapProducts", e.target.value)}
                placeholder="Örn. SAP ECC, SuccessFactors, Oracle HCM..."
                rows={4}
                className={textareaClass}
              />
            </Field>
            <Field label="Rakip Ürünleri ve/veya Firmaları" htmlFor="crm-competitors">
              <Textarea
                id="crm-competitors"
                value={values.competitorProductsAndCompanies}
                onChange={(e) => handleFieldChange("competitorProductsAndCompanies", e.target.value)}
                placeholder="Örn. XYZ Danışmanlık, Workday..."
                rows={4}
                className={textareaClass}
              />
            </Field>
          </div>
        </div>
      </SectionCard>
    </div>
    </div>
  );
};
