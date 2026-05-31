import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { format, endOfDay, startOfDay } from "date-fns";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { MessageBoxType } from "@ui5/webcomponents-react";
import ActivityManagement from "./activity-management";
import ExpenseManagement from "./expense-management";
import ActivityCreateDialog from "./activity-create-dialog";
import ActivityWeeklyHoursGapDialog from "./activity-weekly-hours-gap-dialog";
import {
  ActivityCenterActivitiesApi,
  ActivityCenterByIdDto,
  ActivityCenterExpensesApi,
  ActivityCenterInsertDto,
  ActivityCenterListDto,
  ActivityCenterUpdateDto,
  ActivityPeriodSettingsApi,
  ActivityHoursGapDto,
  EnumOptionDto,
  ExpenseCenterInsertDto,
  ExpenseCenterListDto,
  ExpenseCenterUpdateDto,
  TicketProjectsApi,
  UserApi,
  WorkCompanyApi,
} from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { getCurrentMonthRange } from "./date-range-toolbar-control";
import { ActivityFormState } from "./types";

const formatDateTimeForApi = (value: Date) => format(value, "yyyy-MM-dd'T'HH:mm:ss");

const pickNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/** API hata gövdesi: message, errors: string[] veya errors: { [key]: string[] } */
const getMessageFromApiErrorBody = (data: unknown): string | undefined => {
  if (data == null) return undefined;
  const asString = pickNonEmptyString(data);
  if (asString) return asString;
  if (typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const direct =
    pickNonEmptyString(obj.message) ??
    pickNonEmptyString(obj.Message) ??
    pickNonEmptyString(obj.title) ??
    pickNonEmptyString(obj.Title);
  if (direct) return direct;
  const nestedErrors = obj.errors ?? obj.Errors;
  if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
    const firstEntry = nestedErrors[0];
    const fromStringArray = pickNonEmptyString(firstEntry);
    if (fromStringArray) return fromStringArray;
  }
  if (nestedErrors && typeof nestedErrors === "object" && !Array.isArray(nestedErrors)) {
    const firstKey = Object.keys(nestedErrors as Record<string, unknown>)[0];
    if (firstKey) {
      const arr = (nestedErrors as Record<string, unknown>)[firstKey];
      if (Array.isArray(arr) && typeof arr[0] === "string") {
        return pickNonEmptyString(arr[0]);
      }
    }
  }
  return undefined;
};

const dispatchAlertForActivityCenterMutationError = (
  dispatchAlert: (args: { message: string; type: string }) => void,
  error: unknown,
  defaultMessage: string,
) => {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    const serverMessage = getMessageFromApiErrorBody(error.response.data);
    dispatchAlert({
      message: serverMessage ?? defaultMessage,
      type: MessageBoxType.Warning,
    });
    return;
  }
  dispatchAlert({
    message: defaultMessage,
    type: MessageBoxType.Error,
  });
};

const initialActivityFormState: ActivityFormState = {
  date: "",
  customerId: "",
  projectId: "",
  subProjectId: "",
  effortPlaceId: "",
  requestId: "",
  referencePersonnel: "",
  requester: "",
  activityHour: "",
  invoiceHour: "",
  description: "",
};

function ActivityCenterPage() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [activeTab, setActiveTab] = useState("activity");
  const [activityRows, setActivityRows] = useState<ActivityCenterListDto[]>([]);
  const [customerOptions, setCustomerOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; label: string; customerId?: string }>>([]);
  const [ticketOptions, setTicketOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [referencePersonnelOptions, setReferencePersonnelOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [workLocationOptions, setWorkLocationOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseCenterListDto[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [activityDateRange, setActivityDateRange] = useState(() => getCurrentMonthRange());
  const [expenseDateRange, setExpenseDateRange] = useState(() => getCurrentMonthRange());
  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [weeklyHoursGapItems, setWeeklyHoursGapItems] = useState<ActivityHoursGapDto[]>([]);
  const [weeklyHoursGapDialogOpen, setWeeklyHoursGapDialogOpen] = useState(false);
  const [isActivityCenterPeriodOpen, setIsActivityCenterPeriodOpen] = useState(false);
  const [activityDialogMode, setActivityDialogMode] = useState<"create" | "edit">("create");
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState(initialActivityFormState);
  const activityCustomerMap = activityRows.reduce<Record<string, string>>((acc, item) => {
    if (item.id) {
      acc[item.id] = item.workCompanyName ?? "-";
    }
    return acc;
  }, {});

  const fetchActivityCenterPeriodOpen = useCallback(async () => {
    try {
      const api = new ActivityPeriodSettingsApi(getConfiguration());
      const res = await api.apiActivityPeriodSettingsIsActivityCenterPeriodOpenForLoginUserGet();
      setIsActivityCenterPeriodOpen(res.data === true);
    } catch {
      setIsActivityCenterPeriodOpen(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterActivitiesApi(getConfiguration());
      const startDate = formatDateTimeForApi(startOfDay(activityDateRange.from));
      const endDate = formatDateTimeForApi(endOfDay(activityDateRange.to));
      const response = await api.apiActivityCenterActivitiesGet(startDate, endDate);
      setActivityRows(response.data ?? []);
    } catch (error) {
      dispatchAlert({
        message: "Aktivite listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [activityDateRange.from, activityDateRange.to, dispatchAlert, dispatchBusy]);

  const fetchCustomers = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new WorkCompanyApi(getConfiguration());
      const response = await api.apiWorkCompanyGet();
      const mappedCustomers = (response.data ?? [])
        .filter((item) => item.id && item.name)
        .map((item) => ({
          id: item.id as string,
          label: item.name as string,
        }));
      setCustomerOptions(mappedCustomers);
    } catch (error) {
      dispatchAlert({
        message: "Musteri listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  const fetchWorkLocations = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterActivitiesApi(getConfiguration());
      const response = await api.apiActivityCenterActivitiesWorkLocationsGet();
      const workLocationOptionsResponse: EnumOptionDto[] = response.data ?? [];
      const mappedWorkLocations = workLocationOptionsResponse
        .filter((item) => item.key !== undefined && item.description)
        .map((item) => ({
          id: String(item.key),
          label: item.description as string,
        }));
      setWorkLocationOptions(mappedWorkLocations);
    } catch (error) {
      dispatchAlert({
        message: "Efor yeri listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  const fetchProjects = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new TicketProjectsApi(getConfiguration());
      const response = await api.apiTicketProjectsGetActiveProjectsOnlyNameGet();
      const mappedProjects = (response.data ?? [])
        .filter((item) => item.id && item.name)
        .map((item) => ({
          id: item.id as string,
          label: item.name as string,
          customerId: item.workCompanyId ?? undefined,
        }));
      setProjectOptions(mappedProjects);
    } catch (error) {
      dispatchAlert({
        message: "Proje listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  const fetchAssignedTickets = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterActivitiesApi(getConfiguration());
      const response = await api.apiActivityCenterActivitiesAssignedTicketsGet();
      const mappedTickets = (response.data ?? [])
        .filter((item) => item.id)
        .map((item) => ({
          id: item.id as string,
          label: `#${item.uniqNumber ?? "-"} - ${item.title ?? "Talep"}`,
        }));
      setTicketOptions(mappedTickets);
    } catch (error) {
      dispatchAlert({
        message: "Talep listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  const fetchReferencePersonnel = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new UserApi(getConfiguration());
      const response = await api.apiUserGetAllUsersNameIdOnlyGet();
      const mappedUsers = (response.data ?? [])
        .filter((item) => item.id)
        .map((item) => {
          const fullName = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim();
          return {
            id: item.id as string,
            label: fullName || item.userName || "Kullanici",
          };
        });
      setReferencePersonnelOptions(mappedUsers);
    } catch (error) {
      dispatchAlert({
        message: "Referans personel listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  const fetchExpenses = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterExpensesApi(getConfiguration());
      const startDate = formatDateTimeForApi(startOfDay(expenseDateRange.from));
      const endDate = formatDateTimeForApi(endOfDay(expenseDateRange.to));
      const response = await api.apiActivityCenterExpensesGet(startDate, endDate);
      setExpenseRows(response.data ?? []);
    } catch (error) {
      dispatchAlert({
        message: "Masraf listesi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy, expenseDateRange.from, expenseDateRange.to]);

  useEffect(() => {
    void fetchActivityCenterPeriodOpen();
  }, [fetchActivityCenterPeriodOpen]);

  useEffect(() => {
    const fetchWeeklyActivityCheck = async () => {
      try {
        const api = new ActivityCenterActivitiesApi(getConfiguration());
        const res = await api.apiActivityCenterActivitiesCheckActivitiesMonthlyGet();
        const list = res.data ?? [];
        if (list.length > 0) {
          setWeeklyHoursGapItems(list);
          setWeeklyHoursGapDialogOpen(true);
        } else {
          setWeeklyHoursGapItems([]);
          setWeeklyHoursGapDialogOpen(false);
        }
      } catch {
        setWeeklyHoursGapItems([]);
        setWeeklyHoursGapDialogOpen(false);
      }
    };
    void fetchWeeklyActivityCheck();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchWorkLocations();
  }, [fetchWorkLocations]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchAssignedTickets();
  }, [fetchAssignedTickets]);

  useEffect(() => {
    fetchReferencePersonnel();
  }, [fetchReferencePersonnel]);

  useEffect(() => {
    if (activeTab !== "expense") return;
    fetchExpenses();
  }, [activeTab, fetchExpenses]);

  const handleDeleteActivity = async () => {
    if (!selectedActivityId) return;
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterActivitiesApi(getConfiguration());
      await api.apiActivityCenterActivitiesDelete(selectedActivityId);
      dispatchAlert({
        message: "Aktivite kaydi basariyla silindi.",
        type: MessageBoxType.Success,
      });
      setSelectedActivityId(null);
      await fetchActivities();
      await fetchActivityCenterPeriodOpen();
    } catch (error) {
      dispatchAlertForActivityCenterMutationError(
        dispatchAlert,
        error,
        "Aktivite kaydi silinirken hata olustu.",
      );
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpenseId) return;
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterExpensesApi(getConfiguration());
      await api.apiActivityCenterExpensesDelete(selectedExpenseId);
      dispatchAlert({
        message: "Masraf kaydı başarıyla silindi.",
        type: MessageBoxType.Success,
      });
      setSelectedExpenseId(null);
      await fetchExpenses();
      await fetchActivityCenterPeriodOpen();
    } catch (error) {
      dispatchAlertForActivityCenterMutationError(
        dispatchAlert,
        error,
        "Masraf kaydı silinirken hata oluştu.",
      );
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleSaveExpense = async (payload: ExpenseCenterUpdateDto) => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterExpensesApi(getConfiguration());

      if (payload.id) {
        const updatePayload: ExpenseCenterUpdateDto = {
          id: payload.id,
          activityId: payload.activityId,
          expenseCenter: payload.expenseCenter,
          mainExpenseType: payload.mainExpenseType,
          subExpenseType: payload.subExpenseType,
          currencyType: payload.currencyType,
          amount: payload.amount,
          description: payload.description ?? null,
          hasReceipt: Boolean(payload.hasReceipt),
          receiptNumber: payload.receiptNumber ?? null,
          documentsBase64Json: payload.documentsBase64Json ?? null,
        };
        await api.apiActivityCenterExpensesPut(updatePayload);
      } else {
        const createPayload: ExpenseCenterInsertDto = {
          activityId: payload.activityId,
          expenseCenter: payload.expenseCenter,
          mainExpenseType: payload.mainExpenseType,
          subExpenseType: payload.subExpenseType,
          currencyType: payload.currencyType,
          amount: payload.amount,
          description: payload.description ?? null,
          hasReceipt: Boolean(payload.hasReceipt),
          receiptNumber: payload.receiptNumber ?? null,
          documentsBase64Json: payload.documentsBase64Json ?? null,
        };
        await api.apiActivityCenterExpensesPost(createPayload);
      }

      dispatchAlert({
        message: payload.id
          ? "Masraf kaydı başarıyla güncellendi."
          : "Masraf kaydı başarıyla oluşturuldu.",
        type: MessageBoxType.Success,
      });
      setActiveTab("expense");
      await fetchExpenses();
      await fetchActivityCenterPeriodOpen();
    } catch (error) {
      dispatchAlertForActivityCenterMutationError(
        dispatchAlert,
        error,
        payload.id
          ? "Masraf kaydı güncellenirken hata oluştu."
          : "Masraf kaydı oluşturulurken hata oluştu.",
      );
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const findOptionIdByLabel = (options: Array<{ id: string; label: string }>, label?: string | null) => {
    const normalizedLabel = (label ?? "").trim().toLowerCase();
    if (!normalizedLabel) return "";
    const match = options.find((item) => item.label.trim().toLowerCase() === normalizedLabel);
    return match?.id ?? "";
  };

  const mapByIdDetailToForm = (detail: ActivityCenterByIdDto) => {
    const workLocationId =
      detail.workLocation !== undefined && detail.workLocation !== null
        ? String(detail.workLocation)
        : "";
    return {
      date: detail.activityDate ? detail.activityDate.split("T")[0] : "",
      customerId: detail.workCompanyId ?? "",
      projectId: detail.ticketProjectId ?? "",
      subProjectId: detail.subTicketProjectId ?? "",
      effortPlaceId: workLocationId,
      requestId: detail.ticketId ?? "",
      referencePersonnel: detail.referenceEmployeeId ?? "",
      requester: detail.requesterOfTicket ?? "",
      activityHour: String(detail.activityHours ?? ""),
      invoiceHour: detail.billableHours != null ? String(detail.billableHours) : "",
      description: detail.description ?? "",
    };
  };

  const handleSelectActivity = (id: string) => {
    setSelectedActivityId(id);
  };

  const handleOpenEditActivity = async () => {
    if (!selectedActivityId) return;
    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterActivitiesApi(getConfiguration());
      const response = await api.apiActivityCenterActivitiesGetByIdGet(selectedActivityId);
      const detail = response.data;
      if (!detail?.id) return;

      setActivityForm(mapByIdDetailToForm(detail));
      setEditingActivityId(detail.id ?? selectedActivityId);
      setActivityDialogMode("edit");
      setOpenActivityDialog(true);
    } catch (error) {
      dispatchAlert({
        message: "Aktivite detayi yuklenirken hata olustu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleSave = async () => {
    if (!activityForm.date || !activityForm.customerId || !activityForm.requestId) {
      dispatchAlert({
        message: "Tarih, müşteri ve talep alanı zorunludur.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    if (!activityForm.projectId || !activityForm.subProjectId) {
      dispatchAlert({
        message: "Proje ve alt proje alanı zorunludur.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    const activityHours = Number(activityForm.activityHour || "0");
    if (!Number.isFinite(activityHours) || activityHours <= 0) {
      dispatchAlert({
        message: "Aktivite saati 0'dan büyük olmalı.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    const billableHours = activityForm.invoiceHour ? Number(activityForm.invoiceHour) : null;
    if (billableHours !== null && (!Number.isFinite(billableHours) || billableHours < 0)) {
      dispatchAlert({
        message: "Fatura saati geçerli bir sayı olmalı.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    const workLocation = activityForm.effortPlaceId ? Number(activityForm.effortPlaceId) : undefined;
    if (workLocation !== undefined && !Number.isFinite(workLocation)) {
      dispatchAlert({
        message: "Efor yeri degeri gecersiz.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      const api = new ActivityCenterActivitiesApi(getConfiguration());
      if (activityDialogMode === "edit" && editingActivityId) {
        const updatePayload: ActivityCenterUpdateDto = {
          id: editingActivityId,
          activityDate: activityForm.date,
          workCompanyId: activityForm.customerId,
          ticketId: activityForm.requestId,
          ticketProjectId: activityForm.projectId,
          subTicketProjectId: activityForm.subProjectId,
          referenceEmployeeId: activityForm.referencePersonnel || null,
          requesterOfTicket: activityForm.requester || null,
          activityHours,
          billableHours,
          workLocation,
          description: activityForm.description || null,
        };
        var xxxx = await api.apiActivityCenterActivitiesPut(updatePayload);
        console.log("xxxx",xxxx)
      } else {
        const createPayload: ActivityCenterInsertDto = {
          activityDate: activityForm.date,
          workCompanyId: activityForm.customerId,
          ticketId: activityForm.requestId,
          ticketProjectId: activityForm.projectId,
          subTicketProjectId: activityForm.subProjectId,
          referenceEmployeeId: activityForm.referencePersonnel || null,
          requesterOfTicket: activityForm.requester || null,
          activityHours,
          billableHours,
          workLocation,
          description: activityForm.description || null,
        };
        await api.apiActivityCenterActivitiesPost(createPayload);
      }
      dispatchAlert({
        message: activityDialogMode === "edit"
          ? "Aktivite kaydı başarıyla güncellendi."
          : "Aktivite kaydı başarıyla oluşturuldu.",
        type: MessageBoxType.Success,
      });
      setOpenActivityDialog(false);
      setActivityDialogMode("create");
      setEditingActivityId(null);
      setActivityForm(initialActivityFormState);
      await fetchActivities();
      await fetchActivityCenterPeriodOpen();
    } catch (error) {
      dispatchAlertForActivityCenterMutationError(
        dispatchAlert,
        error,
        activityDialogMode === "edit"
          ? "Aktivite kaydı güncellenirken hata oluştu."
          : "Aktivite kaydı oluşturulurken hata oluştu.",
      );
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="px-4 md:px-6 py-6 flex flex-col gap-5 min-h-[calc(100vh-10rem)]">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-slate-100 px-4 pt-2">
              <TabsList className="gap-0 bg-transparent -mb-px rounded-none h-auto p-0">
                <TabsTrigger
                  value="activity"
                  className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 rounded-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-0 data-[state=active]:text-[#3e5d8f] data-[state=active]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:border-slate-200"
                >
                  Aktivite Yönetimi
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 rounded-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-0 data-[state=active]:text-[#3e5d8f] data-[state=active]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:border-slate-200"
                >
                  Masraf Yönetimi
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="activity" className="m-0">
              <ActivityManagement
                rows={activityRows}
                selectedId={selectedActivityId}
                dateRangeFrom={activityDateRange.from}
                dateRangeTo={activityDateRange.to}
                isPeriodOpen={isActivityCenterPeriodOpen}
                onDateRangeChange={setActivityDateRange}
                onSelectRow={handleSelectActivity}
                onDelete={handleDeleteActivity}
                onEdit={handleOpenEditActivity}
                onOpenCreate={() => {
                  setActivityDialogMode("create");
                  setEditingActivityId(null);
                  setActivityForm(initialActivityFormState);
                  setOpenActivityDialog(true);
                }}
                onSaveExpense={handleSaveExpense}
              />
            </TabsContent>

            <TabsContent value="expense" className="m-0">
              <ExpenseManagement
                rows={expenseRows}
                activityCustomerMap={activityCustomerMap}
                selectedId={selectedExpenseId}
                dateRangeFrom={expenseDateRange.from}
                dateRangeTo={expenseDateRange.to}
                isPeriodOpen={isActivityCenterPeriodOpen}
                onDateRangeChange={setExpenseDateRange}
                onSelectRow={setSelectedExpenseId}
                onDelete={handleDeleteExpense}
                onSaveExpense={handleSaveExpense}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ActivityWeeklyHoursGapDialog
        open={weeklyHoursGapDialogOpen}
        items={weeklyHoursGapItems}
        onOpenChange={setWeeklyHoursGapDialogOpen}
      />
      <ActivityCreateDialog
        open={openActivityDialog}
        mode={activityDialogMode}
        form={activityForm}
        customers={customerOptions}
        projects={projectOptions}
        tickets={ticketOptions}
        referencePersonnelOptions={referencePersonnelOptions}
        effortPlaces={workLocationOptions}
        isPeriodOpen={isActivityCenterPeriodOpen}
        onOpenChange={setOpenActivityDialog}
        onFormChange={setActivityForm}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}

export default ActivityCenterPage;
