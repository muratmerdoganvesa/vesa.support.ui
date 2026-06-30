import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterCalendar, { filterData } from "../components/filter/filter";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";

import {
  HolidaysAndLeavesDto,
  UserCalendarApi,
  UserCalendarListDto,
  UserWeeklyTasksDto,
  UserCalendarUpdateDto,
  TicketDepartmentsApi,
  PositionsApi,
  UserApi,
} from "api/generated";
import * as XLSX from "xlsx";
import {
  Check,
  X,
  Plus,
  Download,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { cn } from "lib/utils";

// ─── Color palette ────────────────────────────────────────────────────────────

export const colors = {
  primary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  text: {
    primary: "#1E293B",
    secondary: "#64748B",
    disabled: "#94A3B8",
  },
  background: {
    paper: "#FFFFFF",
    default: "#F8FAFC",
    hover: "#F1F5F9",
  },
  border: "#E2E8F0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTaskColor = (percentage: number): string => {
  const percentValue = Number(percentage);
  if (percentValue < 25) return colors.success;
  if (percentValue < 50) return "#f9a825";
  if (percentValue < 75) return colors.warning;
  if (percentValue <= 100) return colors.error;
  return colors.primary;
};

// ─── Availability badge ────────────────────────────────────────────────────────

const AvailableBadge = () => (
  <span className="ml-1.5 inline-flex shrink-0 items-center gap-0.5 rounded-full border border-green-700/40 bg-green-500/90 px-1.5 py-px text-[10px] font-semibold text-white shadow-sm">
    <Check className="size-2.5" aria-hidden />
    <span className="text-[9px] font-semibold tracking-tight">Müsait</span>
  </span>
);

const UnavailableBadge = () => (
  <span
    className="invisible ml-1.5 inline-flex shrink-0 items-center gap-0.5 rounded-full border border-red-700/40 bg-red-500/90 px-1.5 py-px text-[10px] font-semibold text-white shadow-sm"
    aria-hidden
  >
    <X className="size-2.5" />
    <span className="text-[9px] font-semibold tracking-tight">Müsait Değil</span>
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

function CalendarList() {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [modalEventOpen, setModalEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ start: "", end: "" });
  const navigate = useNavigate();
  const [hasPerm, setHasPerm] = useState(false);
  const [leavesAndHolidays, setLeavesAndHolidays] = useState<HolidaysAndLeavesDto>({
    leaves: [],
    holidays: [],
  });
  const [dataTableData, setDataTableData] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [positionsData, setPositionsData] = useState<any[]>([]);
  const [departmentsData, setDepatmentsData] = useState<any[]>([]);
  const [filterParams, setFilterParams] = useState({
    week: 0,
    year: new Date().getFullYear(),
    departmentId: "",
    userIds: [] as string[],
    levelId: 0,
    userMail: [],
    daysOfWeek: [] as string[],
    percentageId: [] as number[],
    isGetAll: false,
  });
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<UserCalendarListDto | null>(null);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchDepartmentsData();
    fetchPositionsData();
  }, []);

  useEffect(() => {
    if (filterParams.week > 0) {
      if (hasPerm == false && filterParams.departmentId != "" && filterParams.userIds.length > 0) {
        handleFetchTableData();
      } else if (hasPerm == true) {
        handleFetchTableData();
      }
    }
  }, [filterParams]);

  // ── Data ops ─────────────────────────────────────────────────────────────────

  const handleEditTask = async (updatedTask: UserCalendarListDto): Promise<void> => {
    try {
      let updateTask: UserCalendarUpdateDto = {
        id: updatedTask.id,
        name: updatedTask.name,
        startDate: updatedTask.startDate,
        endDate: updatedTask.endDate,
        percentage: updatedTask.percentage,
        customerRefId: updatedTask.customerRefId,
        userAppId: updatedTask.userAppId,
        description: updatedTask.description,
        workLocation: updatedTask.workLocation,
      };
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      let data = await api.apiUserCalendarPut(updateTask);
      let customYear = new Date(updatedTask.startDate).getFullYear();
      let customMonth = new Date(updatedTask.startDate).getMonth() + 1;
      handleFetchTableData();
    } catch (error) {
    }
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const dayNum = now.getDay() === 0 ? 7 : now.getDay();
    const thursday = new Date(now);
    thursday.setDate(now.getDate() + (4 - dayNum));
    const yearStart = new Date(thursday.getFullYear(), 0, 1);
    const firstDayNum = yearStart.getDay() === 0 ? 7 : yearStart.getDay();
    const firstThursday = new Date(yearStart);
    firstThursday.setDate(yearStart.getDate() + (4 - firstDayNum));
    const diff = thursday.getTime() - firstThursday.getTime();
    const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    return week;
  };

  const transformDataForTable = (
    data: UserWeeklyTasksDto[],
    leavesAndHolidayss: HolidaysAndLeavesDto,
  ): any[] => {
    if (!data || data.length === 0) return [];
    const tableData: any[] = [];

    data.forEach((weeklyTask) => {
      const dayTaskMap = {
        monday: [] as any[],
        tuesday: [] as any[],
        wednesday: [] as any[],
        thursday: [] as any[],
        friday: [] as any[],
        saturday: [] as any[],
        sunday: [] as any[],
      };

      if (weeklyTask.tasks && weeklyTask.tasks.length > 0) {
        weeklyTask.tasks.forEach((task) => {
          if (!task.daysOfWeek) return;
          if (task.daysOfWeek[0]) dayTaskMap.monday.push(task);
          if (task.daysOfWeek[1]) dayTaskMap.tuesday.push(task);
          if (task.daysOfWeek[2]) dayTaskMap.wednesday.push(task);
          if (task.daysOfWeek[3]) dayTaskMap.thursday.push(task);
          if (task.daysOfWeek[4]) dayTaskMap.friday.push(task);
          if (task.daysOfWeek[5]) dayTaskMap.saturday.push(task);
          if (task.daysOfWeek[6]) dayTaskMap.sunday.push(task);
        });
      }

      const firstTask = weeklyTask.tasks?.[0];
      const userInfo = firstTask?.userAppDtoWithoutPhoto ?? {
        firstName: weeklyTask?.firstName || "",
        lastName: weeklyTask?.lastName || "",
        email: weeklyTask?.email || "",
        ticketDepartmentId: weeklyTask?.ticketDepartmentId || "",
        positionId: weeklyTask?.positionId || "",
      };

      tableData.push({
        id: weeklyTask.userId,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        department:
          departmentsData.find((d) => d.id === userInfo.ticketDepartmentId)?.departmentText || "",
        position: positionsData.find((d) => d.id === userInfo.positionId)?.name || "",
        email: userInfo.email,
        monday: dayTaskMap.monday,
        tuesday: dayTaskMap.tuesday,
        wednesday: dayTaskMap.wednesday,
        thursday: dayTaskMap.thursday,
        friday: dayTaskMap.friday,
        saturday: dayTaskMap.saturday,
        sunday: dayTaskMap.sunday,
        leaves: leavesAndHolidayss.leaves,
        holidays: leavesAndHolidayss.holidays,
      });
    });

    return tableData;
  };

  useEffect(() => {
    const fetchDeptData = async () => {
      let conf = getConfiguration();
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckOtherDeptpermGet();
      setHasPerm(permData.data.perm);
      const week = getCurrentWeek();
      setCurrentWeek(week);

      if (permData.data.perm == false) {
        let api2 = new UserApi(conf);
        let response = await api2.apiUserUserDepartmentGet();
        const departmentId = response.data.id || null;
        setFilterParams((prev) => ({ ...prev, week, departmentId }));
      } else {
        setFilterParams((prev) => ({ ...prev, week }));
      }
    };
    fetchDeptData();
  }, []);

  const handleFetchTableData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      let response = await api.apiUserCalendarGetTasksByWeeklyGet(
        filterParams.year,
        filterParams.week,
        filterParams.userIds.length ? filterParams.userIds : undefined,
        filterParams.departmentId || undefined,
        filterParams.levelId || undefined,
        filterParams.daysOfWeek.length ? filterParams.daysOfWeek : undefined,
        filterParams.percentageId.length ? filterParams.percentageId : undefined,
        filterParams.isGetAll || undefined,
      );
      let leavesResponse = await api.apiUserCalendarGetEmployeeLeavesByWeeklyGet(
        filterParams.year,
        filterParams.week,
        filterParams.userMail.length ? filterParams.userMail : undefined,
      );

      if (response.data && leavesResponse.data) {
        const transformedData = transformDataForTable(response.data, leavesResponse.data);
        setDataTableData(transformedData);
        setLeavesAndHolidays(leavesResponse.data);
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
      dispatchAlert({
        message: "Haftalık görev verileri yüklenirken bir hata oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchPositionsData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let conf = getConfiguration();
      let api = new PositionsApi(conf);
      let response = await api.apiPositionsGetPositionsByCompanyGet(
        "2e5c2ba5-3eb8-414d-8bc7-08dd44716854",
      );
      setPositionsData(response.data);
    } catch (error) {
      dispatchAlert({
        message: "Pozisyon bilgisi çekilirken bir hata oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let conf = getConfiguration();
      let api = new TicketDepartmentsApi(conf);
      let response = await api.apiTicketDepartmentsAllFilteredCompanyGet(
        "2e5c2ba5-3eb8-414d-8bc7-08dd44716854",
      );
      setDepatmentsData(response.data);
    } catch (error) {
      dispatchAlert({
        message: "Departman bilgisi çekilirken bir hata oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleFilterApply = (filterData: filterData) => {
    setFilterParams({
      week: parseInt(filterData.week) || currentWeek,
      year: parseInt(filterData.year) || currentYear,
      departmentId: filterData.selectedDepartmentForm || "",
      userIds: filterData.selectedUsers?.map((user: any) => user.id) || [],
      userMail: filterData.selectedUsers?.map((user: any) => user.email) || [],
      levelId: filterData.selectedLevelForm || null,
      daysOfWeek: (filterData.selectedDays || []).map(String),
      percentageId: (filterData.selectedPercentage || []).map(Number),
      isGetAll: filterData.showAll ?? false,
    });
    setCurrentPage(0);
  };

  const isTeamManager = () => {
    navigate("/calendar/detail");
  };

  // ── Cell renderer ─────────────────────────────────────────────────────────────

  const renderTasksWithTooltip = (tasks: any, day: string, row?: any) => {
    const email: string = row?.original?.email ?? "";

    if (!tasks || tasks.length === 0) {
      const holiday = leavesAndHolidays.holidays?.find((h: any) => h.dayOfWeek === day);
      const leave = leavesAndHolidays.leaves?.find(
        (l: any) => l.dayOfWeek === day && l.mail.toLowerCase() === email.toLowerCase(),
      );

      if (holiday) {
        return (
          <div className="w-full">
            <div className="flex items-center rounded border border-blue-100 bg-blue-50 px-2 py-1">
              <span className="truncate text-xs font-medium text-blue-700">
                {holiday.resmi_Tatil}
              </span>
            </div>
          </div>
        );
      }

      if (leave) {
        return (
          <div className="w-full">
            <div className="flex items-center rounded border border-purple-100 bg-purple-50 px-2 py-1">
              <span className="truncate text-xs font-medium text-purple-700">{leave.atext}</span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex w-full items-center justify-center">
          <span className="text-sm text-slate-300">—</span>
        </div>
      );
    }

    const mainTask = tasks[0];
    const taskColor = getTaskColor(mainTask.percentage);

    const holiday = leavesAndHolidays.holidays?.find((h: any) => h.dayOfWeek === day);
    const leave = leavesAndHolidays.leaves?.find(
      (l: any) => l.dayOfWeek === day && l.mail.toLowerCase() === email.toLowerCase(),
    );

    /** Single task pill */
    const TaskPill = ({ task, color }: { task: any; color: string }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex cursor-pointer items-center justify-between gap-1 rounded-md px-2 py-1 text-xs"
              style={{ color: "#fff", backgroundColor: color }}
            >
              <span className="truncate">{`${task.name} - ${task.customerRef?.name || ""}`}</span>
              {task.isAvailable ? <AvailableBadge /> : <UnavailableBadge />}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[300px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
          >
            <p className="break-words text-xs font-medium text-slate-700">
              {`${task.name} - ${task.customerRef?.name || ""}`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const holidayBadge = holiday && (
      <div className="flex items-center rounded border border-blue-100 bg-blue-50 px-2 py-1">
        <span className="truncate text-xs font-medium text-blue-700">{holiday.resmi_Tatil}</span>
      </div>
    );

    const leaveBadge = leave && (
      <div className="flex items-center rounded border border-purple-100 bg-purple-50 px-2 py-1">
        <span className="truncate text-xs font-medium text-purple-700">
          {tasks.length === 1 ? (
            <>
              <span className="text-gray-800">İzinli - </span>
              {leave.atext}
            </>
          ) : (
            leave.atext
          )}
        </span>
      </div>
    );

    if (tasks.length === 1) {
      return (
        <div className="w-full space-y-1">
          {holidayBadge}
          {leaveBadge}
          <TaskPill task={mainTask} color={taskColor} />
        </div>
      );
    }

    // Multiple tasks — show first + count badge, full list on hover tooltip
    const countBadge = (
      <span
        className="shrink-0 rounded bg-white px-1 py-0.5 text-xs font-semibold"
        style={{ color: taskColor }}
      >
        +{tasks.length - 1}
      </span>
    );

    const cardContent = (
      <div className="w-full space-y-1">
        {holidayBadge}
        {leaveBadge}
        <div
          className="flex cursor-pointer items-center justify-between gap-1 rounded-md px-2 py-1 text-xs"
          style={{ color: "#fff", backgroundColor: taskColor }}
        >
          <span className="truncate">{`${mainTask.name} - ${mainTask.customerRef?.name || ""}`}</span>
          <div className="flex shrink-0 items-center gap-1">
            {mainTask.isAvailable ? <AvailableBadge /> : <UnavailableBadge />}
            {countBadge}
          </div>
        </div>
      </div>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full cursor-pointer">{cardContent}</div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[300px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
          >
            <div className="space-y-1.5">
              {holiday && (
                <div className="rounded border border-blue-100 bg-blue-50 px-2 py-1">
                  <span className="text-xs font-medium text-blue-700">{holiday.resmi_Tatil}</span>
                </div>
              )}
              {leave && (
                <div className="rounded border border-purple-100 bg-purple-50 px-2 py-1">
                  <span className="text-xs font-medium text-purple-700">{leave.atext}</span>
                </div>
              )}
              <p className="mb-1 text-xs font-semibold text-slate-500">Görevler:</p>
              {tasks.map((task: any, index: number) => {
                const color = getTaskColor(task.percentage);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                    style={{ color: "#fff", backgroundColor: color }}
                  >
                    <span className="break-words font-medium">
                      {`${task.name} - ${task.customerRef?.name || ""}`}
                    </span>
                    {task.isAvailable ? <AvailableBadge /> : <UnavailableBadge />}
                  </div>
                );
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // ── Column definitions ────────────────────────────────────────────────────────

  const tableColumns = [
    { Header: "Ad", accessor: "firstName", width: "120px" },
    { Header: "Soyad", accessor: "lastName", width: "120px" },
    { Header: "Departman", accessor: "department", width: "120px" },
    { Header: "Pozisyon", accessor: "position", width: "120px" },
    {
      Header: "Pazartesi",
      accessor: "monday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "monday", row),
      width: "150px",
    },
    {
      Header: "Salı",
      accessor: "tuesday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "tuesday", row),
      width: "150px",
    },
    {
      Header: "Çarşamba",
      accessor: "wednesday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "wednesday", row),
      width: "150px",
    },
    {
      Header: "Perşembe",
      accessor: "thursday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "thursday", row),
      width: "150px",
    },
    {
      Header: "Cuma",
      accessor: "friday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "friday", row),
      width: "150px",
    },
    {
      Header: "Cumartesi",
      accessor: "saturday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "saturday", row),
      width: "150px",
    },
    {
      Header: "Pazar",
      accessor: "sunday",
      Cell: ({ value, row }: { value: any; row: any }) =>
        renderTasksWithTooltip(value, "sunday", row),
      width: "150px",
    },
  ];

  const dayColumns = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // ── Search + pagination ───────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return dataTableData;
    const q = searchQuery.toLowerCase();
    return dataTableData.filter(
      (row) =>
        row.firstName?.toLowerCase().includes(q) ||
        row.lastName?.toLowerCase().includes(q) ||
        row.department?.toLowerCase().includes(q) ||
        row.position?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q),
    );
  }, [dataTableData, searchQuery]);

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const pagedData = filteredData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  // ── Date / Excel helpers ──────────────────────────────────────────────────────

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleExcelExport = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      let response = await api.apiUserCalendarGetTasksByWeeklyGet(
        filterParams.year,
        filterParams.week,
        filterParams.userIds.length ? filterParams.userIds : undefined,
        filterParams.departmentId || undefined,
        filterParams.levelId || undefined,
        filterParams.daysOfWeek.length ? filterParams.daysOfWeek : undefined,
        filterParams.percentageId || undefined,
      );

      if (response.data) {
        type ExportRow = {
          Firstname: string;
          Lastname: string;
          Customer: string;
          Task: string;
          StartDate: string;
          EndDate: string;
          Description: string;
          WorkloadPercentage: string;
        };

        const columns: (keyof ExportRow)[] = [
          "Firstname",
          "Lastname",
          "Customer",
          "Task",
          "StartDate",
          "EndDate",
          "Description",
          "WorkloadPercentage",
        ];

        const dataToExport: ExportRow[] = response.data.flatMap((item) =>
          item.tasks.map((task) => ({
            Firstname: task.userAppDtoWithoutPhoto?.firstName ?? "",
            Lastname: task.userAppDtoWithoutPhoto?.lastName ?? "",
            Customer: task.customerRef?.name ?? "",
            Task: task.name ?? "",
            StartDate: formatDate(task.startDate) ?? "",
            EndDate: formatDate(task.endDate) ?? "",
            Description: task.description ?? "",
            WorkloadPercentage: task.percentage != null ? "%" + task.percentage : "",
          })),
        );

        const ws = XLSX.utils.json_to_sheet(dataToExport, { header: columns as string[] });
        const columnWidths = columns.map((col) => {
          const maxLength = Math.max(
            col.length,
            ...dataToExport.map((row) => (row[col] ?? "").toString().length),
          );
          return { wch: maxLength + 2 };
        });
        ws["!cols"] = columnWidths;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Weekly Tasks");
        const fileName = `${filterParams.week}-${filterParams.year}_Tasks.xlsx`;
        XLSX.writeFile(wb, fileName);
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
      dispatchAlert({
        message: "Haftalık görev verileri yüklenirken bir hata oluştu",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mx-1 mt-1 space-y-4">
        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
              <CalendarDays className="size-5 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                Ekip Planlama
              </h1>
              <span className=" text-sm text-muted-foreground">
                Ekip planlama yapın, görevlerinizi planlayın ve daha fazlasını yapın
              </span>
            </div>
          </div>
          <Button
            type="button"
            onClick={isTeamManager}
            className="shrink-0 gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="size-4" aria-hidden />
            Yeni Görev Oluştur
          </Button>
        </div>

        {/* ── Filter ───────────────────────────────────────────────── */}
        <FilterCalendar
          initialWeek={currentWeek}
          initialYear={currentYear}
          onFilterApply={handleFilterApply}
        />

        {/* ── Table Card ───────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-muted/30 px-5 py-3.5">
            {/* Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="Ad, soyad, departman ara..."
                aria-label="Tabloda ara"
                className="h-9 w-64 rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Per-page selector */}
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  Sayfa başına:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  aria-label="Sayfa başına kayıt sayısı"
                  className="h-9 rounded-lg border border-border/60 bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  {[5, 10, 15, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Excel export */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExcelExport}
                className="gap-2 border-border/60 text-muted-foreground hover:bg-accent"
              >
                <Download className="size-4" aria-hidden />
                Excel Export
              </Button>
            </div>
          </div>

          {/* Table — first two columns are sticky */}
          <div className="relative overflow-x-auto">
            <table className="min-w-full divide-y divide-border/50 text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  {tableColumns.map((col, colIdx) => (
                    <th
                      key={col.accessor}
                      style={{ minWidth: col.width }}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap",
                        colIdx === 0 && "sticky left-0 z-10 bg-muted/40",
                        colIdx === 1 && "sticky left-[120px] z-10 bg-muted/40",
                      )}
                    >
                      {col.Header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40 bg-card">
                {pagedData.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
                          <CalendarDays className="size-7 text-muted-foreground/40" aria-hidden />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {dataTableData.length === 0
                            ? "Haftalık görev verisi bulunamadı"
                            : "Arama kriterine uygun kayıt bulunamadı"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, rowIdx) => (
                    <tr
                      key={row.id ?? rowIdx}
                      className="transition-colors hover:bg-accent/30"
                    >
                      {/* Sticky col 1: Ad */}
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 whitespace-nowrap transition-colors hover:bg-accent/30">
                        <span className="text-sm font-semibold text-foreground">
                          {row.firstName}
                        </span>
                      </td>

                      {/* Sticky col 2: Soyad */}
                      <td className="sticky left-[120px] z-10 bg-card px-4 py-2.5 whitespace-nowrap transition-colors hover:bg-accent/30">
                        <span className="text-sm text-foreground/80">{row.lastName}</span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {row.department || "—"}
                        </span>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                          {row.position || "—"}
                        </span>
                      </td>

                      {/* Day columns */}
                      {dayColumns.map((day) => (
                        <td key={day} className="min-w-[150px] max-w-[180px] px-2 py-2">
                          {renderTasksWithTooltip(row[day], day, { original: row })}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {pageCount > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-card px-5 py-3">
              <span className="text-xs text-muted-foreground">
                {filteredData.length} kayıttan{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * itemsPerPage + 1, filteredData.length)}–
                  {Math.min((currentPage + 1) * itemsPerPage, filteredData.length)}
                </span>{" "}
                gösteriliyor
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  aria-label="Önceki sayfa"
                  className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" aria-hidden />
                </button>

                {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
                  const page =
                    pageCount <= 7
                      ? i
                      : currentPage < 4
                        ? i
                        : currentPage > pageCount - 5
                          ? pageCount - 7 + i
                          : currentPage - 3 + i;
                  if (page < 0 || page >= pageCount) return null;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Sayfa ${page + 1}`}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={cn(
                        "h-7 min-w-[28px] rounded-md border px-1.5 text-xs transition-colors",
                        currentPage === page
                          ? "border-indigo-600 bg-indigo-600 font-semibold text-white"
                          : "border-border/60 text-foreground/70 hover:bg-accent",
                      )}
                    >
                      {page + 1}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  aria-label="Sonraki sayfa"
                  className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EventModal — commented out in original, preserved */}
        {/* <EventModal
          open={modalEventOpen}
          onClose={() => setModalEventOpen(false)}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onEditEvent={handleEditTask}
        /> */}
      </div>
    </DashboardLayout>
  );
}

export default CalendarList;
