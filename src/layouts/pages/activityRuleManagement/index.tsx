import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Switch } from "components/ui/switch";
import { Checkbox } from "components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  ActivityCenterRuleInputValueKind,
  ActivityCenterRulesApi,
  ActivityCenterRuleType,
  ActivityCenterRuleTypeDefinitionDto,
  ActivityRuleListDto,
  EnumOptionDto,
  TicketProjectsApi,
  WorkCompanyApi,
} from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { ActivityFieldCombobox, toComboOptions } from "../activity-center/field-combobox";

type RuleType = "quota" | "requestIdMandatory" | "activityExemption" | "approvalFlow";
type ApprovalMode = "projectBased" | "customerBased";
type QuotaScope = "project" | "request";

type RuleRecord = {
  id: string;
  name: string;
  type: RuleType;
  ruleTypeKey?: string;
  rawRuleType?: string;
  description?: string;
  isActive: boolean;
  quotaScope?: QuotaScope;
  quotaTarget?: string;
  quotaDayLimit?: number;
  mandatoryCustomerIds?: string[];
  exemptUserIds?: string[];
  noActivityEntryRequired?: boolean;
  excludeFromReminderMails?: boolean;
  approvalMode?: ApprovalMode;
  approvalStartMessage?: string;
  /** Adım 2 dinamik alanlar (RuleTypeDefinitions) */
  ruleParameters?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type RuleFormState = {
  id?: string;
  ruleTypeKey: string;
  type: RuleType;
  description: string;
  isActive: boolean;
  quotaScope: QuotaScope;
  quotaTarget: string;
  quotaDayLimit: string;
  mandatoryCustomerIds: string[];
  exemptUserIds: string[];
  noActivityEntryRequired: boolean;
  excludeFromReminderMails: boolean;
  approvalMode: ApprovalMode;
  approvalStartMessage: string;
};

const mockCustomers = [
  { id: "c-1", name: "ABC Holding" },
  { id: "c-2", name: "Nova Teknoloji" },
  { id: "c-3", name: "Luna Enerji" },
  { id: "c-4", name: "Mavi Lojistik" },
];

const mockUsers = [
  { id: "u-1", fullName: "Ayse Kaya" },
  { id: "u-2", fullName: "Mehmet Demir" },
  { id: "u-3", fullName: "Elif Aslan" },
  { id: "u-4", fullName: "Burak Sen" },
];

const initialRules: RuleRecord[] = [
  {
    id: "r-1",
    name: "Proje Adam/Gün Kotası - ERP Geçiş",
    type: "quota",
    isActive: true,
    quotaScope: "project",
    quotaTarget: "ERP Gecis Projesi",
    quotaDayLimit: 40,
    createdAt: "2026-05-08 09:10",
    updatedAt: "2026-05-08 09:10",
  },
  {
    id: "r-2",
    name: "Talep ID Zorunlu Müşteriler",
    type: "requestIdMandatory",
    isActive: true,
    mandatoryCustomerIds: ["c-1", "c-3"],
    createdAt: "2026-05-08 09:18",
    updatedAt: "2026-05-08 09:18",
  },
  {
    id: "r-3",
    name: "Aktivite Muaf Kullanici Listesi",
    type: "activityExemption",
    isActive: true,
    exemptUserIds: ["u-2", "u-4"],
    noActivityEntryRequired: true,
    excludeFromReminderMails: true,
    createdAt: "2026-05-08 09:24",
    updatedAt: "2026-05-08 09:24",
  },
  {
    id: "r-4",
    name: "Onay Akışı Seçimi",
    type: "approvalFlow",
    isActive: true,
    approvalMode: "projectBased",
    approvalStartMessage: "Seçilen moda göre otomatik onay süreci başlatılır.",
    createdAt: "2026-05-08 09:30",
    updatedAt: "2026-05-08 09:30",
  },
];

const createDefaultForm = (): RuleFormState => ({
  ruleTypeKey: "",
  type: "quota",
  description: "",
  isActive: true,
  quotaScope: "project",
  quotaTarget: "",
  quotaDayLimit: "",
  mandatoryCustomerIds: [],
  exemptUserIds: [],
  noActivityEntryRequired: true,
  excludeFromReminderMails: true,
  approvalMode: "projectBased",
  approvalStartMessage: "Seçilen moda göre otomatik onay süreci başlatılır.",
});

const getRuleTypeLabel = (type: RuleType) => {
  if (type === "quota") return "Adam/Gün Kotası";
  if (type === "requestIdMandatory") return "Talep ID Zorunluluğu";
  if (type === "activityExemption") return "Aktivite Muafiyeti";
  return "Onay Süreci Seçimi";
};

const formatDateToDisplay = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}.${month}.${year}`;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}.${match[2]}.${match[1]}`;
};

const truncateText = (value: string, limit: number) => {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

const normalizeRuleType = (value?: string | number | null, description?: string | null): RuleType => {
  const keyAsNumber = Number(value);
  if (keyAsNumber === 1 || keyAsNumber === 2) return "quota";
  if (keyAsNumber === 3 || keyAsNumber === 4) return "requestIdMandatory";
  if (keyAsNumber === 5 || keyAsNumber === 6) return "approvalFlow";
  if (keyAsNumber === 7 || keyAsNumber === 8) return "activityExemption";

  const normalized = `${value ?? ""} ${description ?? ""}`.toLowerCase();
  if (normalized.includes("quota") || normalized.includes("kota")) return "quota";
  if (
    normalized.includes("requestid") ||
    normalized.includes("request_id") ||
    normalized.includes("talep")
  ) {
    return "requestIdMandatory";
  }
  if (
    normalized.includes("exemption") ||
    normalized.includes("muaf") ||
    normalized.includes("reminder")
  ) {
    return "activityExemption";
  }

  if (normalized.includes("approval") || normalized.includes("onay")) return "approvalFlow";
  return "quota";
};

const parseRuleTypeKeyToApi = (ruleTypeKey: string): ActivityCenterRuleType | undefined => {
  const n = Number(ruleTypeKey);
  if (!Number.isFinite(n)) return undefined;
  const allowed = Object.values(ActivityCenterRuleType) as ActivityCenterRuleType[];
  return allowed.includes(n as ActivityCenterRuleType) ? (n as ActivityCenterRuleType) : undefined;
};

const getDefinitionFieldKey = (def: ActivityCenterRuleTypeDefinitionDto, index: number): string => {
  const prop = def.inputPropertyName?.trim();
  if (prop) return prop;
  const display = def.displayName?.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "") ?? "";
  if (display) return display;
  return `rule_field_${def.ruleType ?? "x"}_${index}`;
};

/** Backend yalnızca kota alanı döndürdüğünde seçim alanını bu anahtarlarla saklarız. */
const SYNTHETIC_PROJECT_BASED_PROJECT_FIELD_KEY = "TicketProjectId";
const SYNTHETIC_REQUEST_BASED_TICKET_FIELD_KEY = "TicketId";
const SYNTHETIC_CUSTOMER_BASED_WORK_COMPANY_FIELD_KEY = "WorkCompanyId";

/** Backend `ActivityCenterRuleTypeDefinitionDto.ruleTypeName` — özel alan setleri. */
const RULE_TYPE_NAME_PROJECT_BASED_MAN_DAY_QUOTA = "ProjectBasedManDayQuota";
const RULE_TYPE_NAME_REQUEST_BASED_MAN_DAY_QUOTA = "RequestBasedManDayQuota";
const RULE_TYPE_NAME_CUSTOMER_BASED_REQUEST_ID_REQUIREMENT = "CustomerBasedRequestIdRequirement";

/** `inputPropertyName` ile belirlenen alanlar (backend’e göre genişletilebilir). */
const DOUBLE_INPUT_PROPERTY_NAMES = new Set<string>(["ManDayQuota", "MaxManDayQuota", "QuotaValue"]);

const isDoubleInputProperty = (inputPropertyName?: string | null) => {
  const name = inputPropertyName?.trim();
  if (!name) return false;
  return DOUBLE_INPUT_PROPERTY_NAMES.has(name);
};

const isProjectBasedManDayQuotaDefinition = (def: ActivityCenterRuleTypeDefinitionDto) =>
  (def.ruleTypeName?.trim() ?? "") === RULE_TYPE_NAME_PROJECT_BASED_MAN_DAY_QUOTA;

const isProjectBasedManDayQuotaDecimalField = (def: ActivityCenterRuleTypeDefinitionDto) => {
  if (!isProjectBasedManDayQuotaDefinition(def)) return false;
  if (isDoubleInputProperty(def.inputPropertyName)) return true;
  return def.inputValueKind === ActivityCenterRuleInputValueKind.NUMBER_2;
};

const isRequestBasedManDayQuotaDefinition = (def: ActivityCenterRuleTypeDefinitionDto) =>
  (def.ruleTypeName?.trim() ?? "") === RULE_TYPE_NAME_REQUEST_BASED_MAN_DAY_QUOTA;

const isRequestBasedManDayQuotaDecimalField = (def: ActivityCenterRuleTypeDefinitionDto) => {
  if (!isRequestBasedManDayQuotaDefinition(def)) return false;
  if (isDoubleInputProperty(def.inputPropertyName)) return true;
  return def.inputValueKind === ActivityCenterRuleInputValueKind.NUMBER_2;
};

const isScopedManDayQuotaDefinition = (def: ActivityCenterRuleTypeDefinitionDto) =>
  isProjectBasedManDayQuotaDefinition(def) || isRequestBasedManDayQuotaDefinition(def);

const isScopedManDayQuotaDecimalField = (def: ActivityCenterRuleTypeDefinitionDto) =>
  isProjectBasedManDayQuotaDecimalField(def) || isRequestBasedManDayQuotaDecimalField(def);

const isCustomerBasedRequestIdRequirementDefinition = (def: ActivityCenterRuleTypeDefinitionDto) =>
  (def.ruleTypeName?.trim() ?? "") === RULE_TYPE_NAME_CUSTOMER_BASED_REQUEST_ID_REQUIREMENT;

/** Şirket combobox: bu kural tipinde boolean ve çok satırlı / sayısal alanlar dışındaki girişler. */
const isCustomerBasedRequestIdCompanyPickerField = (def: ActivityCenterRuleTypeDefinitionDto) => {
  if (!isCustomerBasedRequestIdRequirementDefinition(def)) return false;
  if (def.inputValueKind === ActivityCenterRuleInputValueKind.NUMBER_3) return false;
  if (def.inputValueKind === ActivityCenterRuleInputValueKind.NUMBER_4) return false;
  if (def.inputValueKind === ActivityCenterRuleInputValueKind.NUMBER_2) return false;
  return true;
};

function ActivityRuleManagement() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [ruleTypeOptions, setRuleTypeOptions] = useState<
    Array<{ value: string; label: string; type: RuleType }>
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<1 | 2>(1);
  const [formState, setFormState] = useState<RuleFormState>(createDefaultForm());
  const [ruleFieldDefinitions, setRuleFieldDefinitions] = useState<ActivityCenterRuleTypeDefinitionDto[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});
  const [activeProjectOptions, setActiveProjectOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [activeRuleTicketOptions, setActiveRuleTicketOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [workCompanyOptions, setWorkCompanyOptions] = useState<Array<{ id: string; label: string }>>([]);

  const needsCustomerBasedWorkCompanies = useMemo(
    () => ruleFieldDefinitions.some((def) => isCustomerBasedRequestIdRequirementDefinition(def)),
    [ruleFieldDefinitions],
  );

  const customerBasedRequestIdPickerFieldKey = useMemo(() => {
    const idx = ruleFieldDefinitions.findIndex((def) => isCustomerBasedRequestIdCompanyPickerField(def));
    if (idx >= 0) return getDefinitionFieldKey(ruleFieldDefinitions[idx], idx);
    if (ruleFieldDefinitions.some((def) => isCustomerBasedRequestIdRequirementDefinition(def))) {
      return SYNTHETIC_CUSTOMER_BASED_WORK_COMPANY_FIELD_KEY;
    }
    return null;
  }, [ruleFieldDefinitions]);

  const customerBasedRequestIdComboLabel = useMemo(() => {
    const idx = ruleFieldDefinitions.findIndex((def) => isCustomerBasedRequestIdCompanyPickerField(def));
    if (idx < 0) return "Şirket";
    const def = ruleFieldDefinitions[idx];
    return def.displayName?.trim() || def.inputPropertyName?.trim() || "Şirket";
  }, [ruleFieldDefinitions]);

  const customerBasedRequestIdComboOptions = useMemo(
    () => toComboOptions(workCompanyOptions),
    [workCompanyOptions],
  );

  useEffect(() => {
    if (dialogStep !== 2) {
      setWorkCompanyOptions([]);
      return;
    }
    if (!needsCustomerBasedWorkCompanies) {
      setWorkCompanyOptions([]);
      return;
    }

    let cancelled = false;
    const loadCompanies = async () => {
      try {
        const api = new WorkCompanyApi(getConfiguration());
        const res = await api.apiWorkCompanyGet();
        if (cancelled) return;
        const mapped = (res.data ?? [])
          .filter((item) => item.id)
          .map((item) => ({
            id: item.id as string,
            label: (item.name?.trim() ? item.name : item.id) as string,
          }));
        setWorkCompanyOptions(mapped);
      } catch {
        if (!cancelled) {
          dispatchAlert({
            message: "Şirket listesi yüklenirken hata oluştu.",
            type: MessageBoxType.Error,
          });
          setWorkCompanyOptions([]);
        }
      }
    };

    void loadCompanies();
    return () => {
      cancelled = true;
    };
  }, [dialogStep, needsCustomerBasedWorkCompanies, dispatchAlert]);

  const scopedManDayQuotaMode = useMemo((): "project" | "request" | null => {
    if (ruleFieldDefinitions.some((def) => isProjectBasedManDayQuotaDefinition(def))) return "project";
    if (ruleFieldDefinitions.some((def) => isRequestBasedManDayQuotaDefinition(def))) return "request";
    return null;
  }, [ruleFieldDefinitions]);

  const scopedManDayQuotaPickerFieldKey = useMemo(() => {
    if (scopedManDayQuotaMode === "project") {
      const idx = ruleFieldDefinitions.findIndex(
        (def) => isProjectBasedManDayQuotaDefinition(def) && !isProjectBasedManDayQuotaDecimalField(def),
      );
      if (idx >= 0) return getDefinitionFieldKey(ruleFieldDefinitions[idx], idx);
      return SYNTHETIC_PROJECT_BASED_PROJECT_FIELD_KEY;
    }
    if (scopedManDayQuotaMode === "request") {
      const idx = ruleFieldDefinitions.findIndex(
        (def) => isRequestBasedManDayQuotaDefinition(def) && !isRequestBasedManDayQuotaDecimalField(def),
      );
      if (idx >= 0) return getDefinitionFieldKey(ruleFieldDefinitions[idx], idx);
      return SYNTHETIC_REQUEST_BASED_TICKET_FIELD_KEY;
    }
    return null;
  }, [ruleFieldDefinitions, scopedManDayQuotaMode]);

  const scopedManDayQuotaComboLabel = useMemo(() => {
    if (scopedManDayQuotaMode === "project") {
      const idx = ruleFieldDefinitions.findIndex(
        (def) => isProjectBasedManDayQuotaDefinition(def) && !isProjectBasedManDayQuotaDecimalField(def),
      );
      if (idx < 0) return "Proje";
      const def = ruleFieldDefinitions[idx];
      return def.displayName?.trim() || def.inputPropertyName?.trim() || "Proje";
    }
    if (scopedManDayQuotaMode === "request") {
      const idx = ruleFieldDefinitions.findIndex(
        (def) => isRequestBasedManDayQuotaDefinition(def) && !isRequestBasedManDayQuotaDecimalField(def),
      );
      if (idx < 0) return "Talep";
      const def = ruleFieldDefinitions[idx];
      return def.displayName?.trim() || def.inputPropertyName?.trim() || "Talep";
    }
    return "";
  }, [ruleFieldDefinitions, scopedManDayQuotaMode]);

  const scopedManDayQuotaComboOptions = useMemo(() => {
    if (scopedManDayQuotaMode === "project") return toComboOptions(activeProjectOptions);
    if (scopedManDayQuotaMode === "request") return toComboOptions(activeRuleTicketOptions);
    return [];
  }, [scopedManDayQuotaMode, activeProjectOptions, activeRuleTicketOptions]);

  useEffect(() => {
    if (dialogStep !== 2) {
      setActiveProjectOptions([]);
      setActiveRuleTicketOptions([]);
      return;
    }
    if (!scopedManDayQuotaMode) {
      setActiveProjectOptions([]);
      setActiveRuleTicketOptions([]);
      return;
    }

    let cancelled = false;

    const loadProjects = async () => {
      try {
        const api = new TicketProjectsApi(getConfiguration());
        const res = await api.apiTicketProjectsGetActiveProjectsOnlyNameGet();
        if (cancelled) return;
        const mapped = (res.data ?? [])
          .filter((item) => item.id)
          .map((item) => ({
            id: item.id as string,
            label: (item.name?.trim() ? item.name : item.id) as string,
          }));
        setActiveProjectOptions(mapped);
      } catch {
        if (!cancelled) {
          dispatchAlert({
            message: "Aktif proje listesi yüklenirken hata oluştu.",
            type: MessageBoxType.Error,
          });
          setActiveProjectOptions([]);
        }
      }
    };

    const loadTickets = async () => {
      try {
        const api = new ActivityCenterRulesApi(getConfiguration());
        const res = await api.apiActivityCenterRulesAllTicketsGet();
        if (cancelled) return;
        const mapped = (res.data ?? [])
          .filter((item) => item.id)
          .map((item) => ({
            id: item.id as string,
            label: `#${item.uniqNumber ?? "-"} - ${item.title?.trim() ? item.title : "Talep"}`,
          }));
        setActiveRuleTicketOptions(mapped);
      } catch {
        if (!cancelled) {
          dispatchAlert({
            message: "Talep listesi yüklenirken hata oluştu.",
            type: MessageBoxType.Error,
          });
          setActiveRuleTicketOptions([]);
        }
      }
    };

    if (scopedManDayQuotaMode === "project") {
      setActiveRuleTicketOptions([]);
      void loadProjects();
    } else {
      setActiveProjectOptions([]);
      void loadTickets();
    }

    return () => {
      cancelled = true;
    };
  }, [dialogStep, scopedManDayQuotaMode, dispatchAlert]);

  const loadRuleTypeDefinitions = useCallback(
    async (ruleTypeKey: string) => {
      const typeParam = parseRuleTypeKeyToApi(ruleTypeKey);
      if (typeParam === undefined) {
        setRuleFieldDefinitions([]);
        return;
      }
      try {
        dispatchBusy({ isBusy: true });
        const api = new ActivityCenterRulesApi(getConfiguration());
        const res = await api.apiActivityCenterRulesRuleTypeDefinitionsGet(typeParam);
        const defs = res.data ?? [];
        setRuleFieldDefinitions(defs);
        setDynamicFieldValues((prev) => {
          const next: Record<string, string> = {};
          defs.forEach((def, index) => {
            const key = getDefinitionFieldKey(def, index);
            next[key] = prev[key] ?? "";
          });
          const hasProjectBased = defs.some((d) => isProjectBasedManDayQuotaDefinition(d));
          const hasProjectPickerDef = defs.some(
            (d) => isProjectBasedManDayQuotaDefinition(d) && !isProjectBasedManDayQuotaDecimalField(d),
          );
          if (hasProjectBased && !hasProjectPickerDef) {
            const syn = SYNTHETIC_PROJECT_BASED_PROJECT_FIELD_KEY;
            next[syn] = prev[syn] ?? "";
          }
          const hasRequestBased = defs.some((d) => isRequestBasedManDayQuotaDefinition(d));
          const hasRequestPickerDef = defs.some(
            (d) => isRequestBasedManDayQuotaDefinition(d) && !isRequestBasedManDayQuotaDecimalField(d),
          );
          if (hasRequestBased && !hasRequestPickerDef) {
            const synT = SYNTHETIC_REQUEST_BASED_TICKET_FIELD_KEY;
            next[synT] = prev[synT] ?? "";
          }
          const hasCustomerBased = defs.some((d) => isCustomerBasedRequestIdRequirementDefinition(d));
          const hasCustomerPickerDef = defs.some((d) => isCustomerBasedRequestIdCompanyPickerField(d));
          if (hasCustomerBased && !hasCustomerPickerDef) {
            const synC = SYNTHETIC_CUSTOMER_BASED_WORK_COMPANY_FIELD_KEY;
            next[synC] = prev[synC] ?? "";
          }
          return next;
        });
      } catch {
        dispatchAlert({
          message: "Kural tipi alan tanımları yüklenirken hata oluştu.",
          type: MessageBoxType.Error,
        });
        setRuleFieldDefinitions([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    },
    [dispatchAlert, dispatchBusy],
  );

  useEffect(() => {
    if (!isDialogOpen) {
      setRuleFieldDefinitions([]);
      return;
    }
    const key = formState.ruleTypeKey;
    if (!key) {
      setRuleFieldDefinitions([]);
      return;
    }
    void loadRuleTypeDefinitions(key);
  }, [isDialogOpen, formState.ruleTypeKey, loadRuleTypeDefinitions]);

  const fetchRulesAndRuleTypes = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterRulesApi(getConfiguration());
      const [rulesResponse, ruleTypesResponse] = await Promise.all([
        api.apiActivityCenterRulesGet(),
        api.apiActivityCenterRulesRuleTypesGet(),
      ]);

      const backendRules = (rulesResponse.data ?? []).map((item: ActivityRuleListDto, index) => {
        const mappedType = normalizeRuleType(item.activityCenterRuleType, item.description);
        return {
          id: `${item.activityCenterRuleType ?? "rule"}-${item.createdDate ?? "row"}-${index}`,
          name: item.activityCenterRuleType ?? getRuleTypeLabel(mappedType),
          type: mappedType,
          ruleTypeKey: item.activityCenterRuleType ?? "",
          rawRuleType: item.activityCenterRuleType ?? undefined,
          description: item.description ?? "",
          isActive: Boolean(item.isActive),
          createdAt: item.createdDate ?? "",
          updatedAt: item.updatedDate ?? "",
        } as RuleRecord;
      });
      setRules(backendRules);

      const backendRuleTypes: EnumOptionDto[] = ruleTypesResponse.data ?? [];
      const nextRuleTypeOptions = backendRuleTypes.reduce<
        Array<{ value: string; label: string; type: RuleType }>
      >(
        (acc, item) => {
          if (item.key === undefined) return acc;
          const keyValue = String(item.key);
          const mappedType = normalizeRuleType(item.key, item.description);
          acc.push({
            value: keyValue,
            label: item.description ?? getRuleTypeLabel(mappedType),
            type: mappedType,
          });
          return acc;
        },
        [],
      );

      setRuleTypeOptions(nextRuleTypeOptions);
    } catch (error) {
      dispatchAlert({
        message: "Kural verileri yüklenirken hata oluştu.",
        type: MessageBoxType.Error,
      });
      setRules([]);
      setRuleTypeOptions([]);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  useEffect(() => {
    fetchRulesAndRuleTypes();
  }, [fetchRulesAndRuleTypes]);

  const buildRuleName = (state: RuleFormState) => {
    if (state.type === "quota") {
      const scopeLabel = state.quotaScope === "project" ? "Proje" : "Talep";
      const targetLabel = state.quotaTarget.trim() || "Genel";
      return `${scopeLabel} Kotası - ${targetLabel}`;
    }

    if (state.type === "requestIdMandatory") return "Talep ID Zorunlu Müşteriler";
    if (state.type === "activityExemption") return "Aktivite Muafiyet Kuralı";
    return "Onay Süreci Seçimi";
  };

  const customerNameMap = useMemo(() => {
    return mockCustomers.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, []);

  const userNameMap = useMemo(() => {
    return mockUsers.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.fullName;
      return acc;
    }, {});
  }, []);

  const handleToggleArraySelection = (
    currentValues: string[],
    value: string,
    field: "mandatoryCustomerIds" | "exemptUserIds",
  ) => {
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    setFormState((prev) => ({ ...prev, [field]: nextValues }));
  };

  const handleOpenCreateDialog = () => {
    setDynamicFieldValues({});
    setRuleFieldDefinitions([]);
    setFormState(createDefaultForm());
    setDialogStep(1);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (rule: RuleRecord) => {
    const selectedTypeOption = ruleTypeOptions.find((item) => item.value === rule.ruleTypeKey);
    setDynamicFieldValues(rule.ruleParameters ?? {});
    setFormState({
      id: rule.id,
      ruleTypeKey: rule.ruleTypeKey ?? selectedTypeOption?.value ?? "",
      type: selectedTypeOption?.type ?? rule.type,
      description: rule.description ?? "",
      isActive: rule.isActive,
      quotaScope: rule.quotaScope ?? "project",
      quotaTarget: rule.quotaTarget ?? "",
      quotaDayLimit: rule.quotaDayLimit ? String(rule.quotaDayLimit) : "",
      mandatoryCustomerIds: rule.mandatoryCustomerIds ?? [],
      exemptUserIds: rule.exemptUserIds ?? [],
      noActivityEntryRequired: rule.noActivityEntryRequired ?? true,
      excludeFromReminderMails: rule.excludeFromReminderMails ?? true,
      approvalMode: rule.approvalMode ?? "projectBased",
      approvalStartMessage:
        rule.approvalStartMessage ?? "Seçilen moda göre otomatik onay süreci başlatılır.",
    });
    setDialogStep(1);
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!formState.ruleTypeKey) return;
    if (!formState.description.trim()) return;

    const now = new Date().toLocaleString("tr-TR");
    const existingRule = formState.id ? rules.find((item) => item.id === formState.id) : undefined;

    if (ruleFieldDefinitions.length > 0) {
      const filteredParams: Record<string, string> = {};
      ruleFieldDefinitions.forEach((def, index) => {
        const key = getDefinitionFieldKey(def, index);
        filteredParams[key] = dynamicFieldValues[key] ?? "";
      });
      if (scopedManDayQuotaPickerFieldKey) {
        filteredParams[scopedManDayQuotaPickerFieldKey] =
          dynamicFieldValues[scopedManDayQuotaPickerFieldKey] ?? "";
      }
      if (customerBasedRequestIdPickerFieldKey) {
        filteredParams[customerBasedRequestIdPickerFieldKey] =
          dynamicFieldValues[customerBasedRequestIdPickerFieldKey] ?? "";
      }
      const payload: RuleRecord = {
        id: formState.id ?? `r-${Date.now()}`,
        name: buildRuleName(formState),
        type: formState.type,
        ruleTypeKey: formState.ruleTypeKey,
        isActive: formState.isActive,
        description: formState.description.trim(),
        ruleParameters: filteredParams,
        createdAt: existingRule?.createdAt ?? now,
        updatedAt: now,
      };
      if (formState.id) {
        setRules((prev) => prev.map((item) => (item.id === formState.id ? payload : item)));
      } else {
        setRules((prev) => [payload, ...prev]);
      }
      setIsDialogOpen(false);
      setFormState(createDefaultForm());
      setDynamicFieldValues({});
      setRuleFieldDefinitions([]);
      return;
    }

    if (formState.type === "quota" && (!formState.quotaTarget.trim() || !formState.quotaDayLimit.trim())) {
      return;
    }

    const quotaDayLimit = Number(formState.quotaDayLimit);
    if (formState.type === "quota" && (!Number.isFinite(quotaDayLimit) || quotaDayLimit <= 0)) {
      return;
    }

    if (formState.type === "requestIdMandatory" && formState.mandatoryCustomerIds.length === 0) {
      return;
    }

    if (formState.type === "activityExemption" && formState.exemptUserIds.length === 0) {
      return;
    }

    const payload: RuleRecord = {
      id: formState.id ?? `r-${Date.now()}`,
      name: buildRuleName(formState),
      type: formState.type,
      ruleTypeKey: formState.ruleTypeKey,
      isActive: formState.isActive,
      description: formState.description.trim(),
      quotaScope: formState.type === "quota" ? formState.quotaScope : undefined,
      quotaTarget: formState.type === "quota" ? formState.quotaTarget.trim() : undefined,
      quotaDayLimit: formState.type === "quota" ? quotaDayLimit : undefined,
      mandatoryCustomerIds:
        formState.type === "requestIdMandatory" ? formState.mandatoryCustomerIds : undefined,
      exemptUserIds: formState.type === "activityExemption" ? formState.exemptUserIds : undefined,
      noActivityEntryRequired:
        formState.type === "activityExemption" ? formState.noActivityEntryRequired : undefined,
      excludeFromReminderMails:
        formState.type === "activityExemption" ? formState.excludeFromReminderMails : undefined,
      approvalMode: formState.type === "approvalFlow" ? formState.approvalMode : undefined,
      approvalStartMessage:
        formState.type === "approvalFlow" ? formState.approvalStartMessage.trim() : undefined,
      createdAt: existingRule?.createdAt ?? now,
      updatedAt: now,
    };

    if (formState.id) {
      setRules((prev) => prev.map((item) => (item.id === formState.id ? payload : item)));
    } else {
      setRules((prev) => [payload, ...prev]);
    }

    setIsDialogOpen(false);
    setFormState(createDefaultForm());
    setDynamicFieldValues({});
    setRuleFieldDefinitions([]);
  };

  const getRuleDescription = (rule: RuleRecord) => {
    if (rule.description && rule.description.trim()) {
      return rule.description.trim();
    }

    if (rule.ruleParameters && Object.keys(rule.ruleParameters).length > 0) {
      return Object.entries(rule.ruleParameters)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
    }

    if (rule.type === "quota") {
      const scopeLabel = rule.quotaScope === "project" ? "Proje" : "Talep";
      return `${scopeLabel}: ${rule.quotaTarget ?? "-"} - Kota: ${rule.quotaDayLimit ?? 0} adam/gün`;
    }

    if (rule.type === "requestIdMandatory") {
      const customerNames = (rule.mandatoryCustomerIds ?? [])
        .map((id) => customerNameMap[id] ?? id)
        .join(", ");
      return `Talep ID zorunlu müşteriler: ${customerNames || "-"}`;
    }

    if (rule.type === "activityExemption") {
      const userNames = (rule.exemptUserIds ?? []).map((id) => userNameMap[id] ?? id).join(", ");
      return `Muaf kişiler: ${userNames || "-"} | Aktivite zorunluluğu: ${
        rule.noActivityEntryRequired ? "Yok" : "Var"
      } | Hatırlatma maili: ${rule.excludeFromReminderMails ? "Dahil değil" : "Dahil"}`;
    }

    return `Onay modu: ${
      rule.approvalMode === "projectBased" ? "Proje bazlı" : "Müşteri bazlı"
    } | ${rule.approvalStartMessage ?? ""}`;
  };

  const getRuleTypeBadgeLabel = (rule: RuleRecord) => {
    const byKey = ruleTypeOptions.find((item) => item.value === rule.ruleTypeKey);
    if (byKey?.label) return byKey.label;

    const byRaw = ruleTypeOptions.find(
      (item) =>
        item.label.toLowerCase() === (rule.rawRuleType ?? "").toLowerCase() ||
        item.value === rule.rawRuleType,
    );
    if (byRaw?.label) return byRaw.label;

    if (rule.rawRuleType) return rule.rawRuleType;
    return getRuleTypeLabel(rule.type);
  };

  const ruleTypeComboOptions = useMemo(
    () =>
      toComboOptions(
        ruleTypeOptions.map((item) => ({
          id: item.value,
          label: item.label,
        })),
      ),
    [ruleTypeOptions],
  );

  const canProceedStepOne = Boolean(formState.ruleTypeKey && formState.description.trim());

  const handleContinueToStepTwo = async () => {
    await loadRuleTypeDefinitions(formState.ruleTypeKey);
    setDialogStep(2);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <main className="px-4 md:px-6 py-6 flex flex-col gap-5 min-h-[calc(100vh-10rem)]">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Aktivite Merkezi Kural Tanımlama</h2>
              <p className="text-sm text-slate-500">
                Proje, müşteri veya yalep bazlı kurallarınızı yönetin.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreateDialog}
              className="h-8 gap-2 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium shadow-sm shadow-[#3e5d8f]/25 transition-all duration-200 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Kural
            </Button>
          </div>

          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60 text-left">
                    İşlem
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Kural Tipi
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Açıklama
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Durum
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Oluşturulma Tarihi
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Güncelleme Tarihi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className="border-slate-50 hover:bg-slate-100/90 cursor-pointer"
                    onClick={() => handleOpenEditDialog(rule)}
                  >
                    <TableCell className="px-4 py-3 text-left">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenEditDialog(rule);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Düzenle
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-700">
                      <Badge variant="secondary">{getRuleTypeBadgeLabel(rule)}</Badge>
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-sm text-slate-700 max-w-[520px]"
                      title={getRuleDescription(rule).length > 40 ? getRuleDescription(rule) : undefined}
                    >
                      {truncateText(getRuleDescription(rule), 40)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-700">
                      <Badge
                        variant="outline"
                        className={
                          rule.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }
                      >
                        {rule.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-700">{formatDateToDisplay(rule.createdAt)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-700">{formatDateToDisplay(rule.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl border border-slate-300/60 p-6">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              {formState.id ? "Kural Düzenle" : "Yeni Kural Tanımla"} - Adım {dialogStep}/2
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="mb-4 flex items-center gap-2">
              <div className={`h-2.5 flex-1 rounded-full ${dialogStep >= 1 ? "bg-[#3e5d8f]" : "bg-slate-200"}`} />
              <div className={`h-2.5 flex-1 rounded-full ${dialogStep >= 2 ? "bg-[#3e5d8f]" : "bg-slate-200"}`} />
            </div>

            {dialogStep === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
                <div className="space-y-2 md:col-span-3">
                  <Label>Kural Tipi</Label>
                  <ActivityFieldCombobox
                    ariaLabel="Kural tipi seçin"
                    options={ruleTypeComboOptions}
                    value={formState.ruleTypeKey}
                    placeholder="Kural tipi seç"
                    contentClassName="w-[680px] max-w-[92vw]"
                    onChange={(value) => {
                      const selectedRuleType = ruleTypeOptions.find((item) => item.value === value);
                      setFormState((prev) => ({
                        ...prev,
                        ruleTypeKey: value,
                        type: selectedRuleType?.type ?? prev.type,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label className="block">Aktif/Pasif</Label>
                  <div className="h-10 flex items-center">
                    <Switch
                      className="data-checked:bg-emerald-500 data-unchecked:bg-red-500"
                      checked={formState.isActive}
                      onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-4">
                  <Label>Açıklama</Label>
                  <Textarea
                    rows={3}
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Kural açıklamasını giriniz."
                  />
                </div>
              </div>
            ) : null}

            {dialogStep === 2 ? (
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
                {scopedManDayQuotaPickerFieldKey ? (
                  <>
                    <div className="col-span-full grid w-full min-w-0 grid-cols-1 gap-2">
                      <Label>{scopedManDayQuotaComboLabel}</Label>
                      <ActivityFieldCombobox
                        className="w-full min-w-0 shrink-0 basis-full"
                        ariaLabel={
                          scopedManDayQuotaMode === "request" ? "Talep seçin" : "Aktif proje seçin"
                        }
                        options={scopedManDayQuotaComboOptions}
                        value={dynamicFieldValues[scopedManDayQuotaPickerFieldKey] ?? ""}
                        placeholder={scopedManDayQuotaMode === "request" ? "Talep seçin" : "Proje seçin"}
                        onChange={(next) =>
                          setDynamicFieldValues((prev) => ({
                            ...prev,
                            [scopedManDayQuotaPickerFieldKey]: next,
                          }))
                        }
                      />
                    </div>
                    {ruleFieldDefinitions.map((def, index) => {
                      if (!isScopedManDayQuotaDefinition(def)) return null;
                      if (!isScopedManDayQuotaDecimalField(def)) return null;
                      const fieldKey = getDefinitionFieldKey(def, index);
                      const label =
                        def.displayName?.trim() ||
                        def.inputPropertyName?.trim() ||
                        def.ruleTypeName?.trim() ||
                        `Alan ${index + 1}`;
                      const value = dynamicFieldValues[fieldKey] ?? "";
                      return (
                        <div
                          key={`${fieldKey}-${index}`}
                          className="col-span-full grid w-full min-w-0 grid-cols-1 gap-2"
                        >
                          <Label>{label}</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            value={value}
                            onChange={(event) =>
                              setDynamicFieldValues((prev) => ({
                                ...prev,
                                [fieldKey]: event.target.value,
                              }))
                            }
                            placeholder="0,00"
                            className="h-9 w-full min-w-0 tabular-nums"
                          />
                        </div>
                      );
                    })}
                  </>
                ) : null}

                {customerBasedRequestIdPickerFieldKey ? (
                  <div className="col-span-full grid w-full min-w-0 grid-cols-1 gap-2">
                    <Label>{customerBasedRequestIdComboLabel}</Label>
                    <ActivityFieldCombobox
                      className="w-full min-w-0 shrink-0 basis-full"
                      ariaLabel="Şirket seçin"
                      options={customerBasedRequestIdComboOptions}
                      value={dynamicFieldValues[customerBasedRequestIdPickerFieldKey] ?? ""}
                      placeholder="Şirket seçin"
                      onChange={(next) =>
                        setDynamicFieldValues((prev) => ({
                          ...prev,
                          [customerBasedRequestIdPickerFieldKey]: next,
                        }))
                      }
                    />
                  </div>
                ) : null}

                {ruleFieldDefinitions.length > 0
                  ? ruleFieldDefinitions.map((def, index) => {
                      if (isScopedManDayQuotaDefinition(def)) return null;
                      const fieldKey = getDefinitionFieldKey(def, index);
                      if (
                        customerBasedRequestIdPickerFieldKey &&
                        fieldKey === customerBasedRequestIdPickerFieldKey
                      ) {
                        return null;
                      }
                      const label =
                        def.displayName?.trim() ||
                        def.inputPropertyName?.trim() ||
                        def.ruleTypeName?.trim() ||
                        `Alan ${index + 1}`;
                      const kind = def.inputValueKind;
                      const value = dynamicFieldValues[fieldKey] ?? "";

                      const handleDynamicChange = (next: string) => {
                        setDynamicFieldValues((prev) => ({ ...prev, [fieldKey]: next }));
                      };

                      if (isDoubleInputProperty(def.inputPropertyName)) {
                        return (
                          <div key={`${fieldKey}-${index}`} className="space-y-2">
                            <Label>{label}</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={value}
                              onChange={(event) => handleDynamicChange(event.target.value)}
                              placeholder="0"
                              className="tabular-nums"
                            />
                          </div>
                        );
                      }

                      if (kind === ActivityCenterRuleInputValueKind.NUMBER_3) {
                        return (
                          <div key={`${fieldKey}-${index}`} className="space-y-2 md:col-span-2">
                            <Label className="block">{label}</Label>
                            <div className="h-8 flex items-center gap-2">
                              <Switch
                                className="data-checked:bg-emerald-500 data-unchecked:bg-slate-300"
                                checked={value === "true" || value === "1"}
                                onCheckedChange={(checked) =>
                                  handleDynamicChange(checked ? "true" : "false")
                                }
                              />
                              <span className="text-sm text-slate-600">
                                {value === "true" || value === "1" ? "Evet" : "Hayır"}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (kind === ActivityCenterRuleInputValueKind.NUMBER_4) {
                        return (
                          <div key={`${fieldKey}-${index}`} className="space-y-2 md:col-span-2">
                            <Label>{label}</Label>
                            <Textarea
                              rows={3}
                              value={value}
                              onChange={(event) => handleDynamicChange(event.target.value)}
                              placeholder={label}
                            />
                          </div>
                        );
                      }

                      if (kind === ActivityCenterRuleInputValueKind.NUMBER_2) {
                        return (
                          <div key={`${fieldKey}-${index}`} className="space-y-2">
                            <Label>{label}</Label>
                            <Input
                              type="number"
                              value={value}
                              onChange={(event) => handleDynamicChange(event.target.value)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={`${fieldKey}-${index}`} className="space-y-2">
                          <Label>{label}</Label>
                          <Input
                            type="text"
                            value={value}
                            onChange={(event) => handleDynamicChange(event.target.value)}
                          />
                        </div>
                      );
                    })
                  : null}

                {ruleFieldDefinitions.length === 0 ? (
                  <>
                    {formState.type === "quota" ? (
                      <>
                        <div className="space-y-2">
                          <Label>Kota Kapsamı</Label>
                          <Select
                            value={formState.quotaScope}
                            onValueChange={(value) =>
                              setFormState((prev) => ({ ...prev, quotaScope: value as QuotaScope }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="project">Proje Bazlı</SelectItem>
                              <SelectItem value="request">Talep Bazlı</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Kota Hedefi</Label>
                          <Input
                            value={formState.quotaTarget}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, quotaTarget: event.target.value }))
                            }
                            placeholder="Örnek: ERP Geçiş Projesi"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Adam/Gün Kotası</Label>
                          <Input
                            type="number"
                            min={1}
                            value={formState.quotaDayLimit}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, quotaDayLimit: event.target.value }))
                            }
                            placeholder="Örnek: 30"
                          />
                        </div>
                      </>
                    ) : null}

                    {formState.type === "requestIdMandatory" ? (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Talep ID Zorunlu Müşteriler</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 max-h-48 overflow-auto">
                          {mockCustomers.map((customer) => (
                            <label key={customer.id} className="flex items-center gap-2 text-sm text-slate-700">
                              <Checkbox
                                checked={formState.mandatoryCustomerIds.includes(customer.id)}
                                onCheckedChange={() =>
                                  handleToggleArraySelection(
                                    formState.mandatoryCustomerIds,
                                    customer.id,
                                    "mandatoryCustomerIds",
                                  )
                                }
                              />
                              <span>{customer.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {formState.type === "activityExemption" ? (
                      <>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Muaf Kişi Listesi</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 max-h-48 overflow-auto">
                            {mockUsers.map((user) => (
                              <label key={user.id} className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                  checked={formState.exemptUserIds.includes(user.id)}
                                  onCheckedChange={() =>
                                    handleToggleArraySelection(formState.exemptUserIds, user.id, "exemptUserIds")
                                  }
                                />
                                <span>{user.fullName}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="block">Aktivite Girme Zorunluluğu</Label>
                          <div className="h-8 flex items-center">
                            <Switch
                              checked={formState.noActivityEntryRequired}
                              onCheckedChange={(checked) =>
                                setFormState((prev) => ({ ...prev, noActivityEntryRequired: checked }))
                              }
                            />
                            <span className="ml-2 text-sm text-slate-600">
                              {formState.noActivityEntryRequired ? "Muaf (Zorunlu Değil)" : "Zorunlu"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="block">Hatırlatma Maili Durumu</Label>
                          <div className="h-8 flex items-center">
                            <Switch
                              checked={formState.excludeFromReminderMails}
                              onCheckedChange={(checked) =>
                                setFormState((prev) => ({ ...prev, excludeFromReminderMails: checked }))
                              }
                            />
                            <span className="ml-2 text-sm text-slate-600">
                              {formState.excludeFromReminderMails
                                ? "Mail listesine dahil değil"
                                : "Mail listesine dahil"}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null}

                    {formState.type === "approvalFlow" ? (
                      <>
                        <div className="space-y-2">
                          <Label>Onay Süreci Türü</Label>
                          <Select
                            value={formState.approvalMode}
                            onValueChange={(value) =>
                              setFormState((prev) => ({ ...prev, approvalMode: value as ApprovalMode }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="projectBased">Proje Bazlı</SelectItem>
                              <SelectItem value="customerBased">Müşteri Bazlı</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Süreç Başlatma Notu</Label>
                          <Textarea
                            value={formState.approvalStartMessage}
                            onChange={(event) =>
                              setFormState((prev) => ({ ...prev, approvalStartMessage: event.target.value }))
                            }
                            placeholder="Seçime göre onay sürecinin nasıl başlatılacağını tanımlayın."
                            rows={3}
                          />
                        </div>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-4 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 bg-slate-50 sm:justify-end">
            {dialogStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Vazgeç
                </Button>
                <Button
                  className="bg-[#3e5d8f] text-white hover:bg-[#324d7a]"
                  disabled={!canProceedStepOne}
                  onClick={() => {
                    void handleContinueToStepTwo();
                  }}
                >
                  Devam Et
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setDialogStep(1)}
                >
                  Geri
                </Button>
                <Button
                  className="bg-[#3e5d8f] text-white hover:bg-[#324d7a]"
                  onClick={handleSaveRule}
                >
                  Kaydet
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}

export default ActivityRuleManagement;
