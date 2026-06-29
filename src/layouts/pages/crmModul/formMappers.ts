import {
  CreateCrmModulDto,
  CrmCurrencyType,
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
  partnerCompanyName: string;
  contactPerson: string;
  contactTitle: string;
  phoneNumber: string;
  email: string;
  leadSource: LeadSource;
  accountManager: string;
  opportunityStage: OpportunityStage;
};

export type CrmSubItemFormValues = {
  clientKey: string;
  id?: string;
  solutionModuleIds: string[];
  typeCode: TypeCodes;
  currencyType: CrmCurrencyType;
  unitPrice: string;
  personCount: string;
  estimatedValue: string;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
};

export const emptyCrmModulFormValues = (): CrmModulFormValues => ({
  partnerCompanyName: "",
  contactPerson: "",
  contactTitle: "",
  phoneNumber: "",
  email: "",
  leadSource: LeadSource.None,
  accountManager: "",
  opportunityStage: OpportunityStage.None,
});

export const emptyCrmSubItemFormValues = (): CrmSubItemFormValues => ({
  clientKey: crypto.randomUUID(),
  solutionModuleIds: [],
  typeCode: TypeCodes.None,
  currencyType: CrmCurrencyType.None,
  unitPrice: "",
  personCount: "",
  estimatedValue: "",
  expectedCloseDate: undefined,
  lastContactDate: undefined,
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

const toSubItemInputDto = (item: CrmSubItemFormValues): CrmSubItemInputDto => ({
  id: item.id ?? null,
  solutionModuleIds: item.solutionModuleIds.length > 0 ? item.solutionModuleIds : null,
  typeCode: item.typeCode,
  currencyType: item.currencyType,
  unitPrice: parseOptionalNumber(item.unitPrice),
  personCount: parseOptionalInt(item.personCount),
  estimatedValue: parseOptionalNumber(
    calculateEstimatedValueString(item.unitPrice, item.personCount)
  ),
  expectedCloseDate: toIsoDateString(item.expectedCloseDate),
  lastContactDate: toIsoDateString(item.lastContactDate),
});

export const toCreateDto = (
  modul: CrmModulFormValues,
  subItems: CrmSubItemFormValues[]
): CreateCrmModulDto => ({
  partnerCompanyName: modul.partnerCompanyName.trim() || null,
  contactPerson: modul.contactPerson.trim() || null,
  contactTitle: modul.contactTitle.trim() || null,
  phoneNumber: formatPhoneNumberTr(modul.phoneNumber) || null,
  email: modul.email.trim() || null,
  leadSource: modul.leadSource,
  accountManager: modul.accountManager.trim() || null,
  opportunityStage: modul.opportunityStage,
  crmSubItems: subItems.length > 0 ? subItems.map(toSubItemInputDto) : null,
});

export const toUpdateDto = (
  modul: CrmModulFormValues,
  subItems: CrmSubItemFormValues[]
): UpdateCrmModulDto => toCreateDto(modul, subItems);

export const crmModulDtoToFormValues = (data: CrmModulDto): CrmModulFormValues => ({
  partnerCompanyName: data.partnerCompanyName ?? "",
  contactPerson: data.contactPerson ?? "",
  contactTitle: data.contactTitle ?? "",
  phoneNumber: formatPhoneNumberTr(data.phoneNumber ?? ""),
  email: data.email ?? "",
  leadSource: data.leadSource ?? LeadSource.None,
  accountManager: data.accountManager ?? "",
  opportunityStage: data.opportunityStage ?? OpportunityStage.None,
});

export const crmSubItemDtosToFormValues = (items: CrmSubItemDto[]): CrmSubItemFormValues[] =>
  items.map((item) => ({
    clientKey: item.id ?? crypto.randomUUID(),
    id: item.id,
    solutionModuleIds: item.solutionModuleIds ?? [],
    typeCode: item.typeCode ?? TypeCodes.None,
    currencyType: item.currencyType ?? CrmCurrencyType.None,
    unitPrice: item.unitPrice != null ? String(item.unitPrice) : "",
    personCount: item.personCount != null ? String(item.personCount) : "",
    estimatedValue: calculateEstimatedValueString(
      item.unitPrice != null ? String(item.unitPrice) : "",
      item.personCount != null ? String(item.personCount) : ""
    ),
    expectedCloseDate: parseIsoDate(item.expectedCloseDate),
    lastContactDate: parseIsoDate(item.lastContactDate),
  }));
