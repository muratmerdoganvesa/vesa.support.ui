import axios from "axios";
import { axiosInstance } from "utils/axiosInstance";

export type ActivityV2FieldKey =
  | "ticketId"
  | "customerTicketNumber"
  | "ticketProjectId"
  | "referenceEmployeeId"
  | "requestedCustomerName"
  | "billableHour"
  | "effortLocation"
  | "description"
  | "activityHour";

export type ActivityV2FieldRuleState = {
  visible: boolean;
  required: boolean;
};

export type ActivityV2FieldRuleJson = {
  version: 1;
  fields: Partial<Record<ActivityV2FieldKey, ActivityV2FieldRuleState>>;
};

export type ActivityFieldRuleDto = {
  id: string;
  ticketProjectId: string;
  ticketProjectName?: string;
  subProjectName?: string;
  workCompanyId?: string;
  workCompanyName?: string;
  projectSupportType?: number | null;
  projectSupportTypeName?: string;
  isActive: boolean;
  name?: string;
  description?: string;
  ruleJson: string;
  createdDate?: string;
  updatedDate?: string;
};

export type ActivityFieldRulePayload = {
  ticketProjectId: string;
  isActive: boolean;
  name?: string;
  description?: string;
  ruleJson: string;
};

export const ACTIVITY_V2_ALWAYS_REQUIRED_FIELD_KEYS = [
  "effortLocation",
  "description",
  "activityHour",
  "billableHour",
] as const satisfies readonly ActivityV2FieldKey[];

export const ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS: readonly ActivityV2FieldKey[] = [
  "ticketId",
  "requestedCustomerName",
  "customerTicketNumber",
  "referenceEmployeeId",
] as const;

export const ACTIVITY_V2_FIELD_LABELS: Record<ActivityV2FieldKey, string> = {
  ticketId: "Talep ID",
  customerTicketNumber: "Müşteri ticket no",
  ticketProjectId: "Proje",
  referenceEmployeeId: "Referans personel",
  requestedCustomerName: "Talep eden",
  billableHour: "Faturalanabilir saat",
  effortLocation: "Çalışma yeri",
  description: "Açıklama",
  activityHour: "Aktivite saati",
};

export const EMPTY_RULE_JSON: ActivityV2FieldRuleJson = {
  version: 1,
  fields: {},
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const unwrapList = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const nested = asRecord(data).data ?? asRecord(data).Data;
  return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
};

const unwrapItem = (data: unknown): Record<string, unknown> => {
  if (!data || typeof data !== "object") return {};
  const rec = data as Record<string, unknown>;
  const nested = rec.data ?? rec.Data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return rec;
};

export const parseRuleJson = (raw: string | Record<string, unknown>): ActivityV2FieldRuleJson => {
  try {
    const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_RULE_JSON };
    const fields = (parsed as { fields?: unknown }).fields;
    return {
      version: 1,
      fields:
        fields && typeof fields === "object"
          ? (fields as ActivityV2FieldRuleJson["fields"])
          : {},
    };
  } catch {
    return { ...EMPTY_RULE_JSON };
  }
};

export const stringifyRuleJson = (rule: ActivityV2FieldRuleJson): string =>
  JSON.stringify({ version: 1, fields: rule.fields ?? {} });

export const buildDefaultFieldState = (): Record<ActivityV2FieldKey, ActivityV2FieldRuleState> => {
  const state = {} as Record<ActivityV2FieldKey, ActivityV2FieldRuleState>;
  for (const key of ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS) {
    state[key] = { visible: true, required: false };
  }
  for (const key of ACTIVITY_V2_ALWAYS_REQUIRED_FIELD_KEYS) {
    state[key] = { visible: true, required: true };
  }
  return state;
};

export const mergeFieldStates = (
  ruleJson: ActivityV2FieldRuleJson,
): Record<ActivityV2FieldKey, ActivityV2FieldRuleState> => {
  const base = buildDefaultFieldState();
  for (const key of ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS) {
    const override = ruleJson.fields?.[key];
    if (!override) continue;
    base[key] = {
      visible: override.visible !== false,
      required: Boolean(override.required) && override.visible !== false,
    };
  }
  for (const key of ACTIVITY_V2_ALWAYS_REQUIRED_FIELD_KEYS) {
    base[key] = { visible: true, required: true };
  }
  return base;
};

export const toggleFieldState = (
  prev: Record<ActivityV2FieldKey, ActivityV2FieldRuleState>,
  key: ActivityV2FieldKey,
  prop: keyof ActivityV2FieldRuleState,
  value: boolean,
): Record<ActivityV2FieldKey, ActivityV2FieldRuleState> => {
  const next = { ...prev, [key]: { ...prev[key], [prop]: value } };
  if (prop === "visible" && !value) {
    next[key] = { visible: false, required: false };
  }
  return next;
};

export const buildRuleJsonFromStates = (
  states: Record<ActivityV2FieldKey, ActivityV2FieldRuleState>,
): string => {
  const fields: Partial<Record<ActivityV2FieldKey, ActivityV2FieldRuleState>> = {};
  for (const key of ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS) {
    const state = states[key];
    if (!state.visible || state.required) {
      fields[key] = { visible: state.visible, required: state.required };
    }
  }
  return stringifyRuleJson({ version: 1, fields });
};

export const normalizeActivityFieldRule = (
  item: Record<string, unknown>,
): ActivityFieldRuleDto => {
  const rawJson = item.ruleJson ?? item.RuleJson ?? "";
  const ruleJson = typeof rawJson === "string" ? rawJson : JSON.stringify(rawJson ?? {});
  const workCompanyId = item.workCompanyId ?? item.WorkCompanyId;
  const projectSupportType = item.projectSupportType ?? item.ProjectSupportType;

  return {
    id: String(item.id ?? item.Id ?? ""),
    ticketProjectId: String(item.ticketProjectId ?? item.TicketProjectId ?? ""),
    ticketProjectName: (item.ticketProjectName ?? item.TicketProjectName) as string | undefined,
    subProjectName: (item.subProjectName ?? item.SubProjectName) as string | undefined,
    workCompanyId: workCompanyId ? String(workCompanyId) : undefined,
    workCompanyName: (item.workCompanyName ?? item.WorkCompanyName) as string | undefined,
    projectSupportType:
      projectSupportType == null || projectSupportType === "" ? null : Number(projectSupportType),
    projectSupportTypeName: (item.projectSupportTypeName ?? item.ProjectSupportTypeName) as
      | string
      | undefined,
    isActive: Boolean(item.isActive ?? item.IsActive),
    name: (item.name ?? item.Name) as string | undefined,
    description: (item.description ?? item.Description) as string | undefined,
    ruleJson,
    createdDate: (item.createdDate ?? item.CreatedDate) as string | undefined,
    updatedDate: (item.updatedDate ?? item.UpdatedDate) as string | undefined,
  };
};

export const getActivityFieldRuleApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const errors = rec.errors ?? rec.Errors;
    if (Array.isArray(errors) && errors[0]) return String(errors[0]);
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (typeof rec.title === "string" && rec.title.trim()) return rec.title;
  }
  return fallback;
};

export const fetchActivityFieldRules = async (): Promise<ActivityFieldRuleDto[]> => {
  const response = await axiosInstance.get<unknown>("/api/v2/activity-field-rules");
  return unwrapList(response.data).map(normalizeActivityFieldRule);
};

export const fetchActivityFieldRuleByProject = async (
  ticketProjectId: string,
): Promise<ActivityFieldRuleDto | null> => {
  if (!ticketProjectId) return null;

  try {
    const rules = await fetchActivityFieldRules();
    return rules.find((rule) => rule.ticketProjectId === ticketProjectId) ?? null;
  } catch {
    // Liste erişimi yoksa yalnızca bu projenin aktif kuralına bak.
  }

  try {
    const response = await axiosInstance.get<unknown>(
      `/api/v2/activity-field-rules/for-project/${ticketProjectId}`,
    );
    return normalizeActivityFieldRule(unwrapItem(response.data));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
};

export const createActivityFieldRule = async (
  payload: ActivityFieldRulePayload,
): Promise<ActivityFieldRuleDto> => {
  const response = await axiosInstance.post<unknown>("/api/v2/activity-field-rules", {
    ticketProjectId: payload.ticketProjectId,
    isActive: payload.isActive,
    name: payload.name,
    description: payload.description,
    ruleJson: payload.ruleJson,
  });
  return normalizeActivityFieldRule(unwrapItem(response.data));
};

export const updateActivityFieldRule = async (
  id: string,
  payload: ActivityFieldRulePayload,
): Promise<ActivityFieldRuleDto> => {
  const response = await axiosInstance.put<unknown>(`/api/v2/activity-field-rules/${id}`, {
    id,
    ticketProjectId: payload.ticketProjectId,
    isActive: payload.isActive,
    name: payload.name,
    description: payload.description,
    ruleJson: payload.ruleJson,
  });
  return normalizeActivityFieldRule(unwrapItem(response.data));
};

export const deleteActivityFieldRule = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/v2/activity-field-rules/${id}`);
};
