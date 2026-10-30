import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "lib/utils";
import { effortStatusClassName } from "./types";

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd MMM yyyy HH:mm", { locale: tr });
};

export const formatHours = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
};

export const EffortStatusBadge = ({
  status,
  label,
}: {
  status?: number | null;
  label?: string | null;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
      effortStatusClassName(status)
    )}
  >
    {label || "—"}
  </span>
);
