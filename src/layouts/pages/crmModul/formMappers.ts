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
import { startOfDay } from "date-fns";
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
  sapAccountManager: string;
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
  sapAccountManager: "",
});

export const validateCrmModulEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("@")) {
    return "E-posta adresi @ işareti içermelidir.";
  }
  return null;
};

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
  lastContactDate: startOfDay(new Date()),
  opportunityStage: OpportunityStage.NUMBER_0,
});

/** Para birimi, birim fiyat veya kişi sayısından biri doldurulduysa true */
export const isPricingGroupTouched = (item: CrmSubItemFormValues): boolean =>
  item.currencyType !== CurrencyType.NUMBER_0 ||
  item.unitPrice.trim() !== "" ||
  item.personCount.trim() !== "";

export const validatePricingGroup = (item: CrmSubItemFormValues): string | null => {
  if (!isPricingGroupTouched(item)) return null;

  if (item.currencyType === CurrencyType.NUMBER_0) {
    return "Para birimi seçilmelidir.";
  }
  if (!item.unitPrice.trim()) {
    return "Birim fiyat girilmelidir.";
  }
  if (!item.personCount.trim()) {
    return "Kişi sayısı girilmelidir.";
  }

  const unit = parseOptionalNumber(item.unitPrice);
  if (unit == null || unit < 0) {
    return "Geçerli bir birim fiyat girin.";
  }

  const count = parseOptionalInt(item.personCount);
  if (count == null || count < 0) {
    return "Geçerli bir kişi sayısı girin.";
  }

  if (item.discount.trim()) {
    const disc = parseOptionalInt(item.discount);
    if (disc == null || disc < 0 || disc > 100) {
      return "İndirim 0-100 arasında olmalıdır.";
    }
  }

  return null;
};

export const validateSubItems = (items: CrmSubItemFormValues[]): string | null => {
  for (let index = 0; index < items.length; index += 1) {
    const error = validatePricingGroup(items[index]);
    if (error) {
      return `Fırsat ${index + 1}: ${error}`;
    }
  }
  return null;
};

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

const parseDiscountPercent = (value: string): number => parseOptionalInt(value) ?? 0;

const toSubItemInputDto = (item: CrmSubItemFormValues): CrmSubItemInputDto => ({
  id: item.id ?? null,
  solutionModuleIds: item.solutionModuleIds.length > 0 ? item.solutionModuleIds : null,
  typeCode: item.typeCode,
  currencyType: item.currencyType,
  unitPrice: parseOptionalNumber(item.unitPrice),
  personCount: parseOptionalInt(item.personCount),
  discount: parseDiscountPercent(item.discount),
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
  sapAccountManager: modul.sapAccountManager.trim() || null,
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
  sapAccountManager: data.sapAccountManager ?? "",
});

const mapCrmSubItemDtoToFormValues = (item: CrmSubItemDto): CrmSubItemFormValues => {
  const unitPrice = item.unitPrice != null ? String(item.unitPrice) : "";
  const personCount = item.personCount != null ? String(item.personCount) : "";
  const discount = item.discount != null ? String(item.discount) : "";

  return {
    clientKey: item.id ?? crypto.randomUUID(),
    id: item.id,
    solutionModuleIds: (item.solutionModuleIds ?? []).map(String),
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
};

export const crmSubItemDtosToFormValues = (items: CrmSubItemDto[]): CrmSubItemFormValues[] =>
  items.map(mapCrmSubItemDtoToFormValues);

const hasLegacySubItemData = (data: CrmModulDto): boolean =>
  (data.solutionModuleIds?.length ?? 0) > 0 ||
  data.unitPrice != null ||
  data.personCount != null ||
  data.discount != null ||
  data.estimatedValue != null ||
  data.estimatedDiscountedValue != null ||
  data.expectedCloseDate != null ||
  data.lastContactDate != null ||
  (data.currencyType != null && data.currencyType !== CurrencyType.NUMBER_0) ||
  (data.typeCode != null && data.typeCode !== TypeCodes.NUMBER_0);

/** Kayıtlı fırsatları yükler; eski modül düzeyindeki veriyi de tek fırsata dönüştürür */
export const resolveSubItemsFromCrmModulDto = (data: CrmModulDto): CrmSubItemFormValues[] => {
  const subItems = data.crmSubItems ?? [];
  if (subItems.length > 0) {
    return crmSubItemDtosToFormValues(subItems);
  }

  if (!hasLegacySubItemData(data)) {
    return [];
  }

  const unitPrice = data.unitPrice != null ? String(data.unitPrice) : "";
  const personCount = data.personCount != null ? String(data.personCount) : "";
  const discount = data.discount != null ? String(data.discount) : "";

  return [
    {
      clientKey: crypto.randomUUID(),
      solutionModuleIds: (data.solutionModuleIds ?? []).map(String),
      typeCode: data.typeCode ?? TypeCodes.NUMBER_0,
      currencyType: data.currencyType ?? CurrencyType.NUMBER_0,
      unitPrice,
      personCount,
      discount,
      estimatedValue: calculateEstimatedValueString(unitPrice, personCount),
      estimatedDiscountedValue: calculateEstimatedDiscountedValueString(
        unitPrice,
        personCount,
        discount
      ),
      expectedCloseDate: parseIsoDate(data.expectedCloseDate),
      lastContactDate: parseIsoDate(data.lastContactDate),
      opportunityStage: OpportunityStage.NUMBER_0,
    },
  ];
};
