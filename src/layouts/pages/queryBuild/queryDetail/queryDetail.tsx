import React, { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import QueryBuilder, { Field, formatQuery, RuleGroupType } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import "../css/queryDetail.css";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import CustomMessageBox from "layouts/pages/Components/CustomMessageBox";
import { content } from "../data/content";
import {
  UserAppDtoOnlyNameId,
  TicketTeamListDto,
  TicketDepartmensListDto,
} from "api/generated/api";
import {
  UserData,
  TeamData,
  WorkFlowData,
  TicketStatusData,
  TicketPriorityData,
  TicketTypeData,
  TicketSlaData,
  TicketSubjectData,
  TicketClientData,
  TicketCompanyData,
  WorkCompanyIdSystemData,
} from "../controller";
import {
  fetchTeamData,
  fetchTicketDepartmentData,
  fetchTicketRuleEngineData,
  fetchUserData,
  fetchWorkFlowData,
} from "../controller/custom/apiCalls";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "lib/utils";

// shadcn/ui
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";
import { Separator } from "components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/ui/tooltip";

// Lucide icons
import {
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Download,
  Save,
  CheckCircle,
  Plus,
  FolderPlus,
  Trash2,
  X,
  Filter,
  Code2,
  Type,
  Users,
  User,
  GitBranch,
  Building2,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";

// ─── Generic Searchable Select ────────────────────────────────────────────────

type SearchableSelectProps<T> = {
  options: T[] | null;
  value: T | null;
  onChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
};

function SearchableSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getId,
  placeholder,
  disabled,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (options || []).filter((opt) =>
    getLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt: T) => {
    onChange(opt);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch("");
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-sky-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
          {value ? getLabel(value) : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
              className="rounded p-0.5 hover:bg-muted text-muted-foreground"
              aria-label="Clear selection"
            >
              <X className="size-3" />
            </span>
          )}
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-90"
            )}
          />
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute z-50 mt-1 w-full min-w-[180px] rounded-lg border bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden">
            <div className="p-1.5 border-b bg-muted/20">
              <div className="flex items-center gap-1.5 px-2 h-7 bg-background rounded border border-input/40">
                <Search className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  Sonuç bulunamadı
                </p>
              ) : (
                filtered.map((opt) => {
                  const isSelected = value !== null && getId(value) === getId(opt);
                  return (
                    <button
                      key={getId(opt)}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors",
                        isSelected && "bg-accent/60 font-medium"
                      )}
                      onClick={() => handleSelect(opt)}
                    >
                      <CheckCircle
                        className={cn(
                          "size-3.5 shrink-0 transition-opacity",
                          isSelected ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                      <span>{getLabel(opt)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── QueryDetail ──────────────────────────────────────────────────────────────

function QueryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const { t } = useTranslation();

  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [isQuestionMessageBoxOpenExport, setIsQuestionMessageBoxOpenExport] = useState(false);
  const [isQuestionMessageBoxOpenInfo, setIsQuestionMessageBoxOpenInfo] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCustomerRefId, setSelectedCustomerRefId] = useState("");

  const [userFields, setUserFields] = useState<Field[]>([]);
  const [teamFields, setTeamFields] = useState<Field[]>([]);
  const [workFlowFields, setWorkFlowFields] = useState<Field[]>([]);
  const [statusFields, setStatusFields] = useState<Field[]>([]);
  const [priorityFields, setPriorityFields] = useState<Field[]>([]);
  const [typeFields, setTypeFields] = useState<Field[]>([]);
  const [slaFields, setSlaFields] = useState<Field[]>([]);
  const [subjectFields, setSubjectFields] = useState<Field[]>([]);
  const [clientFields, setClientFields] = useState<Field[]>([]);
  const [companyFields, setCompanyFields] = useState<Field[]>([]);
  const [userMailFields, setUserMailFields] = useState<Field[]>([]);
  const [workCompanySystemInfo, setWorkCompanySystemInfo] = useState<Field[]>([]);

  const [queryName, setQueryName] = useState<string>("");
  const [actionUsers, setActionUsers] = useState<UserAppDtoOnlyNameId[] | null>(null);
  const [selectedActionUser, setSelectedActionUser] = useState<UserAppDtoOnlyNameId | null>(null);
  const [actionTeams, setActionTeams] = useState<TicketTeamListDto[] | null>(null);
  const [selectedActionTeam, setSelectedActionTeam] = useState<TicketTeamListDto | null>(null);
  const [actionWorkFlows, setActionWorkFlows] = useState<any[]>([]);
  const [selectedActionWorkFlow, setSelectedActionWorkFlow] = useState<any>(null);
  const [actionDepartments, setActionDepartments] = useState<TicketDepartmensListDto[] | null>(
    null
  );
  const [selectedActionDepartment, setSelectedActionDepartment] =
    useState<TicketDepartmensListDto | null>(null);
  const [userOrTeam, setUserOrTeam] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"query" | "assignment">("query");
  const [querOrdNum, setQuerOrdNum] = useState<number>(1);
  const [selectedRBValue, setSelectedRBValue] = useState(1);

  const [query, setQuery] = useState<RuleGroupType>({
    combinator: "and",
    rules: [],
  });

  const loadActionData = async (
    fetchFunction: any | null,
    setStateFunction: React.Dispatch<React.SetStateAction<any>>
  ) => {
    try {
      if (!fetchFunction || typeof fetchFunction == "undefined" || fetchFunction == null) return;
      switch (fetchFunction) {
        case fetchWorkFlowData:
          const workFlowData = (
            await (await fetchWorkFlowData()).apiWorkFlowDefinationGetWorkFlowListByMenuGet()
          ).data as any;
          setStateFunction(workFlowData.data);
          break;
        case fetchTeamData:
          const teamData = (await (await fetchTeamData()).apiTicketTeamWithoutTeamGet()).data;
          setStateFunction(teamData);
          break;
        case fetchUserData:
          const userData = (await (await fetchUserData()).apiUserGetAllUsersNameIdOnlyGet()).data;
          setStateFunction(userData);
          break;
        case fetchTicketDepartmentData:
          const departmentData = (
            await (await fetchTicketDepartmentData()).apiTicketDepartmentsGet()
          ).data;
          setStateFunction(departmentData);
          break;
        default:
          break;
      }
    } catch (error) {
      dispatchAlert({
        message: `Error loading action data: ${error}`,
        type: "Error",
      });
    }
  };

  const loadFieldData = async (
    fetchFunction: any,
    setStateFunction: React.Dispatch<React.SetStateAction<any>>,
    isEmail?: boolean
  ) => {
    try {
      const data = await fetchFunction(isEmail);
      setStateFunction([data]);
    } catch (error) {
      dispatchAlert({
        message: `Error loading field data: ${error}`,
        type: "Error",
      });
    }
  };

  const loadAllDataOptimized = async () => {
    dispatchBusy({ isBusy: true });

    const fieldDataLoader = [
      { fetch: WorkFlowData, setState: setWorkFlowFields },
      { fetch: UserData, setState: setUserFields },
      { fetch: TeamData, setState: setTeamFields },
      { fetch: TicketStatusData, setState: setStatusFields },
      { fetch: TicketPriorityData, setState: setPriorityFields },
      { fetch: TicketTypeData, setState: setTypeFields },
      { fetch: TicketSlaData, setState: setSlaFields },
      { fetch: TicketSubjectData, setState: setSubjectFields },
      { fetch: TicketClientData, setState: setClientFields },
      { fetch: TicketCompanyData, setState: setCompanyFields },
      { fetch: UserData, setState: setUserMailFields, isEmail: true },
      ...(selectedCustomerRefId !== ""
        ? [
            {
              fetch: () => WorkCompanyIdSystemData(selectedCustomerRefId),
              setState: setWorkCompanySystemInfo,
            },
          ]
        : []),
    ];

    await Promise.all(
      fieldDataLoader.map(({ fetch, setState, isEmail }) => loadFieldData(fetch, setState, isEmail))
    );

    const actionDataLoader = [
      { fetch: fetchWorkFlowData, setState: setActionWorkFlows },
      { fetch: fetchTeamData, setState: setActionTeams },
      { fetch: fetchUserData, setState: setActionUsers },
      { fetch: fetchTicketDepartmentData, setState: setActionDepartments },
    ];

    await Promise.all(
      actionDataLoader.map(({ fetch, setState }) => loadActionData(fetch, setState))
    );

    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    loadAllDataOptimized();
  }, []);

  const handleQueryChange = (q: RuleGroupType) => {
    setQuery(q);
  };

  const exportQuery = () => {
    const queryData = {
      sql: formatQuery(query, "sql"),
      raw: query,
    };
    const blob = new Blob([JSON.stringify(queryData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query-export.json";
    a.click();
  };

  const resetQuery = () => {
    setQuery({ combinator: "and", rules: [] });
    setSelectedActionDepartment(null);
    setSelectedActionTeam(null);
    setSelectedActionUser(null);
    setSelectedActionWorkFlow(null);
    setQueryName("");
    setQuerOrdNum(1);
  };

  useEffect(() => {
    let count = 0;
    let hasWorkCompanySystemId = false;
    for (const rule of query.rules) {
      if ("field" in rule && rule.field === "CustomerRefId") {
        count++;
        setSelectedCustomerRefId(rule.value);
      }
      if ("field" in rule && rule.field === "WorkCompanySystemInfoId") {
        hasWorkCompanySystemId = true;
      }
    }
    if (count == 0) {
      setSelectedCustomerRefId("");
      if (hasWorkCompanySystemId) {
        const filteredRules = query.rules.filter(
          (rule) => "field" in rule && rule.field !== "WorkCompanySystemInfoId"
        );
        setQuery((prev) => ({ ...prev, rules: filteredRules }));
      }
    }
  }, [query]);

  useEffect(() => {
    if (selectedCustomerRefId !== "") {
      WorkCompanyIdSystemData(selectedCustomerRefId).then((fieldData) => {
        if (fieldData) {
          setWorkCompanySystemInfo([fieldData]);
        } else {
          setWorkCompanySystemInfo([]);
        }
      });
    }
  }, [selectedCustomerRefId]);

  const saveQuery = async () => {
    try {
      dispatchBusy({ isBusy: true });

      if (queryName == null || queryName.trim() == "") {
        dispatchAlert({
          message: t("ns1:QueryPage.QueryDetail.SorguAdiBos"),
          type: "Warning",
        });
        dispatchBusy({ isBusy: false });
        return;
      }

      if (selectedActionDepartment?.id == null) {
        dispatchAlert({
          message: t("ns1:QueryPage.QueryDetail.DepartmanBos"),
          type: "Warning",
        });
        dispatchBusy({ isBusy: false });
        return;
      }

      if (id) {
        await (
          await fetchTicketRuleEngineData()
        ).apiTicketRuleEnginePut({
          id: id,
          ruleName: queryName,
          ruleJson: JSON.stringify(query),
          isActive: true,
          assignedDepartmentId: selectedActionDepartment?.id,
          assignedTeamId: selectedActionTeam?.id,
          assignedUserId: selectedActionUser?.id,
          order: querOrdNum,
          workflowId: selectedActionWorkFlow?.id,
          createEnvironment: selectedRBValue,
        });
        dispatchAlert({
          message: t("ns1:QueryPage.QueryDetail.SorguBasariliGuncellendi"),
          type: "Success",
        });
        navigate("/queryBuild");
        dispatchBusy({ isBusy: false });
        return;
      }

      await (
        await fetchTicketRuleEngineData()
      ).apiTicketRuleEnginePost({
        ruleName: queryName,
        ruleJson: JSON.stringify(query),
        isActive: true,
        assignedDepartmentId: selectedActionDepartment?.id,
        assignedTeamId: selectedActionTeam?.id,
        assignedUserId: selectedActionUser?.id,
        workflowId: selectedActionWorkFlow?.id,
        order: querOrdNum,
        createEnvironment: selectedRBValue,
      });
      dispatchAlert({
        message: t("ns1:QueryPage.QueryDetail.SorguBasariliKaydedildi"),
        type: "Success",
      });
      navigate("/queryBuild");
    } catch (error) {
      dispatchAlert({
        message: t("ns1:QueryPage.QueryDetail.SorguKayitHata"),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    if (id && actionDepartments && actionTeams && actionUsers && actionWorkFlows) {
      const fetchQuery = async () => {
        try {
          dispatchBusy({ isBusy: true });
          const response = await (await fetchTicketRuleEngineData()).apiTicketRuleEngineIdGet(id);
          setQuery(JSON.parse(response.data.ruleJson));
          setQueryName(response.data.ruleName);
          setQuerOrdNum(response.data.order);
          setSelectedRBValue(response.data.createEnvironment);
          setSelectedActionDepartment(
            actionDepartments.find(
              (department) => department.id === response.data.assignedDepartmentId
            )
          );
          setSelectedActionWorkFlow(
            actionWorkFlows.find((workflow) => workflow.id === response.data.workflowId)
          );
          if (
            response.data.assignedTeamId &&
            response.data.assignedUserId === "00000000-0000-0000-0000-000000000000"
          ) {
            setUserOrTeam("team");
            setSelectedActionTeam(
              actionTeams.find((team) => team.id === response.data.assignedTeamId)
            );
          }
          if (
            response.data.assignedUserId &&
            response.data.assignedTeamId === "00000000-0000-0000-0000-000000000000"
          ) {
            setUserOrTeam("user");
            setSelectedActionUser(
              actionUsers.find((user) => user.id === response.data.assignedUserId)
            );
          }
        } catch (error) {
          dispatchAlert({
            message: "Error fetching query data",
            type: "Error",
          });
        } finally {
          dispatchBusy({ isBusy: false });
        }
      };
      fetchQuery();
    }
  }, [id, actionDepartments, actionTeams, actionUsers, actionWorkFlows]);

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes" || action === "Evet") resetQuery();
  };

  const handleCloseQuestionBoxExport = (action: string) => {
    setIsQuestionMessageBoxOpenExport(false);
    if (action === "Yes" || action === "Evet") exportQuery();
  };

  const handleGoBack = () => {
    const previousUrl = document.referrer;
    if (previousUrl.includes("/queryBuild")) {
      navigate("/queryBuild");
    } else {
      navigate(-1);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-6 px-1">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3 border-b bg-linear-to-r from-slate-50 to-white">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {t("ns1:QueryPage.QueryDetail.QueryBuilder")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("ns1:QueryPage.QueryDetail.SorguBilgi")}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setIsQuestionMessageBoxOpenInfo(true)}
                    className="rounded-full shrink-0 mt-1"
                    aria-label={t("ns1:QueryPage.QueryDetail.SorguBilgi")}
                  >
                    <AlertCircle className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("ns1:QueryPage.QueryDetail.SorguBilgi")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* ── Tabs ── */}
          <div className="px-6 pt-5 pb-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "query" | "assignment")}
            >
              <TabsList variant="line" className="mb-5">
                <TabsTrigger value="query" className="gap-1.5 px-4">
                  <Search className="size-4" />
                  {t("ns1:QueryPage.QueryDetail.Sorgu")}
                </TabsTrigger>
                <TabsTrigger value="assignment" className="gap-1.5 px-4">
                  <Settings className="size-4" />
                  {t("ns1:QueryPage.QueryDetail.Atama")}
                </TabsTrigger>
              </TabsList>

              {/* ══ QUERY TAB ══ */}
              <TabsContent value="query">
                <div className="space-y-5">
                  <h2 className="text-base font-semibold text-slate-700 pb-2 border-b">
                    {t("ns1:QueryPage.QueryDetail.SorguOlusturucu")}
                  </h2>

                  {/* Top row: Name / Environment / Order */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Query Name */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-2">
                        <Type className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.SorguAdi")}
                      </Label>
                      <Input
                        value={queryName}
                        onChange={(e) => setQueryName(e.target.value)}
                        placeholder={t("ns1:QueryPage.QueryDetail.SorguAdiPlaceholder")}
                        className="hover:border-sky-400 focus:border-sky-500"
                      />
                    </div>

                    {/* Environment Radio */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-3">
                        <Settings className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.TalepOlusturmaOrtami")}
                      </Label>
                      <RadioGroup
                        value={String(selectedRBValue)}
                        onValueChange={(val) => setSelectedRBValue(Number(val))}
                        className="gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="1" id="rb-support" />
                          <Label htmlFor="rb-support" className="font-normal cursor-pointer">
                            {t("ns1:QueryPage.QueryDetail.DestekSistemi")}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="2" id="rb-mail" />
                          <Label htmlFor="rb-mail" className="font-normal cursor-pointer">
                            {t("ns1:QueryPage.QueryDetail.Mail")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Order Number */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-2">
                        <Hash className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.SorguSirasi")}{" "}
                        <span className="font-normal italic text-sm text-slate-400">
                          {t("ns1:QueryPage.QueryDetail.SorguSirasiItalic")}
                        </span>
                      </Label>
                      <Input
                        type="number"
                        value={querOrdNum}
                        placeholder={t("ns1:QueryPage.QueryDetail.SorguSirasiPlaceholder")}
                        onChange={(e) => setQuerOrdNum(Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "e" || e.key === "E") e.preventDefault();
                        }}
                        className="hover:border-sky-400 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Query Builder */}
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-4">
                      <Filter className="size-4" />
                      {t("ns1:QueryPage.QueryDetail.SorguKriterleri")}
                    </h3>
                    <QueryBuilder
                      fields={[
                        ...clientFields,
                        ...companyFields,
                        ...priorityFields,
                        ...typeFields,
                        ...slaFields,
                        ...subjectFields,
                        ...(selectedCustomerRefId !== "" ? workCompanySystemInfo : []),
                      ]}
                      query={query}
                      onQueryChange={handleQueryChange}
                      resetOnOperatorChange={true}
                      controlClassnames={{
                        queryBuilder: "queryBuilder-branches custom-builder",
                        ruleGroup: "custom-rule-group",
                        rule: "custom-rule",
                      }}
                      controlElements={{
                        addRuleAction: ({ handleOnClick }) => (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOnClick}
                            className="rounded-lg border-sky-300 text-sky-700 hover:bg-sky-50 gap-1"
                          >
                            <Plus className="size-3.5" />
                            {t("ns1:QueryPage.QueryDetail.KuralEkle")}
                          </Button>
                        ),
                        addGroupAction: ({ handleOnClick }) => (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOnClick}
                            className="rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                          >
                            <FolderPlus className="size-3.5" />
                            {t("ns1:QueryPage.QueryDetail.GrupEkle")}
                          </Button>
                        ),
                        removeGroupAction: ({ handleOnClick }) => (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOnClick}
                            className="rounded-lg border-red-300 text-red-600 hover:bg-red-50 gap-1"
                          >
                            <Trash2 className="size-3.5" />
                            {t("ns1:QueryPage.QueryDetail.Kaldir")}
                          </Button>
                        ),
                        removeRuleAction: ({ handleOnClick }) => (
                          <button
                            type="button"
                            onClick={handleOnClick}
                            className="inline-flex size-7 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label={t("ns1:QueryPage.QueryDetail.Kaldir")}
                          >
                            <X className="size-4" />
                          </button>
                        ),
                      }}
                      translations={{
                        fields: { title: t("ns1:QueryPage.QueryDetail.AlanSeciniz") },
                        operators: { title: t("ns1:QueryPage.QueryDetail.OperatorSeciniz") },
                        value: { title: t("ns1:QueryPage.QueryDetail.DegerGiriniz") },
                        removeRule: {
                          label: t("ns1:QueryPage.QueryDetail.Kaldir"),
                          title: t("ns1:QueryPage.QueryDetail.Kaldir"),
                        },
                        removeGroup: {
                          label: t("ns1:QueryPage.QueryDetail.Kaldir"),
                          title: t("ns1:QueryPage.QueryDetail.Kaldir"),
                        },
                        addRule: {
                          label: t("ns1:QueryPage.QueryDetail.KuralEkle"),
                          title: t("ns1:QueryPage.QueryDetail.KuralEkle"),
                        },
                        addGroup: {
                          label: t("ns1:QueryPage.QueryDetail.GrupEkle"),
                          title: t("ns1:QueryPage.QueryDetail.GrupEkle"),
                        },
                      }}
                    />
                  </div>

                  {/* Query Output */}
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-4">
                      <Code2 className="size-4" />
                      {t("ns1:QueryPage.QueryDetail.SorguCiktisi")}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          {t("ns1:QueryPage.QueryDetail.SQLFormati")}
                        </p>
                        <pre className="bg-slate-50 border rounded-lg p-4 text-sm text-slate-700 overflow-auto leading-relaxed font-mono">
                          {formatQuery(query, "sql")}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          {t("ns1:QueryPage.QueryDetail.JSONFormati")}
                        </p>
                        <pre className="bg-slate-50 border rounded-lg p-4 text-sm text-slate-700 overflow-auto leading-relaxed font-mono">
                          {formatQuery(query, "json")}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleGoBack}
                      className="gap-1.5"
                    >
                      <ArrowLeft className="size-4" />
                      {t("ns1:QueryPage.QueryDetail.GeriDon")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsQuestionMessageBoxOpen(true)}
                      className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <RotateCcw className="size-4" />
                      {t("ns1:QueryPage.QueryDetail.Sifirla")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsQuestionMessageBoxOpenExport(true)}
                      className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="size-4" />
                      {t("ns1:QueryPage.QueryDetail.IceAktar")}
                    </Button>
                    <Button
                      onClick={saveQuery}
                      className="gap-1.5 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-200"
                    >
                      <Save className="size-4" />
                      {id
                        ? t("ns1:QueryPage.QueryDetail.MevcutSorguGuncelle")
                        : t("ns1:QueryPage.QueryDetail.YeniSorguKaydet")}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ══ ASSIGNMENT TAB ══ */}
              <TabsContent value="assignment">
                <div className="space-y-5">
                  {/* Assignment Header */}
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <h2 className="text-xl font-bold text-slate-800">
                      {t("ns1:QueryPage.QueryDetail.Atama")}
                    </h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="rounded-full"
                            aria-label="Atama bilgisi"
                          >
                            <AlertCircle className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Yapılacak sorgu sonucunda mevcut ise atama işlemi yapılacak.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Assignment Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Department */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-2">
                        <Building2 className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.AtanacakDepartman")}
                      </Label>
                      <SearchableSelect<TicketDepartmensListDto>
                        options={actionDepartments}
                        value={selectedActionDepartment}
                        onChange={setSelectedActionDepartment}
                        getLabel={(opt) => opt.departmentText ?? ""}
                        getId={(opt) => opt.id ?? ""}
                        placeholder={t("ns1:QueryPage.QueryDetail.DepartmanSeciniz")}
                      />
                    </div>

                    {/* Team */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-2">
                        <Users className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.AtanacakTakim")}
                      </Label>
                      <SearchableSelect<TicketTeamListDto>
                        options={actionTeams}
                        value={selectedActionTeam}
                        disabled={userOrTeam === "user"}
                        onChange={(val) => {
                          setSelectedActionTeam(val);
                          setUserOrTeam(val ? "team" : "");
                        }}
                        getLabel={(opt) => opt.name ?? ""}
                        getId={(opt) => opt.id ?? ""}
                        placeholder={t("ns1:QueryPage.QueryDetail.TakimSeciniz")}
                      />
                    </div>

                    {/* User */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-2">
                        <User className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.AtanacakKisi")}
                      </Label>
                      <SearchableSelect<UserAppDtoOnlyNameId>
                        options={actionUsers}
                        value={selectedActionUser}
                        disabled={userOrTeam === "team"}
                        onChange={(val) => {
                          setSelectedActionUser(val);
                          setUserOrTeam(val ? "user" : "");
                        }}
                        getLabel={(opt) =>
                          opt ? `${opt.firstName ?? ""} ${opt.lastName ?? ""}`.trim() : ""
                        }
                        getId={(opt) => opt.id ?? ""}
                        placeholder={t("ns1:QueryPage.QueryDetail.KisiSeciniz")}
                      />
                    </div>

                    {/* Workflow */}
                    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-600 mb-2">
                        <GitBranch className="size-4" />
                        {t("ns1:QueryPage.QueryDetail.IsAkisi")}
                      </Label>
                      <SearchableSelect<any>
                        options={actionWorkFlows}
                        value={selectedActionWorkFlow}
                        onChange={setSelectedActionWorkFlow}
                        getLabel={(opt) => opt?.workflowName ?? ""}
                        getId={(opt) => opt?.id ?? ""}
                        placeholder={t("ns1:QueryPage.QueryDetail.IsAkisiSeciniz")}
                      />
                    </div>
                  </div>

                  {/* Assign Button */}
                  <div className="flex justify-end pt-2">
                    <Button className="gap-1.5 bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-200">
                      <CheckCircle className="size-4" />
                      {t("ns1:QueryPage.QueryDetail.GorevAta")}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ── Confirm Dialogs ── */}
      <CustomMessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
        titleText={t("ns1:QueryPage.QueryDetail.Sifirla")}
        contentText={t("ns1:QueryPage.QueryDetail.SifirlaTeyit")}
        warningText={{
          text: t("ns1:QueryPage.QueryDetail.SifirlaTeyitAlt"),
          color: "#e74c3c",
        }}
        type="warning"
      />
      <CustomMessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpenExport}
        handleCloseQuestionBox={handleCloseQuestionBoxExport}
        titleText={t("ns1:QueryPage.QueryDetail.IceAktar")}
        contentText={t("ns1:QueryPage.QueryDetail.IceAktarBasla")}
        warningText={{ text: t("ns1:QueryPage.QueryDetail.IceAktarUyari"), color: "#f39c12" }}
        type="info"
      />

      {/* ── Info Dialog ── */}
      <Dialog
        open={isQuestionMessageBoxOpenInfo}
        onOpenChange={setIsQuestionMessageBoxOpenInfo}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center border-b pb-3">
              {content[page - 1].title}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto px-1">
            {content[page - 1].text.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: paragraph
                    .replace(/<strong>/g, '<span style="font-weight:600;color:#1976d2;">')
                    .replace(/<\/strong>/g, "</span>"),
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 pt-4 border-t mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Önceki sayfa"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: content.length }, (_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "ghost"}
                size="icon"
                onClick={() => setPage(i + 1)}
                aria-label={`Sayfa ${i + 1}`}
                aria-current={page === i + 1 ? "page" : undefined}
                className={cn(
                  "size-8 text-sm",
                  page === i + 1 && "bg-sky-600 hover:bg-sky-700 text-white"
                )}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(content.length, p + 1))}
              disabled={page === content.length}
              aria-label="Sonraki sayfa"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default QueryDetail;
