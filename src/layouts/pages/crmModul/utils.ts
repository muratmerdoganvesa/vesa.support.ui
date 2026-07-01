import { format, isValid, parseISO, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CrmModulDto,
  CrmSubItemDto,
  CurrencyType,
  LeadSource,
  ListModuleDto,
  OpportunityStage,
  TypeCodes,
} from "api/generated";
import {
  getLeadSourceLabel,
  getOpportunityStageLabel,
  getOpportunityStageProbability,
  getTypeCodeLabel,
} from "./constants";
import { calculateEstimatedDiscountedValueString, calculateEstimatedValueString, type CrmSubItemFormValues } from "./formMappers";

export type CrmModulListAggregates = {
  totalPersonCount: number;
  uniqueModuleNames: string[];
  uniqueTypeLabels: string[];
  uniqueOpportunityStageLabels: string[];
};

export const aggregateCrmModulSubItems = (row: CrmModulDto): CrmModulListAggregates => {
  const subItems = row.crmSubItems ?? [];

  const totalPersonCount = subItems.reduce(
    (sum, item) => sum + (item.personCount ?? 0),
    0
  );

  const moduleMap = new Map<string, string>();
  subItems.forEach((item) => {
    const ids = item.solutionModuleIds ?? [];
    const names = item.solutionModuleNames ?? [];
    ids.forEach((id, index) => {
      if (!id || moduleMap.has(id)) return;
      moduleMap.set(id, names[index]?.trim() || id);
    });
  });

  const typeMap = new Map<TypeCodes, string>();
  subItems.forEach((item) => {
    if (item.typeCode == null || item.typeCode === TypeCodes.NUMBER_0) return;
    if (!typeMap.has(item.typeCode)) {
      typeMap.set(item.typeCode, getTypeCodeLabel(item.typeCode));
    }
  });

  const stageMap = new Map<OpportunityStage, string>();
  subItems.forEach((item) => {
    if (item.opportunityStage == null || item.opportunityStage === OpportunityStage.NUMBER_0) return;
    if (!stageMap.has(item.opportunityStage)) {
      stageMap.set(item.opportunityStage, getOpportunityStageLabel(item.opportunityStage));
    }
  });

  const uniqueModuleNames = Array.from(moduleMap.values()).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
  const uniqueTypeLabels = Array.from(typeMap.values()).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
  const uniqueOpportunityStageLabels = Array.from(stageMap.values()).sort((a, b) =>
    a.localeCompare(b, "tr")
  );

  return { totalPersonCount, uniqueModuleNames, uniqueTypeLabels, uniqueOpportunityStageLabels };
};

export type CurrencyTotals = {
  try: number;
  usd: number;
  eur: number;
};

export type CrmDetailStats = {
  openOpportunityCount: number;
  pipeline: CurrencyTotals;
  weightedForecast: CurrencyTotals;
  won: CurrencyTotals;
};

const emptyCurrencyTotals = (): CurrencyTotals => ({ try: 0, usd: 0, eur: 0 });

const parseItemEstimatedValue = (item: CrmSubItemFormValues): number => {
  const calculated = calculateEstimatedDiscountedValueString(
    item.unitPrice,
    item.personCount,
    item.discount
  );
  if (!calculated) return 0;
  const parsed = Number(calculated);
  return Number.isFinite(parsed) ? parsed : 0;
};

const addToCurrencyTotal = (totals: CurrencyTotals, currency: CurrencyType, amount: number) => {
  switch (currency) {
    case CurrencyType.NUMBER_1:
      totals.try += amount;
      break;
    case CurrencyType.NUMBER_2:
      totals.usd += amount;
      break;
    case CurrencyType.NUMBER_3:
      totals.eur += amount;
      break;
    default:
      break;
  }
};

export const calculateCrmDetailStats = (items: CrmSubItemFormValues[]): CrmDetailStats => {
  const pipeline = emptyCurrencyTotals();
  const weightedForecast = emptyCurrencyTotals();
  const won = emptyCurrencyTotals();
  let openOpportunityCount = 0;

  items.forEach((item) => {
    const amount = parseItemEstimatedValue(item);
    const stage = item.opportunityStage ?? OpportunityStage.NUMBER_0;
    const isWon = stage === OpportunityStage.NUMBER_6;
    const isLostOrCancelled =
      stage === OpportunityStage.NUMBER_7 || stage === OpportunityStage.NUMBER_8;

    if (!isWon && !isLostOrCancelled) {
      openOpportunityCount += 1;
      addToCurrencyTotal(pipeline, item.currencyType, amount);
      const probability = getOpportunityStageProbability(stage) / 100;
      addToCurrencyTotal(weightedForecast, item.currencyType, amount * probability);
    }

    if (isWon) {
      addToCurrencyTotal(won, item.currencyType, amount);
    }
  });

  return { openOpportunityCount, pipeline, weightedForecast, won };
};

export const formatMoney = (amount: number, symbol: string): string => {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${symbol}${formatted}`;
};

export const formatCurrencyTotalsBlock = (totals: CurrencyTotals): string[] => [
  formatMoney(totals.try, "₺"),
  formatMoney(totals.usd, "$"),
  formatMoney(totals.eur, "€"),
];

export const getCompanyInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "—";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
};

export const getOpportunityTitle = (
  item: CrmSubItemFormValues,
  modules: { id?: string; name?: string | null }[]
): string => {
  const names = resolveModuleNamesFromIds(item.solutionModuleIds, modules);
  if (names !== "—") return names;
  return "Yeni Fırsat";
};

export const formatInlineList = (items: string[]): string => {
  if (!items.length) return "—";
  return items.join(", ");
};

export const formatDateTr = (value?: string | null): string => {  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return "—";
  return format(date, "dd.MM.yyyy", { locale: tr });
};

export const toIsoDateString = (date?: Date): string | null => {
  if (!date || !isValid(date)) return null;
  return format(date, "yyyy-MM-dd");
};

export const parseIsoDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

export const resolveModuleNamesFromIds = (
  ids: string[],
  modules: { id?: string; name?: string | null }[]
): string => {
  if (!ids.length) return "—";
  const nameMap = new Map(
    modules.filter((m) => m.id).map((m) => [m.id as string, m.name ?? ""])
  );
  const names = ids.map((id) => nameMap.get(id) || id).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "—";
};

export const resolveCompanyName = (row: CrmModulDto): string =>
  row.companyName?.trim() || row.partnerCompanyName?.trim() || "—";

export const resolvePartnerCompanyName = (row: CrmModulDto): string =>
  row.partnerCompanyName?.trim() || "—";

export type CrmModulFilterOption<T extends string | number = string> = {
  value: T;
  label: string;
};

export type CrmModulFilterOptions = {
  companies: CrmModulFilterOption[];
  leadSources: CrmModulFilterOption<LeadSource>[];
  opportunityStages: CrmModulFilterOption<OpportunityStage>[];
  contactPersons: CrmModulFilterOption[];
  accountManagers: CrmModulFilterOption[];
};

export const buildCrmModulFilterOptions = (rows: CrmModulDto[]): CrmModulFilterOptions => {
  const companySet = new Set<string>();
  const leadSourceMap = new Map<LeadSource, string>();
  const stageMap = new Map<OpportunityStage, string>();
  const contactSet = new Set<string>();
  const managerSet = new Set<string>();

  rows.forEach((row) => {
    const companyName = resolveCompanyName(row);
    if (companyName !== "—") {
      companySet.add(companyName);
    }

    if (row.leadSource != null && row.leadSource !== LeadSource.NUMBER_0) {
      leadSourceMap.set(row.leadSource, getLeadSourceLabel(row.leadSource));
    }

    (row.crmSubItems ?? []).forEach((item) => {
      if (item.opportunityStage == null || item.opportunityStage === OpportunityStage.NUMBER_0) {
        return;
      }
      stageMap.set(item.opportunityStage, getOpportunityStageLabel(item.opportunityStage));
    });

    const contactPerson = row.contactPerson?.trim();
    if (contactPerson) {
      contactSet.add(contactPerson);
    }

    const accountManager = row.accountManager?.trim();
    if (accountManager) {
      managerSet.add(accountManager);
    }
  });

  const sortByLabel = <T extends string | number>(
    items: CrmModulFilterOption<T>[]
  ): CrmModulFilterOption<T>[] =>
    [...items].sort((a, b) => a.label.localeCompare(b.label, "tr"));

  return {
    companies: sortByLabel(Array.from(companySet).map((value) => ({ value, label: value }))),
    leadSources: sortByLabel(
      Array.from(leadSourceMap.entries()).map(([value, label]) => ({ value, label }))
    ),
    opportunityStages: sortByLabel(
      Array.from(stageMap.entries()).map(([value, label]) => ({ value, label }))
    ),
    contactPersons: sortByLabel(
      Array.from(contactSet).map((value) => ({ value, label: value }))
    ),
    accountManagers: sortByLabel(
      Array.from(managerSet).map((value) => ({ value, label: value }))
    ),
  };
};

export const formatSolutionModuleNames = (names?: string[] | null): string => {
  if (!names?.length) return "—";
  return names.join(", ");
};

export const mergeActiveModulesWithSelected = (
  activeModules: ListModuleDto[],
  crmData?: CrmModulDto | null
): ListModuleDto[] => {
  const merged = new Map<string, ListModuleDto>();

  activeModules.forEach((module) => {
    if (module.id) {
      merged.set(module.id, module);
    }
  });

  const selectedIds = [
    ...(crmData?.solutionModuleIds ?? []),
    ...(crmData?.crmSubItems?.flatMap((item) => item.solutionModuleIds ?? []) ?? []),
  ];
  const selectedNames = [
    ...(crmData?.solutionModuleNames ?? []),
    ...(crmData?.crmSubItems?.flatMap((item) => item.solutionModuleNames ?? []) ?? []),
  ];

  selectedIds.forEach((id, index) => {
    if (!id || merged.has(id)) return;
    merged.set(id, {
      id,
      name: selectedNames[index] ?? id,
      isActive: false,
    });
  });

  return Array.from(merged.values()).sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", "tr")
  );
};

export type CrmModulSubItemEntry = {
  parent: CrmModulDto;
  item: CrmSubItemDto;
  key: string;
};

export const flattenCrmSubItems = (rows: CrmModulDto[]): CrmModulSubItemEntry[] => {
  const result: CrmModulSubItemEntry[] = [];
  rows.forEach((parent) => {
    (parent.crmSubItems ?? []).forEach((item, index) => {
      result.push({
        parent,
        item,
        key: item.id ?? `${parent.id ?? "parent"}-sub-${index}`,
      });
    });
  });
  return result;
};

export const isDateInRange = (  value?: string | null,
  from?: Date,
  to?: Date
): boolean => {
  if (!from && !to) return true;
  if (!value) return false;
  const date = startOfDay(parseISO(value));
  if (!isValid(date)) return false;
  if (from && date < startOfDay(from)) return false;
  if (to && date > startOfDay(to)) return false;
  return true;
};

/** Rakamları normalize eder (max 11 hane, başında 0). */
export const stripPhoneDigits = (value: string): string => {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length > 0 && !digits.startsWith("0")) {
    digits = `0${digits}`;
  }

  return digits.slice(0, 11);
};

/** Türkiye cep formatı: 0(506)-613-30-89 */
export const formatPhoneNumberTr = (value: string): string => {
  const d = stripPhoneDigits(value);
  if (!d) return "";
  if (d.length === 1) return d;

  let formatted = `${d[0]}(${d.slice(1, Math.min(4, d.length))}`;
  if (d.length < 4) return formatted;

  formatted = `${d[0]}(${d.slice(1, 4)})`;
  if (d.length <= 4) return formatted;

  formatted += `-${d.slice(4, Math.min(7, d.length))}`;
  if (d.length <= 7) return formatted;

  formatted += `-${d.slice(7, Math.min(9, d.length))}`;
  if (d.length <= 9) return formatted;

  formatted += `-${d.slice(9, 11)}`;
  return formatted;
};
