import {
  CreateCrmModulDto,
  CurrencyType,
  CrmModulDto,
  CrmSubItemDto,
  CrmSubItemInputDto,
  LeadSource,
  OpportunityStage,
  TypeCodes,
  UpdateCrmModulDto,
} from "api/generated";
import { parseIsoDate, toIsoDateString, formatPhoneNumberTr } from "./utils";

export type CrmModulFormValues = {
  companyName: string;
  partnerCompanyName: string;
  contactPerson: string;
  contactTitle: string;
  phoneNumber: string;
  email: string;
  leadSource: LeadSource;
  accountManager: string;
};

export type CrmSubItemFormValues = {
  clientKey: string;
  id?: string;
  solutionModuleIds: string[];
  typeCode: TypeCodes;
  currencyType: CurrencyType;
  unitPrice: string;
  personCount: string;
  discount: string;
  estimatedValue: string;
  estimatedDiscountedValue: string;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  opportunityStage: OpportunityStage;
};

export const emptyCrmModulFormValues = (): CrmModulFormValues => ({
  companyName: "",
  partnerCompanyName: "",
  contactPerson: "",
  contactTitle: "",
  phoneNumber: "",
  email: "",
  leadSource: LeadSource.NUMBER_0,
  accountManager: "",
});

export const emptyCrmSubItemFormValues = (): CrmSubItemFormValues => ({
  clientKey: crypto.randomUUID(),
  solutionModuleIds: [],
  typeCode: TypeCodes.NUMBER_0,
  currencyType: CurrencyType.NUMBER_0,
  unitPrice: "",
  personCount: "",
  discount: "",
  estimatedValue: "",
  estimatedDiscountedValue: "",
  expectedCloseDate: undefined,
  lastContactDate: undefined,
  opportunityStage: OpportunityStage.NUMBER_0,
});

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalInt = (value: string): number | null => {
  const parsed = parseOptionalNumber(value);
  if (parsed == null) return null;
  return Math.trunc(parsed);
};

export const calculateEstimatedValueString = (
  unitPrice: string,
  personCount: string
): string => {
  const unit = parseOptionalNumber(unitPrice);
  const count = parseOptionalInt(personCount);
  if (unit == null || count == null || count < 0) return "";
  const total = unit * count;
  if (!Number.isFinite(total)) return "";
  return total.toFixed(2);
};

export const calculateEstimatedDiscountedValueString = (
  unitPrice: string,
  personCount: string,
  discount: string
): string => {
  const estimated = calculateEstimatedValueString(unitPrice, personCount);
  if (!estimated) return "";

  const discountPercent = parseOptionalInt(discount);
  if (discountPercent == null || discountPercent <= 0) return estimated;

  const estimatedNum = Number(estimated);
  const discounted = estimatedNum * (1 - Math.min(discountPercent, 100) / 100);
  if (!Number.isFinite(discounted)) return estimated;
  return discounted.toFixed(2);
};

export const formatEstimatedValueDisplay = (
  estimated: string,
  symbol: string
): string => {
  if (!estimated) return "—";
  const num = Number(estimated);
  if (!Number.isFinite(num)) return "—";
  return `${symbol}${num.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const toSubItemInputDto = (item: CrmSubItemFormValues): CrmSubItemInputDto => ({
  id: item.id ?? null,
  solutionModuleIds: item.solutionModuleIds.length > 0 ? item.solutionModuleIds : null,
  typeCode: item.typeCode,
  currencyType: item.currencyType,
  unitPrice: parseOptionalNumber(item.unitPrice),
  personCount: parseOptionalInt(item.personCount),
  discount: parseOptionalInt(item.discount),
  estimatedValue: parseOptionalNumber(
    calculateEstimatedValueString(item.unitPrice, item.personCount)
  ),
  estimatedDiscountedValue: parseOptionalNumber(
    calculateEstimatedDiscountedValueString(item.unitPrice, item.personCount, item.discount)
  ),
  expectedCloseDate: toIsoDateString(item.expectedCloseDate),
  lastContactDate: toIsoDateString(item.lastContactDate),
  opportunityStage: item.opportunityStage,
});

export const toCreateDto = (
  modul: CrmModulFormValues,
  subItems: CrmSubItemFormValues[]
): CreateCrmModulDto => ({
  companyName: modul.companyName.trim() || null,
  partnerCompanyName: modul.partnerCompanyName.trim() || null,
  contactPerson: modul.contactPerson.trim() || null,
  contactTitle: modul.contactTitle.trim() || null,
  phoneNumber: formatPhoneNumberTr(modul.phoneNumber) || null,
  email: modul.email.trim() || null,
  leadSource: modul.leadSource,
  accountManager: modul.accountManager.trim() || null,
  crmSubItems: subItems.length > 0 ? subItems.map(toSubItemInputDto) : null,
});

export const toUpdateDto = (
  modul: CrmModulFormValues,
  subItems: CrmSubItemFormValues[]
): UpdateCrmModulDto => toCreateDto(modul, subItems);

export const crmModulDtoToFormValues = (data: CrmModulDto): CrmModulFormValues => ({
  companyName: data.companyName?.trim() || data.partnerCompanyName?.trim() || "",
  partnerCompanyName: data.partnerCompanyName ?? "",
  contactPerson: data.contactPerson ?? "",
  contactTitle: data.contactTitle ?? "",
  phoneNumber: formatPhoneNumberTr(data.phoneNumber ?? ""),
  email: data.email ?? "",
  leadSource: data.leadSource ?? LeadSource.NUMBER_0,
  accountManager: data.accountManager ?? "",
});

export const crmSubItemDtosToFormValues = (items: CrmSubItemDto[]): CrmSubItemFormValues[] =>
  items.map((item) => {
    const unitPrice = item.unitPrice != null ? String(item.unitPrice) : "";
    const personCount = item.personCount != null ? String(item.personCount) : "";
    const discount = item.discount != null ? String(item.discount) : "";

    return {
      clientKey: item.id ?? crypto.randomUUID(),
      id: item.id,
      solutionModuleIds: (item.solutionModuleIds ?? []).slice(0, 1),
      typeCode: item.typeCode ?? TypeCodes.NUMBER_0,
      currencyType: item.currencyType ?? CurrencyType.NUMBER_0,
      unitPrice,
      personCount,
      discount,
      estimatedValue: calculateEstimatedValueString(unitPrice, personCount),
      estimatedDiscountedValue: calculateEstimatedDiscountedValueString(
        unitPrice,
        personCount,
        discount
      ),
      expectedCloseDate: parseIsoDate(item.expectedCloseDate),
      lastContactDate: parseIsoDate(item.lastContactDate),
      opportunityStage: item.opportunityStage ?? OpportunityStage.NUMBER_0,
    };
  });
