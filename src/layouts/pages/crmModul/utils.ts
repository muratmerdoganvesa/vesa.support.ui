import { format, isValid, parseISO, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CrmModulDto,
  CrmSubItemDto,
  CurrencyType,
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
import { calculateEstimatedDiscountedValueString, calculateEstimatedValueString, resolveOpportunitiesFromCrmModulDto, type CrmKalemFormValues, type CrmOpportunityFormValues, type CrmSubItemFormValues } from "./formMappers";

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

const parseKalemEstimatedValue = (kalem: CrmKalemFormValues): number => {
  const calculated = calculateEstimatedDiscountedValueString(
    kalem.unitPrice,
    kalem.personCount,
    kalem.discount
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

export const calculateCrmDetailStatsFromOpportunities = (
  opportunities: CrmOpportunityFormValues[]
): CrmDetailStats => {
  const pipeline = emptyCurrencyTotals();
  const weightedForecast = emptyCurrencyTotals();
  const won = emptyCurrencyTotals();
  let openOpportunityCount = 0;

  opportunities.forEach((opp) => {
    const stage = opp.opportunityStage ?? OpportunityStage.NUMBER_0;
    const isWon = stage === OpportunityStage.NUMBER_6;
    const isLostOrCancelled =
      stage === OpportunityStage.NUMBER_7 || stage === OpportunityStage.NUMBER_8;

    if (!isWon && !isLostOrCancelled) {
      openOpportunityCount += 1;
      opp.kalems.forEach((kalem) => {
        const amount = parseKalemEstimatedValue(kalem);
        addToCurrencyTotal(pipeline, kalem.currencyType, amount);
        const probability = getOpportunityStageProbability(stage) / 100;
        addToCurrencyTotal(weightedForecast, kalem.currencyType, amount * probability);
      });
    }

    if (isWon) {
      opp.kalems.forEach((kalem) => {
        addToCurrencyTotal(won, kalem.currencyType, parseKalemEstimatedValue(kalem));
      });
    }
  });

  return { openOpportunityCount, pipeline, weightedForecast, won };
};

const mergeCurrencyTotals = (left: CurrencyTotals, right: CurrencyTotals): CurrencyTotals => ({
  try: left.try + right.try,
  usd: left.usd + right.usd,
  eur: left.eur + right.eur,
});

export type CrmListPageStats = {
  filteredCustomerCount: number;
  totalCustomerCount: number;
  opportunityPackageCount: number;
  openPackageCount: number;
  wonPackageCount: number;
  pipeline: CurrencyTotals;
  won: CurrencyTotals;
  lastUpdated: {
    id?: string;
    companyName: string;
    updatedDate?: string | null;
    updatedBy?: string | null;
  } | null;
};

export type RecentlyUpdatedCustomer = {
  id: string;
  companyName: string;
  updatedDate?: string | null;
  updatedBy?: string | null;
  opportunityCount: number;
};

export type CrmChartStageSlice = {
  label: string;
  count: number;
};

export type CrmChartStats = {
  customerCount: number;
  opportunityPackageCount: number;
  openPackageCount: number;
  wonPackageCount: number;
  pipeline: CurrencyTotals;
  won: CurrencyTotals;
  stageSlices: CrmChartStageSlice[];
  leadSourceSlices: CrmChartStageSlice[];
  moduleSlices: CrmChartStageSlice[];
};

export const buildCrmChartStats = (rows: CrmModulDto[]): CrmChartStats => {
  let pipeline = emptyCurrencyTotals();
  let won = emptyCurrencyTotals();
  let opportunityPackageCount = 0;
  let openPackageCount = 0;
  let wonPackageCount = 0;
  const stageMap = new Map<string, number>();
  const leadMap = new Map<string, number>();
  const moduleMap = new Map<string, number>();

  rows.forEach((row) => {
    const leadLabel = getLeadSourceLabel(row.leadSource);
    if (leadLabel !== "—") {
      leadMap.set(leadLabel, (leadMap.get(leadLabel) ?? 0) + 1);
    }

    const opportunities = resolveOpportunitiesFromCrmModulDto(row);
    opportunityPackageCount += opportunities.length;

    opportunities.forEach((opp) => {
      const stage = opp.opportunityStage ?? OpportunityStage.NUMBER_0;
      const stageLabel = getOpportunityStageLabel(stage);
      if (stageLabel !== "—" && stage !== OpportunityStage.NUMBER_0) {
        stageMap.set(stageLabel, (stageMap.get(stageLabel) ?? 0) + 1);
      }

      if (stage === OpportunityStage.NUMBER_6) {
        wonPackageCount += 1;
      } else if (
        stage !== OpportunityStage.NUMBER_0 &&
        stage !== OpportunityStage.NUMBER_7 &&
        stage !== OpportunityStage.NUMBER_8
      ) {
        openPackageCount += 1;
      }
    });

    (row.crmSubItems ?? []).forEach((item) => {
      (item.solutionModuleNames ?? []).forEach((name) => {
        const trimmed = name?.trim();
        if (!trimmed) return;
        moduleMap.set(trimmed, (moduleMap.get(trimmed) ?? 0) + 1);
      });
    });

    const stats = calculateCrmDetailStatsFromOpportunities(opportunities);
    pipeline = mergeCurrencyTotals(pipeline, stats.pipeline);
    won = mergeCurrencyTotals(won, stats.won);
  });

  const toSlices = (map: Map<string, number>): CrmChartStageSlice[] =>
    Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

  return {
    customerCount: rows.length,
    opportunityPackageCount,
    openPackageCount,
    wonPackageCount,
    pipeline,
    won,
    stageSlices: toSlices(stageMap),
    leadSourceSlices: toSlices(leadMap),
    moduleSlices: toSlices(moduleMap).slice(0, 8),
  };
};

export const buildRecentlyUpdatedCustomers = (
  rows: CrmModulDto[],
  limit = 5
): RecentlyUpdatedCustomer[] =>
  [...rows]
    .filter((row): row is CrmModulDto & { id: string; updatedDate: string } =>
      Boolean(row.id && row.updatedDate)
    )
    .sort(
      (a, b) =>
        new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
    )
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      companyName: resolveCompanyName(row),
      updatedDate: row.updatedDate,
      updatedBy: row.updatedBy,
      opportunityCount: row.crmSubItems?.length ?? 0,
    }));

export const buildCrmListPageStats = (
  filteredRows: CrmModulDto[],
  totalRows: CrmModulDto[]
): CrmListPageStats => {
  let pipeline = emptyCurrencyTotals();
  let won = emptyCurrencyTotals();
  let opportunityPackageCount = 0;
  let openPackageCount = 0;
  let wonPackageCount = 0;

  filteredRows.forEach((row) => {
    const opportunities = resolveOpportunitiesFromCrmModulDto(row);
    opportunityPackageCount += opportunities.length;
    const stats = calculateCrmDetailStatsFromOpportunities(opportunities);
    openPackageCount += stats.openOpportunityCount;
    wonPackageCount += opportunities.filter(
      (opp) => (opp.opportunityStage ?? OpportunityStage.NUMBER_0) === OpportunityStage.NUMBER_6
    ).length;
    pipeline = mergeCurrencyTotals(pipeline, stats.pipeline);
    won = mergeCurrencyTotals(won, stats.won);
  });

  const lastUpdatedRow = [...filteredRows]
    .filter((row) => row.updatedDate)
    .sort(
      (a, b) =>
        new Date(b.updatedDate as string).getTime() - new Date(a.updatedDate as string).getTime()
    )[0];

  return {
    filteredCustomerCount: filteredRows.length,
    totalCustomerCount: totalRows.length,
    opportunityPackageCount,
    openPackageCount,
    wonPackageCount,
    pipeline,
    won,
    lastUpdated: lastUpdatedRow
      ? {
          id: lastUpdatedRow.id,
          companyName: resolveCompanyName(lastUpdatedRow),
          updatedDate: lastUpdatedRow.updatedDate,
          updatedBy: lastUpdatedRow.updatedBy,
        }
      : null,
  };
};

/** @deprecated calculateCrmDetailStatsFromOpportunities kullanın */
export const calculateCrmDetailStats = (items: CrmSubItemFormValues[]): CrmDetailStats =>
  calculateCrmDetailStatsFromOpportunities(
    items.map((item) => {
      const { opportunityStage, ...kalem } = item;
      return {
        clientKey: item.clientKey,
        opportunityStage,
        kalems: [kalem],
      };
    })
  );

export type OpportunityTotals = {
  currencyTotals: CurrencyTotals;
  primaryAmount: number;
  primaryCurrency: CurrencyType;
  hasMultipleCurrencies: boolean;
};

const countActiveCurrencies = (totals: CurrencyTotals): number =>
  (totals.eur > 0 ? 1 : 0) + (totals.usd > 0 ? 1 : 0) + (totals.try > 0 ? 1 : 0);

const resolvePrimaryFromCurrencyTotals = (
  currencyTotals: CurrencyTotals
): { primaryAmount: number; primaryCurrency: CurrencyType } => {
  if (currencyTotals.eur > 0) {
    return { primaryAmount: currencyTotals.eur, primaryCurrency: CurrencyType.NUMBER_3 };
  }
  if (currencyTotals.usd > 0) {
    return { primaryAmount: currencyTotals.usd, primaryCurrency: CurrencyType.NUMBER_2 };
  }
  if (currencyTotals.try > 0) {
    return { primaryAmount: currencyTotals.try, primaryCurrency: CurrencyType.NUMBER_1 };
  }
  return { primaryAmount: 0, primaryCurrency: CurrencyType.NUMBER_0 };
};

export const formatNonZeroCurrencyTotals = (totals: CurrencyTotals): string => {
  const parts: string[] = [];
  if (totals.eur > 0) parts.push(formatMoney(totals.eur, "€"));
  if (totals.usd > 0) parts.push(formatMoney(totals.usd, "$"));
  if (totals.try > 0) parts.push(formatMoney(totals.try, "₺"));
  return parts.length > 0 ? parts.join(" + ") : "—";
};

export const hasOpportunityAmount = (totals: OpportunityTotals | CurrencyTotals): boolean => {
  const currencyTotals = "currencyTotals" in totals ? totals.currencyTotals : totals;
  return currencyTotals.eur > 0 || currencyTotals.usd > 0 || currencyTotals.try > 0;
};

export const calculateOpportunityTotals = (
  opportunity: CrmOpportunityFormValues
): OpportunityTotals => {
  const currencyTotals = emptyCurrencyTotals();

  opportunity.kalems.forEach((kalem) => {
    const amount = parseKalemEstimatedValue(kalem);
    if (amount > 0 && kalem.currencyType !== CurrencyType.NUMBER_0) {
      addToCurrencyTotal(currencyTotals, kalem.currencyType, amount);
    }
  });

  const { primaryAmount, primaryCurrency } = resolvePrimaryFromCurrencyTotals(currencyTotals);

  return {
    currencyTotals,
    primaryAmount,
    primaryCurrency,
    hasMultipleCurrencies: countActiveCurrencies(currencyTotals) > 1,
  };
};

export const getOpportunityDisplayTitle = (
  opportunity: CrmOpportunityFormValues,
  modules: { id?: string; name?: string | null }[]
): string => {
  const customName = opportunity.name?.trim();
  if (customName) return customName;

  const names = opportunity.kalems
    .flatMap((k) => k.solutionModuleIds)
    .map((id) => resolveModuleNamesFromIds([id], modules))
    .filter((n) => n !== "—");

  if (names.length === 0) return "Yeni Fırsat Paketi";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} + ${names[1]}`;
  return `${names[0]} +${names.length - 1} modül`;
};

export const readSubItemOpportunityName = (item: CrmSubItemDto): string => {
  const fromCamel = item.opportunityName?.trim();
  if (fromCamel) return fromCamel;
  const fromPascal = (item as { OpportunityName?: string | null }).OpportunityName?.trim();
  return fromPascal ?? "";
};

/** Liste/tree satırları — önce fırsat adı, yoksa modül adları */
export const resolveSubItemDisplayTitle = (item: CrmSubItemDto): string => {
  const customName = readSubItemOpportunityName(item);
  if (customName) return customName;
  const moduleNames = formatSolutionModuleNames(item.solutionModuleNames);
  if (moduleNames !== "—") return moduleNames;
  return "Fırsat";
};

export const resolveOpportunityCreatedDate = (
  opportunity: CrmOpportunityFormValues
): string | undefined => {
  if (opportunity.createdDate) return opportunity.createdDate;
  const dates = opportunity.kalems
    .map((k) => k.createdDate)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) return undefined;
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
};

export const formatOpportunityCreatedLabel = (
  opportunity: CrmOpportunityFormValues
): string | null => {
  const raw = resolveOpportunityCreatedDate(opportunity);
  if (!raw) return null;
  const formatted = formatDateTr(raw);
  return formatted === "—" ? null : formatted;
};

export const getOpportunityTitle = (
  item: CrmSubItemFormValues,
  modules: { id?: string; name?: string | null }[]
): string => {
  const names = resolveModuleNamesFromIds(item.solutionModuleIds, modules);
  if (names !== "—") return names;
  return "Yeni Fırsat";
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

export const formatInlineList = (items: string[]): string => {
  if (!items.length) return "—";
  return items.join(", ");
};

export const formatDateTr = (value?: string | null): string => {
  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return "—";
  return format(date, "dd.MM.yyyy", { locale: tr });
};

export const formatDateTimeTr = (value?: string | null): string => {
  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return "—";
  return format(date, "dd MMM yyyy, HH:mm", { locale: tr });
};

export const formatCrmUpdatedBy = (value?: string | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  if (trimmed.includes("@")) {
    return trimmed.split("@")[0]?.replace(/[._]/g, " ") ?? trimmed;
  }
  return trimmed;
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
  partnerCompanies: CrmModulFilterOption[];
  opportunityStages: CrmModulFilterOption<OpportunityStage>[];
  typeCodes: CrmModulFilterOption<TypeCodes>[];
  accountManagers: CrmModulFilterOption[];
};

export const buildCrmModulFilterOptions = (rows: CrmModulDto[]): CrmModulFilterOptions => {
  const companySet = new Set<string>();
  const partnerCompanySet = new Set<string>();
  const stageMap = new Map<OpportunityStage, string>();
  const typeMap = new Map<TypeCodes, string>();
  const managerSet = new Set<string>();

  rows.forEach((row) => {
    const companyName = resolveCompanyName(row);
    if (companyName !== "—") {
      companySet.add(companyName);
    }

    const partnerCompanyName = row.partnerCompanyName?.trim();
    if (partnerCompanyName) {
      partnerCompanySet.add(partnerCompanyName);
    }

    (row.crmSubItems ?? []).forEach((item) => {
      if (item.opportunityStage == null || item.opportunityStage === OpportunityStage.NUMBER_0) {
        return;
      }
      stageMap.set(item.opportunityStage, getOpportunityStageLabel(item.opportunityStage));

      if (item.typeCode == null || item.typeCode === TypeCodes.NUMBER_0) {
        return;
      }
      typeMap.set(item.typeCode, getTypeCodeLabel(item.typeCode));
    });

    const sapAccountManager = row.sapAccountManager?.trim();
    if (sapAccountManager) {
      managerSet.add(sapAccountManager);
    }
  });

  const sortByLabel = <T extends string | number>(
    items: CrmModulFilterOption<T>[]
  ): CrmModulFilterOption<T>[] =>
    [...items].sort((a, b) => a.label.localeCompare(b.label, "tr"));

  return {
    companies: sortByLabel(Array.from(companySet).map((value) => ({ value, label: value }))),
    partnerCompanies: sortByLabel(
      Array.from(partnerCompanySet).map((value) => ({ value, label: value }))
    ),
    opportunityStages: sortByLabel(
      Array.from(stageMap.entries()).map(([value, label]) => ({ value, label }))
    ),
    typeCodes: sortByLabel(
      Array.from(typeMap.entries()).map(([value, label]) => ({ value, label }))
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

export type CrmKanbanOpportunity = {
  id: string;
  crmModulId: string;
  companyName: string;
  title: string;
  stage: OpportunityStage;
  kalemCount: number;
  currencyTotals: CurrencyTotals;
  primaryAmount: number;
  primaryCurrency: CurrencyType;
  hasMultipleCurrencies: boolean;
  expectedCloseDate?: string;
};

const resolveOpportunityTitleFromRow = (
  row: CrmModulDto,
  opportunity: CrmOpportunityFormValues
): string => {
  const customName = opportunity.name?.trim();
  if (customName) return customName;

  const kalemIds = new Set(
    opportunity.kalems.map((k) => k.id).filter((id): id is string => Boolean(id))
  );
  const names = new Set<string>();

  (row.crmSubItems ?? []).forEach((item) => {
    const inGroup =
      kalemIds.has(item.id ?? "") ||
      (item.opportunityGroupId && item.opportunityGroupId === opportunity.clientKey);
    if (!inGroup) return;
    (item.solutionModuleNames ?? []).forEach((name) => {
      const trimmed = name?.trim();
      if (trimmed) names.add(trimmed);
    });
  });

  const list = Array.from(names);
  if (list.length === 0) return "Fırsat Paketi";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} + ${list[1]}`;
  return `${list[0]} +${list.length - 1} modül`;
};

const resolvePrimaryCloseDate = (opportunity: CrmOpportunityFormValues): string | undefined => {
  const dates = opportunity.kalems
    .map((k) => k.expectedCloseDate)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return undefined;
  return format(dates[0], "yyyy-MM-dd");
};

/** Detay sayfası kanban kartları — müşterinin tüm fırsat paketleri */
export const buildKanbanCardsFromOpportunities = (
  opportunities: CrmOpportunityFormValues[],
  modules: { id?: string; name?: string | null }[]
): CrmKanbanOpportunity[] =>
  opportunities.map((opportunity) => {
    const totals = calculateOpportunityTotals(opportunity);
    return {
      id: opportunity.clientKey,
      crmModulId: "",
      companyName: "",
      title: getOpportunityDisplayTitle(opportunity, modules),
      stage: opportunity.opportunityStage ?? OpportunityStage.NUMBER_0,
      kalemCount: opportunity.kalems.length,
      currencyTotals: totals.currencyTotals,
      primaryAmount: totals.primaryAmount,
      primaryCurrency: totals.primaryCurrency,
      hasMultipleCurrencies: totals.hasMultipleCurrencies,
      expectedCloseDate: resolvePrimaryCloseDate(opportunity),
    };
  });

/** Liste sayfası kanban kartları — fırsat paketi bazında */
export const buildKanbanOpportunities = (rows: CrmModulDto[]): CrmKanbanOpportunity[] =>
  rows.flatMap((row) => {
    if (!row.id) return [];
    const companyName = resolveCompanyName(row);
    const opportunities = resolveOpportunitiesFromCrmModulDto(row);

    return opportunities.map((opportunity) => {
      const totals = calculateOpportunityTotals(opportunity);
      return {
        id: `${row.id}:${opportunity.clientKey}`,
        crmModulId: row.id,
        companyName,
        title: resolveOpportunityTitleFromRow(row, opportunity),
        stage: opportunity.opportunityStage ?? OpportunityStage.NUMBER_0,
        kalemCount: opportunity.kalems.length,
        currencyTotals: totals.currencyTotals,
        primaryAmount: totals.primaryAmount,
        primaryCurrency: totals.primaryCurrency,
        hasMultipleCurrencies: totals.hasMultipleCurrencies,
        expectedCloseDate: resolvePrimaryCloseDate(opportunity),
      };
    });
  });

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

/**
 * Telefon input değişimini işler.
 * Format karakteri (parantez, tire) silindiğinde ilgili rakamı da kaldırır.
 */
export const resolvePhoneNumberInput = (previousValue: string, nextRawValue: string): string => {
  const nextDigits = stripPhoneDigits(nextRawValue);
  const previousDigits = stripPhoneDigits(previousValue);

  const isDeleting = nextRawValue.length < previousValue.length;
  const deletedFormatCharOnly =
    isDeleting && nextDigits.length === previousDigits.length && previousDigits.length > 0;

  if (deletedFormatCharOnly) {
    return formatPhoneNumberTr(previousDigits.slice(0, -1));
  }

  return formatPhoneNumberTr(nextRawValue);
};
