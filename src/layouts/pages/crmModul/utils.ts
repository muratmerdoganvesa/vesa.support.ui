import { format, isValid, parseISO, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { CrmModulDto, ListModuleDto } from "api/generated";

export const formatDateTr = (value?: string | null): string => {  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return "—";
  return format(date, "dd.MM.yyyy", { locale: tr });
};

export const toIsoDateString = (date?: Date): string | null => {
  if (!date || !isValid(date)) return null;
  return format(date, "yyyy-MM-dd");
};

export const parseIsoDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

export const resolvePartnerCompanyName = (row: CrmModulDto): string =>
  row.partnerCompanyName?.trim() || "—";

export const formatSolutionModuleNames = (names?: string[] | null): string => {
  if (!names?.length) return "—";
  return names.join(", ");
};

export const mergeActiveModulesWithSelected = (
  activeModules: ListModuleDto[],
  crmData?: CrmModulDto | null
): ListModuleDto[] => {
  const merged = new Map<string, ListModuleDto>();

  activeModules.forEach((module) => {
    if (module.id) {
      merged.set(module.id, module);
    }
  });

  const selectedIds = crmData?.solutionModuleIds ?? [];
  const selectedNames = crmData?.solutionModuleNames ?? [];

  selectedIds.forEach((id, index) => {
    if (!id || merged.has(id)) return;
    merged.set(id, {
      id,
      name: selectedNames[index] ?? id,
      isActive: false,
    });
  });

  return Array.from(merged.values()).sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", "tr")
  );
};

export const isDateInRange = (  value?: string | null,
  from?: Date,
  to?: Date
): boolean => {
  if (!from && !to) return true;
  if (!value) return false;
  const date = startOfDay(parseISO(value));
  if (!isValid(date)) return false;
  if (from && date < startOfDay(from)) return false;
  if (to && date > startOfDay(to)) return false;
  return true;
};

/** Rakamları normalize eder (max 11 hane, başında 0). */
export const stripPhoneDigits = (value: string): string => {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.length > 0 && !digits.startsWith("0")) {
    digits = `0${digits}`;
  }

  return digits.slice(0, 11);
};

/** Türkiye cep formatı: 0(506)-613-30-89 */
export const formatPhoneNumberTr = (value: string): string => {
  const d = stripPhoneDigits(value);
  if (!d) return "";
  if (d.length === 1) return d;

  let formatted = `${d[0]}(${d.slice(1, Math.min(4, d.length))}`;
  if (d.length < 4) return formatted;

  formatted = `${d[0]}(${d.slice(1, 4)})`;
  if (d.length <= 4) return formatted;

  formatted += `-${d.slice(4, Math.min(7, d.length))}`;
  if (d.length <= 7) return formatted;

  formatted += `-${d.slice(7, Math.min(9, d.length))}`;
  if (d.length <= 9) return formatted;

  formatted += `-${d.slice(9, 11)}`;
  return formatted;
};
