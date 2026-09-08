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

export const getProjectSupportTypeLabel = (value?: ProjectSupportTypes | null): string => {
  if (value == null) return PROJECT_SUPPORT_TYPE_LABEL_BY_VALUE[ProjectSupportTypes.NUMBER_1];
  return PROJECT_SUPPORT_TYPE_LABEL_BY_VALUE[value] ?? PROJECT_SUPPORT_TYPE_LABEL_BY_VALUE[ProjectSupportTypes.NUMBER_1];
};

export const isStandardProjectSupportType = (
  value?: ProjectSupportTypes | null,
): boolean => (value ?? ProjectSupportTypes.NUMBER_1) === ProjectSupportTypes.NUMBER_1;

export const getProjectSupportTypeBadgeClass = (value?: ProjectSupportTypes | null): string => {
  const type = value ?? ProjectSupportTypes.NUMBER_1;
  if (type === ProjectSupportTypes.NUMBER_2) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300";
  }
  if (type === ProjectSupportTypes.NUMBER_3) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
};
