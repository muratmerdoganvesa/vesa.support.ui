import { CrmModulNoteDto, ListModuleDto } from "api/generated";
import {
  calculateEstimatedDiscountedValueString,
  calculateEstimatedValueString,
  type CrmModulFormValues,
  type CrmSubItemFormValues,
} from "./formMappers";
import {
  getCurrencySymbol,
  getOpportunityStageLabel,
} from "./constants";
import { getOpportunityTitle } from "./utils";

export type CrmAiRaporPayload = {
  musteri_adi: string;
  firsatlar: {
    ad: string;
    asama?: string;
    butce?: string;
  }[];
  notlar: {
    tarih?: string;
    firsat?: string;
    not?: string;
  }[];
};

const formatBudget = (item: CrmSubItemFormValues): string | undefined => {
  const estimated = calculateEstimatedDiscountedValueString(
    item.unitPrice,
    item.personCount,
    item.discount
  );
  if (!estimated) return undefined;

  const amount = Number(estimated);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;

  const symbol = getCurrencySymbol(item.currencyType);
  const currencyLabel =
    symbol === "€" ? "EUR" : symbol === "$" ? "USD" : symbol === "₺" ? "TRY" : symbol;

  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted =
      millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`;
    return `~${formatted} ${currencyLabel}`;
  }

  if (amount >= 1_000) {
    const thousands = Math.round(amount / 1_000);
    return `~${thousands}k ${currencyLabel}`;
  }

  return `~${amount.toLocaleString("tr-TR")} ${currencyLabel}`;
};

const formatNoteDate = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.slice(0, 10);
};

export const buildCrmAiRaporPayload = (
  modulValues: CrmModulFormValues,
  subItems: CrmSubItemFormValues[],
  modules: ListModuleDto[],
  notes: CrmModulNoteDto[]
): CrmAiRaporPayload => {
  const firsatlar = subItems.map((item) => {
    const ad = getOpportunityTitle(item, modules);
    const asamaLabel = getOpportunityStageLabel(item.opportunityStage);
    const asama = asamaLabel !== "—" && asamaLabel !== "Seçilmedi" ? asamaLabel : undefined;
    const butce = formatBudget(item);

    return {
      ad,
      ...(asama ? { asama } : {}),
      ...(butce ? { butce } : {}),
    };
  });

  const notlar = notes
    .filter((note) => note.notes?.trim())
    .map((note) => ({
      tarih: formatNoteDate(note.createdDate),
      not: note.notes?.trim() ?? "",
    }))
    .sort((a, b) => (b.tarih ?? "").localeCompare(a.tarih ?? ""));

  return {
    musteri_adi: modulValues.companyName.trim() || "Müşteri",
    firsatlar,
    notlar,
  };
};
