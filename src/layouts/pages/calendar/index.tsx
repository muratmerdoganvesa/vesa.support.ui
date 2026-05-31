import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Calendar from "examples/Calendar";
import React, { useState, ChangeEvent, useMemo, useEffect, useCallback, useRef } from "react";
import {
  TicketApi,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
  TicketTeamApi,
  TicketTeamUserAppInsertDto,
  UserApp,
  WorkCompanyDto,
  DepartmentUserListDto,
  UserCalendarApi,
  UserCalendarListDto,
  UserCalendarUpdateDto,
  UserCalendarInsertDto,
  WorkLocation,
  UserApi,
  UserAppDto,
} from "api/generated/api";
import { getCurrentDate, getUserInitials } from "./utils/utils";
import { calendarOptions } from "./config/calendarConfig";
import getConfiguration from "confiuration";
import "./css/styles.css";
import "./index.css";
import { useBusy } from "../hooks/useBusy";
import { useAlert } from "../hooks/useAlert";
import CustomMessageBox from "../Components/CustomMessageBox";
import { colors } from "./list";
import { useLocation, Link, useNavigate } from "react-router-dom";
import TaskModal from "./components/taskmodal";
import EventModal from "./components/eventmodal";
import {
  Check,
  X,
  Pencil,
  ChevronLeft,
  Users,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { cn } from "lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskEvent {
  title: string;
  start: string;
  end: string;
  className: string;
  client: WorkCompanyDto;
  description: string;
  id?: string | number;
}

interface DateClickArg {
  AllDay: boolean;
  end: Date;
  endStr: string;
  jsEvent: MouseEvent;
  view: object;
  start: Date;
  startStr: string;
}

interface SelectArg {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  allDay: boolean;
  jsEvent: MouseEvent;
  view: object;
}

interface DatesSetArg {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  view: {
    currentStart: Date;
    currentEnd: Date;
    type: string;
    [key: string]: any;
  };
}

interface EventContentArg {
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    startStr: string;
    endStr: string;
    extendedProps: {
      className?: string;
      customerRef?: WorkCompanyDto;
      customerRefId?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      color?: string;
      userApp?: UserApp;
      userAppId?: string;
      workLocation?: WorkLocation;
      isLeave?: boolean;
      firstName?: string;
      lastName?: string;
      mail?: string;
      [key: string]: any;
      status?: string;
      isAvailable: boolean;
    };
  };
  timeText: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  isStart: boolean;
  isEnd: boolean;
  isPast: boolean;
  isFuture: boolean;
  isToday: boolean;
  el: HTMLElement;
  view: object;
}

// ─── Inline SearchableSelect (single) ────────────────────────────────────────

interface SearchableSelectProps<T> {
  options: T[];
  value: T | null | undefined;
  onChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

function SearchableSelect<T extends { id?: any }>({
  options,
  value,
  onChange,
  getLabel,
  placeholder = "Seçiniz...",
  label,
  disabled = false,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = useMemo(
    () => options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "w-full h-9 flex items-center justify-between gap-2 px-3 border rounded-lg bg-white text-sm text-left focus:outline-none transition-all",
          disabled
            ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
            : "border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer"
        )}
      >
        <span className={value ? "text-slate-700" : "text-slate-400 text-xs"}>
          {value ? getLabel(value) : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((opt, idx) => (
                <li key={opt.id ?? idx}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                      value?.id === opt.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {value?.id === opt.id && <Check className="w-3 h-3 shrink-0" />}
                    {getLabel(opt)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── UserMultiSelect ──────────────────────────────────────────────────────────

interface UserMultiSelectProps {
  options: UserApp[];
  value: UserApp[];
  onChange: (val: UserApp[]) => void;
}

function UserMultiSelectField({ options, value, onChange }: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filtered = useMemo(
    () =>
      options.filter(
        (o) =>
          `${o.firstName ?? ""} ${o.lastName ?? ""}`.toLowerCase().includes(search.toLowerCase()) ||
          (o.userName ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  const toggle = (opt: UserApp) => {
    onChange(
      value.some((v) => v.id === opt.id)
        ? value.filter((v) => v.id !== opt.id)
        : [...value, opt]
    );
  };

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        Kullanıcı
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[36px] flex flex-wrap items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-left text-sm focus:outline-none hover:border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
      >
        {value.length === 0 ? (
          <span className="text-slate-400 text-xs">Kullanıcı seçiniz...</span>
        ) : (
          value.map((v) => (
            <span key={v.id} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-1.5 py-0.5 rounded-md">
              {v.firstName} {v.lastName}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(value.filter((u) => u.id !== v.id)); }}
                className="hover:text-indigo-900"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 ml-auto shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ad veya kullanıcı adı ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((opt) => {
                const selected = value.some((v) => v.id === opt.id);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => toggle(opt)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors border-b border-slate-50",
                        selected ? "bg-indigo-50" : "hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", selected ? "bg-indigo-500 border-indigo-500" : "border-slate-300 bg-white")}>
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="text-slate-700">{opt.firstName} {opt.lastName}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-500">{value.length} seçili</span>
              <button type="button" onClick={() => onChange([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Temizle</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function CalendarPage(): JSX.Element {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [events, setEvents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ start: "", end: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<UserCalendarListDto | null>(null);
  const [modalEventOpen, setModalEventOpen] = useState(false);
  const [selfID, setSelfID] = useState<string>("");
  const [teamUsers, setTeamUsers] = useState<UserApp[]>([]);
  const [departmentData, setDepartmentData] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<TicketDepartmensListDto | null>(null);
  const [levelData, setLevelData] = useState<any[]>([]);
  const [levelledUsers, setLevelledUsers] = useState<UserApp[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<UserApp[]>([]);
  const [isQuestionmessageBoxOpen, setIsQuestionmessageBoxOpen] = useState(false);
  const [isQuestionmessageBoxOpenLeaveEvent, setIsQuestionmessageBoxOpenLeaveEvent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventStartDate, setSelectedEventStartDate] = useState<string | null>(null);
  const [selectedEventEndDate, setSelectedEventEndDate] = useState<string | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const [selectedFieldUsers, setSelectedFieldUsers] = useState<UserApp[]>([]);
  const [userData, setUserData] = useState<UserApp[]>([]);
  const [hasPerm, setHasPerm] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── Event handlers & data fetching (unchanged) ────────────────────────────

  useEffect(() => {
    console.log("eventsss", events);
  }, [events]);

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new UserApi(conf);
      var data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
      var pureData = data.data;
      setSearchByName(pureData);
      dispatchBusy({ isBusy: false });
    }
  };

  const handleMessageBoxOpen = (eventId: string, eventStartDate: string, eventEndDate: string) => {
    setIsQuestionmessageBoxOpen(true);
    setSelectedEventId(eventId);
    setSelectedEventStartDate(eventStartDate);
    setSelectedEventEndDate(eventEndDate);
  };

  const handleCloseQuestionBox = async (action: string) => {
    if (action === "Evet") {
      await handleDeleteTask(selectedEventId, selectedEventStartDate, selectedEventEndDate);
    }
    setIsQuestionmessageBoxOpen(false);
  };

  const handleCloseQuestionBoxLeaveEvent = async (action: string) => {
    if (action === "Evet") {
      setModalOpen(true);
    }
    setIsQuestionmessageBoxOpenLeaveEvent(false);
  };

  useEffect(() => {
    const fetchIsManager = async () => {
      let conf = getConfiguration();
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckUserIsManagerGet();
      setIsManager(permData.data.perm);
    };
    const fetchHasPerm = async () => {
      let conf = getConfiguration();
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckOtherDeptpermGet();
      setHasPerm(permData.data.perm);
      if (permData.data.perm == false) {
        fetchUserDepartmentData();
      } else {
        fetchDepartmentData();
      }
    };
    const fetchSelfID = async () => {
      let conf = getConfiguration();
      let api = new TicketApi(conf);
      let data = await api.apiTicketCheckPermGet();
      setSelfID(data.data.id);
    };
    const fetchDepartmentData = async () => {
      let conf = getConfiguration();
      let api3 = new TicketDepartmentsApi(conf);
      let response = await api3.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();
      setDepartmentData(response.data);
    };
    const fetchLevelData = async () => {
      let conf = getConfiguration();
      let api = new UserApi(conf);
      let data = await api.apiUserUserLevelsGet();
      setLevelData(data.data as any);
    };
    const fetchUserData = async () => {
      let conf = getConfiguration();
      let api = new UserApi(conf);
      let data = await api.apiUserVesaUsersWithoutPhotoGet();
      setUserData(data.data as any);
    };
    const fetchUserDepartmentData = async () => {
      setIsLoading(true);
      dispatchBusy({ isBusy: true });
      let conf = getConfiguration();
      let api2 = new UserApi(conf);
      let response = await api2.apiUserUserDepartmentGet();
      setSelectedDepartment(response.data);
      try {
        let api1 = new UserCalendarApi(conf);
        const permData = await api1.apiUserCalendarCheckUserIsManagerGet();
        if (permData.data.perm == false) {
          let conf = getConfiguration();
          let api = new UserCalendarApi(conf);
          let userIds;
          if (selectedFieldUsers) {
            userIds = selectedFieldUsers.map((user) => user.id);
          }
          let data = await api.apiUserCalendarGetUsersByDepartmentAndLevelGet(
            response.data.id,
            selectedLevel?.id,
            userIds
          );
          if (hasPerm == false && isManager == false) {
            setSelectedUsers(data.data);
          }
          const filteredUsers: UserApp[] = [];
          data.data.forEach((user: UserApp) => {
            if (user) filteredUsers.push(user);
          });
          setTeamUsers(data.data);
          console.log("teamusers", data.data);
        }
      } catch (error) {
        console.log("error", error);
      } finally {
        setIsLoading(false);
        dispatchBusy({ isBusy: false });
      }
    };
    fetchIsManager();
    fetchHasPerm();
    fetchSelfID();
    fetchLevelData();
    fetchUserData();
  }, []);

  const handleDateClick = (info: DateClickArg): void => {
    setSelectedDate({ start: info.startStr, end: info.endStr });
    setModalOpen(true);
  };

  const handleDateSelect = (info: SelectArg): void => {
    let startDate = info.startStr;
    let endDate = info.endStr;
    const selectedDate = new Date(endDate);
    selectedDate.setDate(selectedDate.getDate() - 1);
    const adjustedDate = selectedDate.toISOString().split("T")[0];
    setSelectedDate({ start: startDate, end: adjustedDate });
    console.log("events", events);
    const hasEventInRange = events.some((event) => {
      if (event.color === "leave-event" || event.color === "holiday-event") {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(adjustedDate);
        return eventStart <= rangeEnd && eventEnd > rangeStart;
      }
      return false;
    });
    if (hasEventInRange) {
      setIsQuestionmessageBoxOpenLeaveEvent(true);
    } else {
      setModalOpen(true);
    }
  };

  const handleAddTask = async (newTask: UserCalendarInsertDto): Promise<void> => {
    try {
      setIsLoading(true);
      console.log("addhandle");
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      console.log("newtask", newTask);
      let data = await api.apiUserCalendarPost(newTask);
      let customYear = new Date(newTask.startDate).getFullYear();
      let customMonth = new Date(newTask.startDate).getMonth() + 1;
      fetchEvents(customYear, customMonth);
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        isAvailable: updatedTask.isAvailable,
      };
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      let data = await api.apiUserCalendarPut(updateTask);
      let customYear = new Date(updatedTask.startDate).getFullYear();
      let customMonth = new Date(updatedTask.startDate).getMonth() + 1;
      fetchEvents(customYear, customMonth);
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleDeleteTask = async (
    eventId: string | number,
    eventStartDate: string,
    eventEndDate: string
  ): Promise<void> => {
    try {
      dispatchBusy({ isBusy: true });
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      let data = await api.apiUserCalendarDelete(eventId.toString());
      dispatchAlert({ message: "Görev başarıyla silindi", type: "Success" });
      let customYear = new Date(eventStartDate).getFullYear();
      let customMonth = new Date(eventStartDate).getMonth() + 1;
      fetchEvents(customYear, customMonth);
    } catch (error) {
      console.log("error", error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ── Custom event rendering ────────────────────────────────────────────────────

  const renderEventContent = (eventInfo: EventContentArg) => {
    const formatDate = (date: Date | null | undefined) => {
      if (!date) {
        return eventInfo.event.extendedProps.start || eventInfo.event.startStr;
      }
      try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error("Error formatting date:", error);
        return eventInfo.event.extendedProps.start || eventInfo.event.startStr;
      }
    };

    if (eventInfo.event.extendedProps.isLeave) {
      return (
        <div className="leave-event-simple">
          <span className="leave-name-reason">
            <strong title={`${eventInfo.event.title} - ${eventInfo.event.extendedProps.status}`}>
              {eventInfo.event.extendedProps.firstName} {eventInfo.event.extendedProps.lastName}
            </strong>
            : {eventInfo.event.title}
          </span>
        </div>
      );
    }

    if (eventInfo.event.extendedProps.isHoliday) {
      return (
        <div className="holiday-event-simple">
          <span className="holiday-name" title={eventInfo.event.title}>
            {eventInfo.event.title}
          </span>
        </div>
      );
    }

    const taskData: UserCalendarListDto = {
      id: eventInfo.event.id,
      name: eventInfo.event.title,
      startDate: eventInfo.event.extendedProps.startDate || formatDate(eventInfo.event.start),
      endDate: eventInfo.event.extendedProps.endDate || formatDate(eventInfo.event.end),
      description: eventInfo.event.extendedProps.description || "",
      customerRef: eventInfo.event.extendedProps.customerRef || null,
      color: eventInfo.event.extendedProps.color || "",
      userAppDto: eventInfo.event.extendedProps.userAppDto || null,
      customerRefId: eventInfo.event.extendedProps.customerRefId || null,
      userAppId: eventInfo.event.extendedProps.userAppId || null,
      percentage: eventInfo.event.extendedProps.percentage || "0",
      workLocation: eventInfo.event.extendedProps.workLocation || null,
      userAppDtoWithoutPhoto: eventInfo.event.extendedProps.userAppDtoWithoutPhoto || null,
      isAvailable: eventInfo.event.extendedProps.isAvailable || false,
    };

    return (
      <div className="custom-event-container" style={{ backgroundColor: taskData.color }}>
        <div className="available-button">
          <div className="available-status-indicator">
            {taskData.isAvailable ? (
              <div className="available-status available">
                <Check className="w-3 h-3" style={{ backgroundColor: "rgba(104,216,108,0.9)" }} />
                <span className="text-xs">Müsait</span>
              </div>
            ) : (
              <div className="available-status unavailable" style={{ visibility: "hidden" }}>
                <X className="w-3 h-3" />
                <span className="text-xs">Müsait Değil</span>
              </div>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <div
            className="action-button edit"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedEvent({
                id: taskData.id,
                name: taskData.name || "",
                startDate: taskData.startDate || "",
                endDate: taskData.endDate || "",
                color: taskData.color || "",
                customerRef: taskData.customerRef || null,
                description: taskData.description || "",
                userAppDto: taskData.userAppDto || null,
                customerRefId: taskData.customerRefId || null,
                userAppId: taskData.userAppId || null,
                percentage: taskData.percentage || "0",
                workLocation: taskData.workLocation || null,
                isAvailable: taskData.isAvailable || false,
              });
              console.log("selectedeventttt", taskData.isAvailable);
              console.log("taskData", taskData);
              setModalEventOpen(true);
            }}
          >
            <Pencil className="w-2.5 h-2.5" />
          </div>

          <div
            className="action-button delete"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleMessageBoxOpen(
                eventInfo.event.id,
                eventInfo.event.extendedProps.startDate || formatDate(eventInfo.event.start),
                eventInfo.event.extendedProps.endDate || formatDate(eventInfo.event.end)
              );
            }}
          >
            <X className="w-2.5 h-2.5" />
          </div>
        </div>

        <div className="event-content">
          {eventInfo.timeText && <div className="event-time">{eventInfo.timeText}</div>}
          <div className="event-title">
            {taskData.userAppDto && (
              <div className="flex items-center gap-1 mb-0.5">
                <img
                  src={`data:image/jpeg;base64,${taskData.userAppDto.photo}`}
                  alt={`${taskData.userAppDto.firstName ?? ""} ${taskData.userAppDto.lastName ?? ""}`}
                  className="w-7 h-7 rounded-full object-cover border border-white/30 mr-1 shrink-0"
                />
                <span className="text-[11px] font-semibold opacity-95">
                  {taskData.userAppDto.firstName} {taskData.userAppDto.lastName}
                </span>
              </div>
            )}
            {taskData.name}
          </div>
          {taskData.customerRef && (
            <div className="event-client">{taskData.customerRef.name}</div>
          )}
        </div>
      </div>
    );
  };

  const handleUserClick = (user: UserApp) => {
    setTimeout(() => {
      setSelectedUsers((prevUsers) => {
        const isAlreadySelected = prevUsers.some((u) => u.id === user.id);
        if (isAlreadySelected) {
          return prevUsers.filter((u) => u.id !== user.id);
        } else {
          return [...prevUsers, user];
        }
      });
    }, 0);
  };

  const fetchEvents = useCallback(
    async (customYear?: number, customMonth?: number) => {
      if (!selectedDepartment && !selectedLevel && selectedFieldUsers.length === 0) return;
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new UserCalendarApi(conf);
        const userIds =
          selectedUsers.length > 0
            ? selectedUsers.map((user) => user.id)
            : teamUsers.map((user) => user.id);
        const userEmails = selectedUsers.map((user) => user.email);
        if (userIds.length === 0) {
          setEvents([]);
          return;
        }
        const now = new Date();
        const year = customYear;
        const month = customMonth;
        console.log("year and month", year, month);
        const { data: userLeavesAndHolidays } =
          (await api.apiUserCalendarGetEmployeeLeavesByMonthlyGet(year, month, userEmails)) as any;
        console.log("userLeavesAndHolidays raw response:", userLeavesAndHolidays);

        interface LeaveItem {
          pernr: string;
          atext: string;
          begda: string;
          endda: string;
          vorna: string;
          nachn: string;
          mail: string;
          status: string;
        }
        interface HolidayItem {
          tarih: string;
          resmi_Tatil: string;
        }

        const leaveItems: LeaveItem[] = [];
        const holidayItems: HolidayItem[] = [];

        if (userLeavesAndHolidays && typeof userLeavesAndHolidays === "object") {
          if (userLeavesAndHolidays.holidays && Array.isArray(userLeavesAndHolidays.holidays)) {
            console.log("Found holidays array:", userLeavesAndHolidays.holidays);
            holidayItems.push(...userLeavesAndHolidays.holidays);
          }
          for (const key in userLeavesAndHolidays) {
            console.log(`Checking key: ${key}`, userLeavesAndHolidays[key]);
            if (key === "holidays" && Array.isArray(userLeavesAndHolidays[key])) {
              holidayItems.push(...userLeavesAndHolidays[key]);
            } else if (key === "leaves" && Array.isArray(userLeavesAndHolidays[key])) {
              leaveItems.push(...userLeavesAndHolidays[key]);
            }
          }
        }
        if (userLeavesAndHolidays && Array.isArray(userLeavesAndHolidays)) {
          userLeavesAndHolidays.forEach((response: any) => {
            if (response.leaves && Array.isArray(response.leaves)) {
              leaveItems.push(...response.leaves);
            } else if (Array.isArray(response)) {
              leaveItems.push(...response);
            }
            if (response.holidays && Array.isArray(response.holidays)) {
              holidayItems.push(...response.holidays);
            }
          });
        }

        console.log("Extracted leave items:", leaveItems);
        console.log("Extracted holiday items:", holidayItems);

        const uniqueLeaves = new Map<string, LeaveItem>();
        leaveItems.forEach((leave: LeaveItem) => {
          const key = `${leave.pernr}-${leave.begda}-${leave.endda}`;
          if (!uniqueLeaves.has(key)) uniqueLeaves.set(key, leave);
        });
        const uniqueHolidays = new Map<string, HolidayItem>();
        holidayItems.forEach((holiday: HolidayItem) => {
          if (!uniqueHolidays.has(holiday.tarih)) uniqueHolidays.set(holiday.tarih, holiday);
        });

        const leaveEvents = Array.from(uniqueLeaves.values()).map((leave: LeaveItem) => {
          const endDate = new Date(leave.endda);
          endDate.setDate(endDate.getDate() + 1);
          const adjustedEndDate = endDate.toISOString().split("T")[0];
          return {
            id: `leave-${leave.pernr}-${leave.begda}`,
            title: leave.atext,
            start: leave.begda,
            end: adjustedEndDate,
            allDay: true,
            color: "leave-event",
            extendedProps: {
              isLeave: true,
              mail: leave.mail,
              firstName: leave.vorna,
              lastName: leave.nachn,
              status: leave.status,
            },
          };
        });

        const holidayEvents = Array.from(uniqueHolidays.values()).map((holiday: HolidayItem) => {
          const startDate = holiday.tarih;
          const endDate = new Date(holiday.tarih);
          endDate.setDate(endDate.getDate() + 1);
          const adjustedEndDate = endDate.toISOString().split("T")[0];
          return {
            id: `holiday-${holiday.tarih}`,
            title: holiday.resmi_Tatil,
            start: startDate,
            end: adjustedEndDate,
            allDay: true,
            color: "holiday-event",
            extendedProps: {
              isHoliday: true,
              holidayName: holiday.resmi_Tatil,
            },
          };
        });

        const { data } = await api.apiUserCalendarGetByUsersGet(year, month, userIds);
        const calendarEvents = data.map((task: any) => {
          const selectedDate = new Date(task.endDate);
          selectedDate.setDate(selectedDate.getDate() + 1);
          const adjustedDate = selectedDate.toISOString();
          var endDate = task.endDate == task.startDate ? task.endDate : adjustedDate;
          return {
            id: task.id,
            title: task.name,
            start: task.startDate,
            end: endDate,
            allDay: true,
            className: task.color,
            isAvailable: task.isAvailable,
            extendedProps: {
              customerRef: task.customerRef,
              customerRefId: task.customerRefId,
              description: task.description,
              startDate: task.startDate,
              endDate: endDate,
              color: task.color,
              userAppDto: task.userAppDto,
              userAppId: task.userAppId,
              percentage: task.percentage,
              workLocation: task.workLocation,
            },
          };
        });

        setTimeout(() => {
          setEvents([...calendarEvents, ...leaveEvents, ...holidayEvents]);
        }, 0);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    },
    [selectedUsers, teamUsers, dispatchBusy, setEvents]
  );

  useEffect(() => {
    if (selectedUsers.length > 0) {
      console.log("calıştı");
      const timer = setTimeout(() => {
        let customYear = new Date(selectedEventDate.start).getFullYear();
        let customMonth = new Date(selectedEventDate.start).getMonth() + 1;
        fetchEvents(customYear, customMonth);
        console.log("calıştı gitti");
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setEvents([]);
    }
  }, [selectedUsers, fetchEvents]);

  const handleGetUsers = async () => {
    if (!selectedDepartment && !selectedLevel && selectedFieldUsers.length === 0) {
      dispatchAlert({
        message: "Lütfen bir departman veya seviye veya kullanıcı seçin",
        type: "Error",
      });
      return;
    }
    if (selectedDepartment || selectedLevel || selectedFieldUsers) {
      try {
        dispatchBusy({ isBusy: true });
        let conf = getConfiguration();
        let api = new UserCalendarApi(conf);
        let userIds;
        if (selectedFieldUsers) {
          userIds = selectedFieldUsers.map((user) => user.id);
        }
        let data = await api.apiUserCalendarGetUsersByDepartmentAndLevelGet(
          selectedDepartment?.id,
          selectedLevel?.id,
          userIds
        );
        if (hasPerm == false && isManager == false) {
          setSelectedUsers(data.data);
        }
        const filteredUsers: UserApp[] = [];
        data.data.forEach((user: UserApp) => {
          if (user) filteredUsers.push(user);
        });
        setTeamUsers(data.data);
      } catch (erorr) {
        dispatchAlert({ message: "Bir hata oluştu" + erorr, type: "Error" });
        dispatchBusy({ isBusy: false });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    } else {
      setTeamUsers([]);
    }
    setSelectedUsers([]);
  };

  const resetSelections = () => {
    setSelectedUsers([]);
    setTeamUsers([]);
    if (hasPerm) {
      setSelectedDepartment(null);
      setSelectedLevel(null);
      setSelectedFieldUsers([]);
    } else if (isManager) {
      setSelectedLevel(null);
      setSelectedFieldUsers([]);
    }
  };

  useEffect(() => {
    console.log("selectedUsers", selectedUsers);
  }, [selectedUsers]);

  const goToCalendar = () => {
    navigate("/calendar");
  };

  // ── Memoized Calendar ─────────────────────────────────────────────────────────

  const MemoizedCalendar = useMemo(
    () => (
      <div className="calendar-container">
        <Calendar
          initialView="dayGridMonth"
          initialDate={getCurrentDate()}
          events={events}
          selectable
          editable={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          select={handleDateSelect}
          eventContent={renderEventContent}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "09:00",
            endTime: "18:00",
          }}
          weekends={true}
          allDaySlot={true}
          handleWindowResize={false}
          rerenderDelay={10}
          datesSet={(dateInfo: DatesSetArg) => {
            const currentDate = dateInfo.view.currentStart;
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            setSelectedEventDate({
              start: currentDate.toISOString(),
              end: currentDate.toISOString(),
            });
            if (selectedUsers.length > 0) {
              fetchEvents(year, month);
            }
          }}
        />
      </div>
    ),
    [events, selectedUsers, fetchEvents]
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <DashboardNavbar />

        {/* ── Sidebar ── */}
        <div className="team-members">
          {/* Header */}
          <div className="team-members__header">
            <h5 className="team-members__title flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={goToCalendar}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-2.5 py-2 rounded-lg transition-all hover:-translate-y-0.5 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Departman Üyeleri
            </h5>
            <div className="team-members__count">{teamUsers.length} Üye</div>
          </div>

          {/* Department filter */}
          <div className="team-members__department-select">
            <SearchableSelect
              options={departmentData}
              value={selectedDepartment}
              onChange={(val) => setSelectedDepartment(val)}
              getLabel={(o) => o.departmentText ?? ""}
              label="Departman"
              placeholder="Departman seçiniz..."
              disabled={hasPerm == false}
            />
          </div>

          {/* Level filter */}
          {(hasPerm == true || isManager == true) && (
            <div className="team-members__department-select">
              <SearchableSelect
                options={levelData}
                value={selectedLevel}
                onChange={(val) => setSelectedLevel(val)}
                getLabel={(o) => o.description ?? ""}
                label="Seviye"
                placeholder="Seviye seçiniz..."
              />
            </div>
          )}

          {/* User multi-select (admin/perm only) */}
          {hasPerm == true && (
            <div className="mb-3">
              <UserMultiSelectField
                options={userData}
                value={selectedFieldUsers}
                onChange={setSelectedFieldUsers}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end items-center gap-2 mt-3 flex-wrap">
            {(selectedDepartment || selectedLevel || selectedFieldUsers.length > 0) && (
              <Button
                type="button"
                onClick={() => resetSelections()}
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm rounded-lg transition-all hover:-translate-y-0.5"
              >
                Sıfırla
              </Button>
            )}

            <Button
              type="button"
              onClick={() => handleGetUsers()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg transition-all hover:-translate-y-0.5"
            >
              Getir
            </Button>

            {teamUsers.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (selectedUsers.length === teamUsers.length) {
                    setSelectedUsers([]);
                  } else {
                    setSelectedUsers([...teamUsers]);
                  }
                }}
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all hover:-translate-y-0.5"
              >
                {selectedUsers.length === teamUsers.length ? "Tümünü Kaldır" : "Tümünü Seç"}
              </Button>
            )}
          </div>

          {/* User grid */}
          <div className="team-members__scroll-container">
            <div className="team-members__grid">
              {teamUsers.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                const initials = getUserInitials(user.firstName, user.lastName);
                const hasPhoto = user.photo && user.photo.length > 0;

                return (
                  <div key={user.id} className="team-members__avatar">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <div
                              className={`avatar-container ${isSelected ? "selected" : ""}`}
                              onClick={() => handleUserClick(user)}
                              tabIndex={0}
                              aria-label={`Select ${user.firstName} ${user.lastName}`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleUserClick(user);
                                }
                              }}
                            >
                              {hasPhoto ? (
                                <img
                                  src={`data:image/jpeg;base64,${user.photo}`}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className={cn(
                                    "w-10 h-10 rounded-full object-cover transition-all duration-300",
                                    isSelected
                                      ? "border-2 border-pink-500"
                                      : "border-2 border-transparent"
                                  )}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 select-none",
                                    isSelected
                                      ? "bg-blue-500 text-white border-2 border-blue-500"
                                      : "bg-slate-200 text-slate-600 border-2 border-slate-200"
                                  )}
                                >
                                  {initials}
                                </div>
                              )}
                              {isSelected && (
                                <div className="avatar-check-icon">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: hasPhoto ? "2px" : "10px",
                              }}
                            >
                              <p>{user.firstName}</p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-white border border-slate-200 text-slate-800 shadow-md">
                          <div className="text-xs">
                            <p className="font-semibold">{user.firstName} {user.lastName}</p>
                            {user.department && (
                              <p className="text-slate-500 mt-0.5">{user.department}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>

            {teamUsers.length === 0 && (
              <div className="team-members__empty-state">
                <Users className="team-members__empty-icon w-10 h-10 text-slate-300" />
                <p className="team-members__empty-text">
                  Henüz Departman Üyeleri bulunmamaktadır.
                </p>
                <p className="team-members__empty-subtext">
                  Departman seçimi yaptıktan sonra üyeleri görüntüleyebilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Calendar ── */}
        {MemoizedCalendar}

        {/* ── Modals ── */}
        <TaskModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={selectedDate}
          onAddTask={handleAddTask}
          selectedUsers={selectedUsers.length == 1 ? selectedUsers[0] : null}
        />
        <EventModal
          open={modalEventOpen}
          onClose={() => setModalEventOpen(false)}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onEditEvent={handleEditTask}
        />
      </div>

      <CustomMessageBox
        titleText="Silme İşlemi"
        contentText="Mevcut Event Silinecektir."
        type="warning"
        isQuestionmessageBoxOpen={isQuestionmessageBoxOpen}
        warningText={{ text: "Bu işlem geri alınamaz. Emin misiniz?", color: "red" }}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
      <CustomMessageBox
        titleText="İzin veya Tatil Çakışması"
        contentText="Bu tarihte izin veya resmi tatil bulunmaktadır. Devam etmek istiyor musunuz?"
        type="question"
        isQuestionmessageBoxOpen={isQuestionmessageBoxOpenLeaveEvent}
        handleCloseQuestionBox={handleCloseQuestionBoxLeaveEvent}
      />
    </DashboardLayout>
  );
}

export default CalendarPage;
