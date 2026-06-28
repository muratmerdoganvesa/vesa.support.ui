import { ProjectTypes } from "api/generated";

export const UNASSIGNED_PROJECT_TYPE_KEY = "__unassigned__" as const;

export type ProjectTypeColumnKey = typeof UNASSIGNED_PROJECT_TYPE_KEY | ProjectTypes;

const PROJECT_TYPE_LABEL_BY_VALUE: Record<ProjectTypes, string> = {
  [ProjectTypes.NUMBER_1]: "Backlog",
  [ProjectTypes.NUMBER_2]: "Realization",
  [ProjectTypes.NUMBER_3]: "UAT",
  [ProjectTypes.NUMBER_4]: "Preparation",
  [ProjectTypes.NUMBER_5]: "DONE",
};

const PROJECT_TYPE_ORDER: ProjectTypes[] = [
  ProjectTypes.NUMBER_1,
  ProjectTypes.NUMBER_2,
  ProjectTypes.NUMBER_3,
  ProjectTypes.NUMBER_4,
  ProjectTypes.NUMBER_5,
];

export type ProjectTypeColumnDef = {
  key: ProjectTypeColumnKey;
  label: string;
  projectType: ProjectTypes | null;
};

export const getProjectTypeLabel = (value?: ProjectTypes | null): string => {
  if (value == null) return "—";
  return PROJECT_TYPE_LABEL_BY_VALUE[value] ?? "—";
};

export const getProjectStatusLabel = getProjectTypeLabel;

export const projectTypeOptions = PROJECT_TYPE_ORDER.map((value) => ({
  label: PROJECT_TYPE_LABEL_BY_VALUE[value],
  value,
}));

/** Enum sırasına göre kolon tanımları; başta atanmamış projeler. */
export const getProjectTypeColumns = (): ProjectTypeColumnDef[] => [
  { key: UNASSIGNED_PROJECT_TYPE_KEY, label: "Seçilmeyenler", projectType: null },
  ...PROJECT_TYPE_ORDER.map((value) => ({
    key: value,
    label: PROJECT_TYPE_LABEL_BY_VALUE[value],
    projectType: value,
  })),
];

export const getProjectColumnKey = (
  projectStatus?: ProjectTypes | null,
): ProjectTypeColumnKey =>
  projectStatus == null ? UNASSIGNED_PROJECT_TYPE_KEY : projectStatus;

/** Kanban kolon renkleri ile uyumlu */
export const PROJECT_TYPE_COLUMN_COLORS: Record<
  string,
  { header: string; badge: string; dot: string; cardBorder: string; tab: string }
> = {
  Seçilmeyenler: {
    header: "border-t-slate-300",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    cardBorder: "border-l-slate-300",
    tab: "text-slate-600 border-slate-400",
  },
  Backlog: {
    header: "border-t-slate-400",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    cardBorder: "border-l-slate-400",
    tab: "text-slate-600 border-slate-400",
  },
  Realization: {
    header: "border-t-blue-500",
    badge: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    cardBorder: "border-l-blue-500",
    tab: "text-blue-600 border-blue-500",
  },
  UAT: {
    header: "border-t-violet-500",
    badge: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    cardBorder: "border-l-violet-500",
    tab: "text-violet-600 border-violet-500",
  },
  Preparation: {
    header: "border-t-amber-500",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    cardBorder: "border-l-amber-500",
    tab: "text-amber-600 border-amber-500",
  },
  DONE: {
    header: "border-t-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    cardBorder: "border-l-emerald-500",
    tab: "text-emerald-600 border-emerald-500",
  },
};

export const getProjectTypeColumnColors = (label: string) =>
  PROJECT_TYPE_COLUMN_COLORS[label] ?? PROJECT_TYPE_COLUMN_COLORS.Seçilmeyenler;
