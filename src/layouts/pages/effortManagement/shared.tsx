import type { ReactNode } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "lib/utils";
import { effortStatusClassName } from "./types";

/** Kurumsal vurgu rengi — efor yönetimi modülü */
export const EFFORT_BRAND = {
  primary: "#3e5d8f",
  primaryHover: "#324d7a",
  soft: "rgba(62, 93, 143, 0.08)",
  ring: "rgba(62, 93, 143, 0.18)",
} as const;

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd MMM yyyy HH:mm", { locale: tr });
};

/** Fatura/fiili girişleri saat tutulur; müşteriye gösterimde 1 adam gün = 8 saat. */
export const HOURS_PER_MAN_DAY = 8;

export const formatHours = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
};

export const hoursToManDays = (hours?: number | null): number | null => {
  if (hours === null || hours === undefined || Number.isNaN(Number(hours))) return null;
  return Number(hours) / HOURS_PER_MAN_DAY;
};

export const formatManDays = (hours?: number | null): string => {
  const manDays = hoursToManDays(hours);
  if (manDays === null) return "—";
  return manDays.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

export const EffortStatusBadge = ({
  status,
  label,
  size = "default",
}: {
  status?: number | null;
  label?: string | null;
  size?: "default" | "lg";
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
      size === "lg" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]",
      effortStatusClassName(status)
    )}
  >
    {label || "—"}
  </span>
);

export const EffortPageShell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <main
    className={cn(
      "flex min-h-[calc(100vh-6rem)] flex-col gap-5 bg-gradient-to-b from-slate-50/80 via-slate-50/40 to-transparent px-4 py-6 md:gap-6 md:px-6",
      className
    )}
  >
    {children}
  </main>
);

export const EffortPageHeader = ({
  icon,
  title,
  description,
  actions,
  breadcrumb,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 space-y-2">
      {breadcrumb}
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: EFFORT_BRAND.primary, boxShadow: `0 4px 14px ${EFFORT_BRAND.ring}` }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-800 md:text-2xl">{title}</h1>
          {description && <div className="mt-1 text-sm leading-relaxed text-slate-500">{description}</div>}
        </div>
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

type StatTone = "default" | "amber" | "sky" | "emerald" | "rose" | "brand";

const statToneClasses: Record<StatTone, { wrap: string; value: string; icon: string }> = {
  default: {
    wrap: "border-slate-100 bg-white",
    value: "text-slate-800",
    icon: "bg-slate-100 text-slate-500",
  },
  amber: {
    wrap: "border-amber-100 bg-amber-50/40",
    value: "text-amber-800",
    icon: "bg-amber-100 text-amber-600",
  },
  sky: {
    wrap: "border-sky-100 bg-sky-50/40",
    value: "text-sky-800",
    icon: "bg-sky-100 text-sky-600",
  },
  emerald: {
    wrap: "border-emerald-100 bg-emerald-50/40",
    value: "text-emerald-800",
    icon: "bg-emerald-100 text-emerald-600",
  },
  rose: {
    wrap: "border-rose-100 bg-rose-50/40",
    value: "text-rose-800",
    icon: "bg-rose-100 text-rose-600",
  },
  brand: {
    wrap: "border-[#3e5d8f]/15 bg-[#3e5d8f]/[0.04]",
    value: "text-[#3e5d8f]",
    icon: "bg-[#3e5d8f]/10 text-[#3e5d8f]",
  },
};

export const EffortStatCard = ({
  label,
  value,
  icon,
  tone = "default",
  active,
  onClick,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: StatTone;
  active?: boolean;
  onClick?: () => void;
  hint?: string;
}) => {
  const tones = statToneClasses[tone];
  const interactive = Boolean(onClick);
  const Comp = interactive ? "button" : "div";

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-pressed={interactive ? active : undefined}
      aria-label={hint ? `${label}: ${value}. ${hint}` : `${label}: ${value}`}
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-sm shadow-slate-100/80 transition-all",
        tones.wrap,
        interactive && "cursor-pointer hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e5d8f]/30",
        active && "ring-2 ring-[#3e5d8f]/35 shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {icon && (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tones.icon)}>{icon}</span>
        )}
      </div>
      <span className={cn("text-2xl font-bold tracking-tight tabular-nums", tones.value)}>{value}</span>
    </Comp>
  );
};

export const EffortSectionCard = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  accentBar,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  accentBar?: boolean;
}) => (
  <section
    className={cn(
      "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40",
      className
    )}
  >
    {accentBar && (
      <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />
    )}
    {(title || actions) && (
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold tracking-tight text-slate-800">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={cn(bodyClassName)}>{children}</div>
  </section>
);

export const EffortInfoItem = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number | null;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    {children ?? <span className="text-sm font-medium text-slate-800 break-words">{value || "—"}</span>}
  </div>
);

export const EffortAlert = ({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) => {
  const styles = {
    error: "border-rose-100 bg-rose-50 text-rose-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    info: "border-sky-100 bg-sky-50 text-sky-800",
    warning: "border-amber-100 bg-amber-50 text-amber-800",
  } as const;

  return (
    <div
      role="alert"
      className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", styles[tone])}
    >
      {children}
    </div>
  );
};

export const EffortEmptyState = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-400">{description}</p>}
    </div>
  </div>
);

export const effortPrimaryButtonClass =
  "h-10 rounded-xl bg-[#3e5d8f] px-5 text-white shadow-sm shadow-[#3e5d8f]/20 hover:bg-[#324d7a] focus-visible:ring-[#3e5d8f]/30";

export const effortSecondaryButtonClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 focus-visible:ring-[#3e5d8f]/20";

export const effortFieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/15";
