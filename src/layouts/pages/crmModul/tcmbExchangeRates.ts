import { CurrencyType } from "api/generated";

export type TcmbExchangeRates = {
  eurTry: number;
  usdTry: number;
  fetchedAt: Date;
};

const TCMB_TODAY_XML_PATH = "/tcmb-kurlar/today.xml";

const parseForexBuying = (xmlText: string, currencyCode: string): number => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const currencies = Array.from(doc.querySelectorAll("Currency"));
  for (const currency of currencies) {
    const kod =
      currency.getAttribute("Kod") ?? currency.getAttribute("CurrencyCode") ?? "";
    if (kod !== currencyCode) continue;

    const unit = Number(currency.querySelector("Unit")?.textContent ?? "1");
    const forexBuying = Number(
      (currency.querySelector("ForexBuying")?.textContent ?? "").replace(",", ".")
    );

    if (!Number.isFinite(forexBuying) || forexBuying <= 0 || unit <= 0) {
      throw new Error(`${currencyCode} kuru geçersiz`);
    }

    return forexBuying / unit;
  }

  throw new Error(`${currencyCode} kuru bulunamadı`);
};

export const fetchTcmbExchangeRates = async (): Promise<TcmbExchangeRates> => {
  const response = await fetch(TCMB_TODAY_XML_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("TCMB kurları alınamadı");
  }

  const xmlText = await response.text();
  return {
    eurTry: parseForexBuying(xmlText, "EUR"),
    usdTry: parseForexBuying(xmlText, "USD"),
    fetchedAt: new Date(),
  };
};

export const convertAmountToEur = (
  amount: number,
  currency: CurrencyType,
  rates: TcmbExchangeRates
): number | null => {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  switch (currency) {
    case CurrencyType.NUMBER_1:
      return amount / rates.eurTry;
    case CurrencyType.NUMBER_2:
      return (amount * rates.usdTry) / rates.eurTry;
    case CurrencyType.NUMBER_3:
      return amount;
    default:
      return null;
  }
};

export const convertCurrencyTotalsToEur = (
  totals: { try: number; usd: number; eur: number },
  rates: TcmbExchangeRates
): number => {
  const tryInEur = totals.try / rates.eurTry;
  const usdInEur = (totals.usd * rates.usdTry) / rates.eurTry;
  return tryInEur + usdInEur + totals.eur;
};

export const formatEurRounded = (amount: number): string =>
  `€${Math.round(amount).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export const formatTryRate = (tryPerUnit: number): string =>
  tryPerUnit.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

export const getEurConversionRateLabel = (
  currency: CurrencyType,
  rates: TcmbExchangeRates
): string | null => {
  switch (currency) {
    case CurrencyType.NUMBER_1:
      return `1 € = ${formatTryRate(rates.eurTry)} ₺`;
    case CurrencyType.NUMBER_2:
      return `1 $ = ${formatTryRate(rates.usdTry)} ₺`;
    default:
      return null;
  }
};
