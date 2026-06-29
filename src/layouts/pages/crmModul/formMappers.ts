import {
  CreateCrmModulDto,
  CrmCurrencyType,
  CrmModulDto,
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
  solutionModuleIds: string[];
  opportunityStage: OpportunityStage;
  currencyType: CrmCurrencyType;
  typeCode: TypeCodes;
  unitPrice: string;
  personCount: string;
  estimatedValue: string;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  nextAction: string;
  notes: string;
};

export const emptyCrmModulFormValues = (): CrmModulFormValues => ({
  partnerCompanyName: "",
  contactPerson: "",
  contactTitle: "",
  phoneNumber: "",
  email: "",
  leadSource: LeadSource.None,
  accountManager: "",
  solutionModuleIds: [],
  opportunityStage: OpportunityStage.None,
  currencyType: CrmCurrencyType.None,
  typeCode: TypeCodes.None,
  unitPrice: "",
  personCount: "",
  estimatedValue: "",
  expectedCloseDate: undefined,
  lastContactDate: undefined,
  nextAction: "",
  notes: "",
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

export const toCreateDto = (values: CrmModulFormValues): CreateCrmModulDto => ({
  partnerCompanyName: values.partnerCompanyName.trim() || null,
  contactPerson: values.contactPerson.trim() || null,
  contactTitle: values.contactTitle.trim() || null,
  phoneNumber: formatPhoneNumberTr(values.phoneNumber) || null,
  email: values.email.trim() || null,
  leadSource: values.leadSource,
  accountManager: values.accountManager.trim() || null,
  solutionModuleIds: values.solutionModuleIds.length > 0 ? values.solutionModuleIds : null,
  opportunityStage: values.opportunityStage,
  currencyType: values.currencyType,
  typeCode: values.typeCode,
  unitPrice: parseOptionalNumber(values.unitPrice),
  personCount: parseOptionalInt(values.personCount),
  estimatedValue: parseOptionalNumber(
    calculateEstimatedValueString(values.unitPrice, values.personCount)
  ),
  expectedCloseDate: toIsoDateString(values.expectedCloseDate),
  lastContactDate: toIsoDateString(values.lastContactDate),
  nextAction: values.nextAction.trim() || null,
  notes: values.notes.trim() || null,
});

export const toUpdateDto = (values: CrmModulFormValues): UpdateCrmModulDto => toCreateDto(values);

export const crmModulDtoToFormValues = (data: CrmModulDto): CrmModulFormValues => ({
  partnerCompanyName: data.partnerCompanyName ?? "",
  contactPerson: data.contactPerson ?? "",
  contactTitle: data.contactTitle ?? "",
  phoneNumber: formatPhoneNumberTr(data.phoneNumber ?? ""),
  email: data.email ?? "",
  leadSource: data.leadSource ?? LeadSource.None,
  accountManager: data.accountManager ?? "",
  solutionModuleIds: data.solutionModuleIds ?? [],
  opportunityStage: data.opportunityStage ?? OpportunityStage.None,
  currencyType: data.currencyType ?? CrmCurrencyType.None,
  typeCode: data.typeCode ?? TypeCodes.None,
  unitPrice: data.unitPrice != null ? String(data.unitPrice) : "",
  personCount: data.personCount != null ? String(data.personCount) : "",
  estimatedValue: calculateEstimatedValueString(
    data.unitPrice != null ? String(data.unitPrice) : "",
    data.personCount != null ? String(data.personCount) : ""
  ),
  expectedCloseDate: parseIsoDate(data.expectedCloseDate),
  lastContactDate: parseIsoDate(data.lastContactDate),
  nextAction: data.nextAction ?? "",
  notes: data.notes ?? "",
});
