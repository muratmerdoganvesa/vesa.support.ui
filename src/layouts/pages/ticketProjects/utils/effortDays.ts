export type EffortSummary = {
  totalDays: number;
  hasAnyEffort: boolean;
};

const roundEffort = (value: number) => Math.round(value * 100) / 100;

export const formatEffortDays = (days: number | null | undefined): string => {
  if (days == null || Number.isNaN(Number(days))) return "—";
  return Number(days).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
};

export const summarizeSubProjectEffort = (
  items: Array<{ effortDuration?: number | null }>,
): EffortSummary => {
  const totalDays = roundEffort(
    items.reduce((sum, item) => sum + (Number(item.effortDuration) || 0), 0),
  );
  const hasAnyEffort = items.some((item) => Number(item.effortDuration) > 0);

  return { totalDays, hasAnyEffort };
};
