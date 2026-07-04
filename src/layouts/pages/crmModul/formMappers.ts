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
  usedSapNonSapProducts: string;
  competitorProductsAndCompanies: string;
};

/** Tek modül kalemi — fiyatlandırma ve tarihler kalem bazında */
export type CrmKalemFormValues = {
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
  /** API'den yüklenen kalemleri fırsat paketine gruplamak için */
  createdDate?: string;
};

/** Fırsat paketi — durum (pipeline) fırsat seviyesinde ortak */
export type CrmOpportunityFormValues = {
  clientKey: string;
  name: string;
  opportunityStage: OpportunityStage;
  kalems: CrmKalemFormValues[];
  /** Paketteki en eski kalem oluşturma tarihi (API'den) */
  createdDate?: string;
};

/** @deprecated CrmOpportunityFormValues kullanın — geriye dönük uyumluluk */
export type CrmSubItemFormValues = CrmKalemFormValues & {
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
  usedSapNonSapProducts: "",
  competitorProductsAndCompanies: "",
});

export const validateCrmModulEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("@")) {
    return "E-posta adresi @ işareti içermelidir.";
  }
  return null;
};

export const emptyCrmKalemFormValues = (): CrmKalemFormValues => ({
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
});

export const emptyCrmOpportunityFormValues = (): CrmOpportunityFormValues => ({
  clientKey: crypto.randomUUID(),
  name: "",
  opportunityStage: OpportunityStage.NUMBER_0,
  kalems: [emptyCrmKalemFormValues()],
});

export const emptyCrmSubItemFormValues = (): CrmSubItemFormValues => ({
  ...emptyCrmKalemFormValues(),
  opportunityStage: OpportunityStage.NUMBER_0,
});

/** Para birimi, birim fiyat veya kişi sayısından biri doldurulduysa true */
export const isPricingGroupTouched = (item: CrmKalemFormValues): boolean =>
  item.currencyType !== CurrencyType.NUMBER_0 ||
  item.unitPrice.trim() !== "" ||
  item.personCount.trim() !== "";

export const validatePricingGroup = (item: CrmKalemFormValues): string | null => {
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

export const validateOpportunities = (opportunities: CrmOpportunityFormValues[]): string | null => {
  for (let oppIndex = 0; oppIndex < opportunities.length; oppIndex += 1) {
    const opp = opportunities[oppIndex];
    for (let kalemIndex = 0; kalemIndex < opp.kalems.length; kalemIndex += 1) {
      const error = validatePricingGroup(opp.kalems[kalemIndex]);
      if (error) {
        return `Fırsat ${oppIndex + 1}, Kalem ${kalemIndex + 1}: ${error}`;
      }
    }
  }
  return null;
};

/** @deprecated validateOpportunities kullanın */
export const validateSubItems = (items: CrmSubItemFormValues[]): string | null =>
  validateOpportunities(
    items.map((item) => ({
      clientKey: item.clientKey,
      opportunityStage: item.opportunityStage,
      kalems: [stripOpportunityStage(item)],
    }))
  );

const stripOpportunityStage = (item: CrmSubItemFormValues): CrmKalemFormValues => {
  const { opportunityStage: _stage, ...kalem } = item;
  return kalem;
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

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseOpportunityGroupId = (clientKey: string): string | null => {
  const trimmed = clientKey.trim();
  if (!trimmed || !GUID_PATTERN.test(trimmed)) return null;
  return trimmed;
};

const readOpportunityName = (item: CrmSubItemDto): string => {
  const fromCamel = item.opportunityName?.trim();
  if (fromCamel) return fromCamel;
  const fromPascal = (item as { OpportunityName?: string | null }).OpportunityName?.trim();
  return fromPascal ?? "";
};

const toKalemInputDto = (
  kalem: CrmKalemFormValues,
  opportunityStage: OpportunityStage,
  opportunityClientKey: string,
  opportunityName: string
): CrmSubItemInputDto => ({
  id: kalem.id ?? null,
  solutionModuleIds: kalem.solutionModuleIds.length > 0 ? kalem.solutionModuleIds : null,
  typeCode: kalem.typeCode,
  currencyType: kalem.currencyType,
  unitPrice: parseOptionalNumber(kalem.unitPrice),
  personCount: parseOptionalInt(kalem.personCount),
  discount: parseDiscountPercent(kalem.discount),
  estimatedValue: parseOptionalNumber(
    calculateEstimatedValueString(kalem.unitPrice, kalem.personCount)
  ),
  estimatedDiscountedValue: parseOptionalNumber(
    calculateEstimatedDiscountedValueString(kalem.unitPrice, kalem.personCount, kalem.discount)
  ),
  expectedCloseDate: toIsoDateString(kalem.expectedCloseDate),
  lastContactDate: toIsoDateString(kalem.lastContactDate),
  opportunityStage,
  opportunityGroupId: parseOpportunityGroupId(opportunityClientKey),
  opportunityName: opportunityName.trim() || null,
});

export const opportunitiesToSubItemDtos = (
  opportunities: CrmOpportunityFormValues[]
): CrmSubItemInputDto[] =>
  opportunities.flatMap((opp) =>
    opp.kalems.map((kalem) =>
      toKalemInputDto(kalem, opp.opportunityStage, opp.clientKey, opp.name)
    )
  );

export const toCreateDto = (
  modul: CrmModulFormValues,
  opportunities: CrmOpportunityFormValues[]
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
  usedSapNonSapProducts: modul.usedSapNonSapProducts.trim() || null,
  competitorProductsAndCompanies: modul.competitorProductsAndCompanies.trim() || null,
  crmSubItems:
    opportunities.length > 0 ? opportunitiesToSubItemDtos(opportunities) : null,
});

export const toUpdateDto = (
  modul: CrmModulFormValues,
  opportunities: CrmOpportunityFormValues[]
): UpdateCrmModulDto => toCreateDto(modul, opportunities);

/** @deprecated opportunitiesToSubItemDtos kullanın */
export const toCreateDtoFromSubItems = (
  modul: CrmModulFormValues,
  subItems: CrmSubItemFormValues[]
): CreateCrmModulDto =>
  toCreateDto(
    modul,
    subItems.map((item) => ({
      clientKey: item.clientKey,
      name: "",
      opportunityStage: item.opportunityStage,
      kalems: [stripOpportunityStage(item)],
    }))
  );

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
  usedSapNonSapProducts: data.usedSapNonSapProducts ?? "",
  competitorProductsAndCompanies: data.competitorProductsAndCompanies ?? "",
});

const mapCrmSubItemDtoToKalem = (item: CrmSubItemDto): CrmKalemFormValues => {
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
    createdDate: item.createdDate,
  };
};

const splitLegacyKalemByModules = (kalem: CrmKalemFormValues): CrmKalemFormValues[] => {
  const ids = kalem.solutionModuleIds;
  if (ids.length <= 1) {
    return [kalem];
  }
  return ids.map((moduleId): CrmKalemFormValues => ({
    ...kalem,
    clientKey: crypto.randomUUID(),
    id: undefined,
    solutionModuleIds: [moduleId],
  }));
};

const resolveOpportunityGroupKey = (item: CrmSubItemDto): string => {
  if (item.opportunityGroupId) return item.opportunityGroupId;
  // opportunityGroupId yoksa her kalem ayrı fırsat
  return `legacy:${item.id ?? crypto.randomUUID()}`;
};

const pickEarliestCreatedDate = (kalems: CrmKalemFormValues[]): string | undefined => {
  const dates = kalems
    .map((k) => k.createdDate)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) return undefined;
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
};

export const crmSubItemDtosToOpportunities = (
  items: CrmSubItemDto[]
): CrmOpportunityFormValues[] => {
  const groups = new Map<
    string,
    { stage: OpportunityStage; name: string; kalems: CrmKalemFormValues[] }
  >();
  const hasGroupMarkers = items.some((item) => Boolean(item.opportunityGroupId));

  items.forEach((item) => {
    const key = resolveOpportunityGroupKey(item);
    const kalem = mapCrmSubItemDtoToKalem(item);
    const kalems = hasGroupMarkers ? [kalem] : splitLegacyKalemByModules(kalem);
    const stage = item.opportunityStage ?? OpportunityStage.NUMBER_0;
    const itemName = readOpportunityName(item);

    const existing = groups.get(key);
    if (existing) {
      existing.kalems.push(...kalems);
      if (itemName && !existing.name) {
        existing.name = itemName;
      }
      if (stage !== OpportunityStage.NUMBER_0) {
        existing.stage = stage;
      }
    } else {
      groups.set(key, { stage, name: itemName, kalems });
    }
  });

  return Array.from(groups.entries()).map(([groupKey, group]) => ({
    clientKey: groupKey.startsWith("legacy:")
      ? groupKey.replace(/^legacy:/, "")
      : groupKey,
    name: group.name,
    opportunityStage: group.stage,
    kalems: group.kalems,
    createdDate: pickEarliestCreatedDate(group.kalems),
  }));
};

/** Sunucudan yükleme sonrası UI anahtarlarını ve girilen adları korur */
export const mergeOpportunitiesWithServer = (
  local: CrmOpportunityFormValues[],
  server: CrmOpportunityFormValues[]
): CrmOpportunityFormValues[] => {
  if (server.length === 0 && local.length > 0) {
    return local;
  }

  const matchLocal = (serverOpp: CrmOpportunityFormValues): CrmOpportunityFormValues | undefined => {
    const byClientKey = local.find((item) => item.clientKey === serverOpp.clientKey);
    if (byClientKey) return byClientKey;

    const serverKalemIds = new Set(
      serverOpp.kalems.map((k) => k.id).filter((id): id is string => Boolean(id))
    );
    if (serverKalemIds.size === 0) return undefined;

    return local.find((item) =>
      item.kalems.some((k) => k.id && serverKalemIds.has(k.id))
    );
  };

  return server.map((serverOpp) => {
    const localOpp = matchLocal(serverOpp);
    if (!localOpp) return serverOpp;

    return {
      ...serverOpp,
      clientKey: localOpp.clientKey,
      name: serverOpp.name?.trim() || localOpp.name?.trim() || "",
    };
  });
};

/** @deprecated crmSubItemDtosToOpportunities kullanın */
export const crmSubItemDtosToFormValues = (items: CrmSubItemDto[]): CrmSubItemFormValues[] =>
  items.map((item) => ({
    ...mapCrmSubItemDtoToKalem(item),
    opportunityStage: item.opportunityStage ?? OpportunityStage.NUMBER_0,
  }));

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
export const resolveOpportunitiesFromCrmModulDto = (
  data: CrmModulDto
): CrmOpportunityFormValues[] => {
  const subItems = data.crmSubItems ?? [];
  if (subItems.length > 0) {
    return crmSubItemDtosToOpportunities(subItems);
  }

  if (!hasLegacySubItemData(data)) {
    return [];
  }

  const unitPrice = data.unitPrice != null ? String(data.unitPrice) : "";
  const personCount = data.personCount != null ? String(data.personCount) : "";
  const discount = data.discount != null ? String(data.discount) : "";

  const legacyKalem: CrmKalemFormValues = {
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
  };

  return [
    {
      clientKey: crypto.randomUUID(),
      name: "",
      opportunityStage: OpportunityStage.NUMBER_0,
      kalems: splitLegacyKalemByModules(legacyKalem),
    },
  ];
};

/** @deprecated resolveOpportunitiesFromCrmModulDto kullanın */
export const resolveSubItemsFromCrmModulDto = (data: CrmModulDto): CrmSubItemFormValues[] => {
  return resolveOpportunitiesFromCrmModulDto(data).flatMap((opp) =>
    opp.kalems.map((kalem) => ({
      ...kalem,
      opportunityStage: opp.opportunityStage,
    }))
  );
};
