import { CurrencyType } from "api/generated";
import {
  convertAmountToEur,
  formatEurRounded,
  getEurConversionRateLabel,
  type TcmbExchangeRates,
} from "../tcmbExchangeRates";

type CurrencyEuroConversionProps = {
  amount: number;
  currencyType: CurrencyType;
  rates: TcmbExchangeRates | null;
  className?: string;
  align?: "left" | "right";
};

export const CurrencyEuroConversion = ({
  amount,
  currencyType,
  rates,
  className = "",
  align = "right",
}: CurrencyEuroConversionProps) => {
  if (!rates) return null;

  const eurAmount = convertAmountToEur(amount, currencyType, rates);
  const rateLabel = getEurConversionRateLabel(currencyType, rates);

  if (eurAmount == null || rateLabel == null) return null;

  return (
    <div
      className={`${align === "right" ? "text-right" : "text-left"} ${className}`.trim()}
      aria-label={`Euro karşılığı ${formatEurRounded(eurAmount)}`}
    >
      <p className="text-[10px] text-slate-400 tabular-nums leading-tight">kur: {rateLabel}</p>
      <p className="text-sm font-semibold text-teal-800 tabular-nums leading-snug">
        {formatEurRounded(eurAmount)}
      </p>
    </div>
  );
};
