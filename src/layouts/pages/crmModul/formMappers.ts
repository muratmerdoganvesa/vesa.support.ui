import {
  CreateCrmModulDto,
  CrmModulDto,
  LeadSource,
  OpportunityStage,
  UpdateCrmModulDto,
  WorkCompanyDto,
} from "api/generated";
import { parseIsoDate, toIsoDateString, formatPhoneNumberTr } from "./utils";

export type CrmModulFormValues = {
  workCompany: WorkCompanyDto | null;
  partnerCompanyName: string;
  contactPerson: string;
  contactTitle: string;
  phoneNumber: string;
  email: string;
  leadSource: LeadSource;
  accountManager: string;
  solutionModule: string;
  opportunityStage: OpportunityStage;
  unitPrice: string;
  personCount: string;
  estimatedValue: string;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  nextAction: string;
  notes: string;
};

export const emptyCrmModulFormValues = (): CrmModulFormValues => ({
  workCompany: null,
  partnerCompanyName: "",
  contactPerson: "",
  contactTitle: "",
  phoneNumber: "",
  email: "",
  leadSource: LeadSource.None,
  accountManager: "",
  solutionModule: "",
  opportunityStage: OpportunityStage.None,
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
  workCompanyId: values.workCompany?.id ?? null,
  partnerCompanyName: values.partnerCompanyName.trim() || values.workCompany?.name || null,
  contactPerson: values.contactPerson.trim() || null,
  contactTitle: values.contactTitle.trim() || null,
  phoneNumber: formatPhoneNumberTr(values.phoneNumber) || null,
  email: values.email.trim() || null,
  leadSource: values.leadSource,
  accountManager: values.accountManager.trim() || null,
  solutionModule: values.solutionModule.trim() || null,
  opportunityStage: values.opportunityStage,
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

export const crmModulDtoToFormValues = (
  data: CrmModulDto,
  workCompanies: WorkCompanyDto[]
): CrmModulFormValues => {
  const company =
    workCompanies.find((c) => c.id === data.workCompanyId) ??
    (data.workCompanyId
      ? ({ id: data.workCompanyId, name: data.partnerCompanyName ?? "" } as WorkCompanyDto)
      : null);

  return {
    workCompany: company,
    partnerCompanyName: data.partnerCompanyName ?? "",
    contactPerson: data.contactPerson ?? "",
    contactTitle: data.contactTitle ?? "",
    phoneNumber: formatPhoneNumberTr(data.phoneNumber ?? ""),
    email: data.email ?? "",
    leadSource: data.leadSource ?? LeadSource.None,
    accountManager: data.accountManager ?? "",
    solutionModule: data.solutionModule ?? "",
    opportunityStage: data.opportunityStage ?? OpportunityStage.None,
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
  };
};
