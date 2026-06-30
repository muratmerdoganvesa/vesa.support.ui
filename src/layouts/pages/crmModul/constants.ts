import { CurrencyType, LeadSource, OpportunityStage, TypeCodes } from "api/generated";

export const OPPORTUNITY_STAGE_OPTIONS: { value: OpportunityStage; label: string }[] = [
  { value: OpportunityStage.NUMBER_0, label: "Seçilmedi" },
  { value: OpportunityStage.NUMBER_1, label: "Yeni" },
  { value: OpportunityStage.NUMBER_2, label: "İlk Görüşme" },
  { value: OpportunityStage.NUMBER_3, label: "İhtiyaç Analizi" },
  { value: OpportunityStage.NUMBER_4, label: "Teklif Gönderildi" },
  { value: OpportunityStage.NUMBER_5, label: "Pazarlık" },
  { value: OpportunityStage.NUMBER_6, label: "Kazanıldı" },
  { value: OpportunityStage.NUMBER_7, label: "Kaybedildi" },
  { value: OpportunityStage.NUMBER_8, label: "İptal" },
];

export const getOpportunityStageLabel = (stage?: OpportunityStage | null): string => {
  if (stage == null) return "—";
  return OPPORTUNITY_STAGE_OPTIONS.find((o) => o.value === stage)?.label ?? "—";
};

export const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: LeadSource.NUMBER_0, label: "Seçilmedi" },
  { value: LeadSource.NUMBER_1, label: "Soğuk Çağrı" },
  { value: LeadSource.NUMBER_2, label: "Web Sitesi" },
  { value: LeadSource.NUMBER_3, label: "Referans" },
  { value: LeadSource.NUMBER_4, label: "Partner" },
  { value: LeadSource.NUMBER_5, label: "Etkinlik" },
  { value: LeadSource.NUMBER_6, label: "SAP" },
  { value: LeadSource.NUMBER_7, label: "Diğer" },
];

export const getLeadSourceLabel = (source?: LeadSource | null): string => {
  if (source == null) return "—";
  return LEAD_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? "—";
};

export const CURRENCY_TYPE_OPTIONS: { value: CurrencyType; label: string }[] = [
  { value: CurrencyType.NUMBER_0, label: "Seçilmedi" },
  { value: CurrencyType.NUMBER_1, label: "Türk Lirası" },
  { value: CurrencyType.NUMBER_2, label: "ABD Doları" },
  { value: CurrencyType.NUMBER_3, label: "Euro" },
];

export const getCurrencyTypeLabel = (currency?: CurrencyType | null): string => {
  if (currency == null) return "—";
  return CURRENCY_TYPE_OPTIONS.find((o) => o.value === currency)?.label ?? "—";
};

export const getCurrencySymbol = (currency?: CurrencyType | null): string => {
  switch (currency) {
    case CurrencyType.NUMBER_1:
      return "₺";
    case CurrencyType.NUMBER_2:
      return "$";
    case CurrencyType.NUMBER_3:
      return "€";
    default:
      return "—";
  }
};

export const TYPE_CODE_OPTIONS: { value: TypeCodes; label: string }[] = [
  { value: TypeCodes.NUMBER_0, label: "Seçilmedi" },
  { value: TypeCodes.NUMBER_1, label: "Lisans" },
  { value: TypeCodes.NUMBER_2, label: "Danışmanlık" },
  { value: TypeCodes.NUMBER_3, label: "MSP" },
];

export const getTypeCodeLabel = (typeCode?: TypeCodes | null): string => {
  if (typeCode == null) return "—";
  return TYPE_CODE_OPTIONS.find((o) => o.value === typeCode)?.label ?? "—";
};

export const ROWS_PER_PAGE = 15;
