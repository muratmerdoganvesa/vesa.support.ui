import { ProjectSupportTypes } from "api/generated";

export const ProjectSupportType = {
  Project: ProjectSupportTypes.NUMBER_1,
  CR: ProjectSupportTypes.NUMBER_2,
  Support: ProjectSupportTypes.NUMBER_3,
} as const;

const PROJECT_SUPPORT_TYPE_LABEL_BY_VALUE: Record<ProjectSupportTypes, string> = {
  [ProjectSupportTypes.NUMBER_1]: "Proje",
  [ProjectSupportTypes.NUMBER_2]: "CR",
  [ProjectSupportTypes.NUMBER_3]: "Destek",
};

export const projectSupportTypeOptions = [
  { label: "Proje", value: ProjectSupportTypes.NUMBER_1 },
  { label: "CR", value: ProjectSupportTypes.NUMBER_2 },
  { label: "Destek", value: ProjectSupportTypes.NUMBER_3 },
] as const;

export const subProjectSupportTypeOptions = [
  { label: "Proje", value: ProjectSupportTypes.NUMBER_1 },
  { label: "Ek kapsam", value: ProjectSupportTypes.NUMBER_2 },
] as const;

export const normalizeProjectSupportType = (
  value?: ProjectSupportTypes | null,
): ProjectSupportTypes => value ?? ProjectSupportTypes.NUMBER_1;

export const getProjectSupportTypeLabel = (value?: ProjectSupportTypes | null): string => {
  const type = normalizeProjectSupportType(value);
  return PROJECT_SUPPORT_TYPE_LABEL_BY_VALUE[type] ?? PROJECT_SUPPORT_TYPE_LABEL_BY_VALUE[ProjectSupportTypes.NUMBER_1];
};

export const getSubProjectSupportTypeLabel = (value?: ProjectSupportTypes | null): string => {
  const type = normalizeProjectSupportType(value);
  if (type === ProjectSupportTypes.NUMBER_2) return "Ek kapsam";
  return getProjectSupportTypeLabel(type);
};

export const isAllowedSubProjectSupportType = (
  value?: ProjectSupportTypes | null,
): boolean => {
  const type = normalizeProjectSupportType(value);
  return type === ProjectSupportTypes.NUMBER_1 || type === ProjectSupportTypes.NUMBER_2;
};

export const resolveSubProjectSupportType = (
  value?: ProjectSupportTypes | null,
): ProjectSupportTypes => {
  const type = normalizeProjectSupportType(value);
  return isAllowedSubProjectSupportType(type) ? type : ProjectSupportTypes.NUMBER_1;
};

export const isStandardProjectSupportType = (
  value?: ProjectSupportTypes | null,
): boolean => normalizeProjectSupportType(value) === ProjectSupportTypes.NUMBER_1;

export const matchesProjectSupportType = (
  left?: ProjectSupportTypes | null,
  right?: ProjectSupportTypes | null,
): boolean => normalizeProjectSupportType(left) === normalizeProjectSupportType(right);

export const getProjectSupportTypeBadgeClass = (value?: ProjectSupportTypes | null): string => {
  const type = normalizeProjectSupportType(value);
  if (type === ProjectSupportTypes.NUMBER_2) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300";
  }
  if (type === ProjectSupportTypes.NUMBER_3) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
};
