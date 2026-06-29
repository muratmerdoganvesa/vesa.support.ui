import { CrmCurrencyType, LeadSource, OpportunityStage, TypeCodes } from "api/generated";

export const OPPORTUNITY_STAGE_OPTIONS: { value: OpportunityStage; label: string }[] = [
  { value: OpportunityStage.None, label: "Seçilmedi" },
  { value: OpportunityStage.New, label: "Yeni" },
  { value: OpportunityStage.Contacted, label: "İlk Görüşme" },
  { value: OpportunityStage.Qualified, label: "İhtiyaç Analizi" },
  { value: OpportunityStage.ProposalSent, label: "Teklif Gönderildi" },
  { value: OpportunityStage.Negotiation, label: "Pazarlık" },
  { value: OpportunityStage.Won, label: "Kazanıldı" },
  { value: OpportunityStage.Lost, label: "Kaybedildi" },
  { value: OpportunityStage.Cancelled, label: "İptal" },
];

export const getOpportunityStageLabel = (stage?: OpportunityStage | null): string => {
  if (stage == null) return "—";
  return OPPORTUNITY_STAGE_OPTIONS.find((o) => o.value === stage)?.label ?? "—";
};

export const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: LeadSource.None, label: "Seçilmedi" },
  { value: LeadSource.ColdCall, label: "Soğuk Çağrı" },
  { value: LeadSource.Website, label: "Web Sitesi" },
  { value: LeadSource.Referral, label: "Referans" },
  { value: LeadSource.Partner, label: "Partner" },
  { value: LeadSource.Event, label: "Etkinlik" },
  { value: LeadSource.SAP, label: "SAP" },
  { value: LeadSource.Other, label: "Diğer" },
];

export const getLeadSourceLabel = (source?: LeadSource | null): string => {
  if (source == null) return "—";
  return LEAD_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? "—";
};

export const CURRENCY_TYPE_OPTIONS: { value: CrmCurrencyType; label: string }[] = [
  { value: CrmCurrencyType.None, label: "Seçilmedi" },
  { value: CrmCurrencyType.TRY, label: "Türk Lirası" },
  { value: CrmCurrencyType.USD, label: "ABD Doları" },
  { value: CrmCurrencyType.EUR, label: "Euro" },
];

export const getCurrencyTypeLabel = (currency?: CrmCurrencyType | null): string => {
  if (currency == null) return "—";
  return CURRENCY_TYPE_OPTIONS.find((o) => o.value === currency)?.label ?? "—";
};

export const getCurrencySymbol = (currency?: CrmCurrencyType | null): string => {
  switch (currency) {
    case CrmCurrencyType.TRY:
      return "₺";
    case CrmCurrencyType.USD:
      return "$";
    case CrmCurrencyType.EUR:
      return "€";
    default:
      return "—";
  }
};

export const TYPE_CODE_OPTIONS: { value: TypeCodes; label: string }[] = [
  { value: TypeCodes.None, label: "Seçilmedi" },
  { value: TypeCodes.Lisance, label: "Lisans" },
  { value: TypeCodes.Consulting, label: "Danışmanlık" },
  { value: TypeCodes.MSP, label: "MSP" },
];

export const getTypeCodeLabel = (typeCode?: TypeCodes | null): string => {
  if (typeCode == null) return "—";
  return TYPE_CODE_OPTIONS.find((o) => o.value === typeCode)?.label ?? "—";
};

export const ROWS_PER_PAGE = 15;
