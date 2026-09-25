export const PROJECT_TASK_CHECKLIST_FIELDS = [
  { key: "systemAccess", label: "Sisteme giriş sağlandı mı?" },
  { key: "conceptualApproval", label: "Kavramsal onay alındı mı?" },
  { key: "uatTestScenarios", label: "UAT test senaryoları müşteriye atıldı mı?" },
  { key: "masterDataTemplate", label: "Ana veri format müşteriye atıldı mı?" },
  { key: "authorization", label: "Yetkilendirme" },
  { key: "integration", label: "Entegrasyon çalışmaları" },
] as const;

export type ProjectTaskChecklistKey = (typeof PROJECT_TASK_CHECKLIST_FIELDS)[number]["key"];

export type ProjectTaskChecklistStatus = 1 | 2 | 3 | 4;

export type ProjectTaskChecklist = Record<
  ProjectTaskChecklistKey,
  ProjectTaskChecklistStatus | null
>;

const CHECKLIST_PASCAL_KEYS: Record<ProjectTaskChecklistKey, string> = {
  systemAccess: "SystemAccess",
  conceptualApproval: "ConceptualApproval",
  uatTestScenarios: "UATTestScenarios",
  masterDataTemplate: "MasterDataTemplate",
  authorization: "Authorization",
  integration: "Integration",
};

export const emptyProjectTaskChecklist = (): ProjectTaskChecklist => ({
  systemAccess: null,
  conceptualApproval: null,
  uatTestScenarios: null,
  masterDataTemplate: null,
  authorization: null,
  integration: null,
});

export const parseProjectTaskChecklistStatus = (
  raw: unknown,
): ProjectTaskChecklistStatus | null => {
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
};

export const readProjectTaskChecklist = (
  item: Record<string, unknown>,
): ProjectTaskChecklist => {
  const checklist = emptyProjectTaskChecklist();

  for (const field of PROJECT_TASK_CHECKLIST_FIELDS) {
    checklist[field.key] = parseProjectTaskChecklistStatus(
      item[field.key] ?? item[CHECKLIST_PASCAL_KEYS[field.key]],
    );
  }

  return checklist;
};

export const getProjectTaskStatusLabel = (
  value: ProjectTaskChecklistStatus | null | undefined,
): string => {
  switch (value) {
    case 1:
      return "Başlanmadı";
    case 2:
      return "Danışmanda Devam Ediyor";
    case 3:
      return "Müşteride Devam Ediyor";
    case 4:
      return "Tamamlandı";
    default:
      return "Seçilmedi";
  }
};

export const getProjectTaskStatusClass = (
  value: ProjectTaskChecklistStatus | null | undefined,
): string => {
  switch (value) {
    case 1:
      return "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400";
    case 2:
      return "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
    case 3:
      return "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
    case 4:
      return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    default:
      return "bg-slate-50 text-slate-400 dark:bg-muted dark:text-muted-foreground";
  }
};
