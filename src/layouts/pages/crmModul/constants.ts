import { LeadSource, OpportunityStage } from "api/generated";

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
  { value: LeadSource.Arete, label: "ARETE" },
  { value: LeadSource.Other, label: "Diğer" },
];

export const getLeadSourceLabel = (source?: LeadSource | null): string => {
  if (source == null) return "—";
  return LEAD_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? "—";
};

export const ROWS_PER_PAGE = 15;
