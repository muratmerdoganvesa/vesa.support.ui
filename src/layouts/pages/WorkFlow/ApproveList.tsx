import { useEffect, useState } from "react";
import {
  ApproveHeadInfo,
  ApproveItemsApi,
  ApproveItemsDto,
  ApproverStatus,
  UserApi,
  WorkFlowApi,
  WorkFlowContiuneApiDto,
  WorkFlowDefinationApi,
  WorkFlowDefinationListDto,
  WorkFlowItemApi,
} from "api/generated";
import { AxiosResponse } from "axios";
import { parse } from "date-fns";
import { tr } from "date-fns/locale";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import { useUser } from "../hooks/userName";
import { useNavigate } from "react-router-dom";
import ShowHistory from "./ShowHistory";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import getConfiguration from "confiuration";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MessageBox from "../Components/MessageBox";
import emails from "../../../approvers.json";
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  ExternalLink,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Workflow,
  User,
  Calendar,
  Monitor,
  FileText,
} from "lucide-react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { cn } from "lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTableDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// ─── Status filter tabs (same statuses as former sidebar) ─────────────────────

interface SideNavItem {
  label: string;
  icon: React.ReactNode;
  status: ApproverStatus;
  badgeCount?: number;
  badgeColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ApproveList() {
  const [historyOpen, sethistoryOpen] = useState(false);
  const navigate = useNavigate();
  const [listData, setListDto] = useState<ApproveHeadInfo>();
  const [gridData, setGridData] = useState<ApproveItemsDto[]>([]);
  const { username, setUsername } = useUser();
  const [rejectdialogOpen, setrejectdialogOpen] = useState(false);
  var [rejectText, setrejectText] = useState("");
  const [selectedInstance, setselectedInstance] = useState(null);
  const [selectedWorkFlowId, setselectedWorkFlowId] = useState("");
  const [pendingCount, setpendingCount] = useState(0);
  const [rejectCount, setrejectCount] = useState(0);
  const [approveCount, setapproveCount] = useState(0);
  const [selectedStatus, setselectedStatus] = useState<ApproverStatus>();
  const [UserDialogVisible, setUserDialogVisible] = useState(false);
  const [selectedRequestUser, setselectedRequestUser] = useState("");
  const [selectedRequestUserId, setselectedRequestUserId] = useState("");
  const [activeInput, setActiveInput] = useState<"request" | "waiting">("request");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aprHistoryOpen, setaprHistoryOpen] = useState(false);
  const [selectedTicket, setselectedTicket] = useState<string | null>(null);
  const [selectedAprHis, setselectedAprHis] = useState<string | null>(null);
  const [numberManDay, setNumberManDay] = useState<number>(0);
  var [canEditManDay, setCanEditManDay] = useState(false);
  const [lastnumberManDay, lastsetNumberManDay] = useState<number>(null);
  const [loginUserName, setLoginusername] = useState("");

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [approveDataCount, setapproveDataCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [pageCount, setpageCount] = useState(0);
  const [statusText, setstatusText] = useState("");
  const [processTypes, setProcessTypes] = useState<WorkFlowDefinationListDto[]>([]);
  const [selectedProcessType, setselectedProcessType] = useState("");
  const [selectedProcessTypeId, setselectedProcessTypeId] = useState("");
  const configuration = getConfiguration();
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [objectType, setObjectType] = useState<any>(null);
  const [description, setDescription] = useState("");

  // ── Pagination ──────────────────────────────────────────────────────────────

  const currentPage = itemsPerPage > 0 ? Math.floor(itemOffset / itemsPerPage) : 0;

  const handlePageClick = (event: any) => {
    const newOffset = (event.selected * itemsPerPage) % approveDataCount;
    getApproveDetail(
      selectedStatus!,
      newOffset,
      itemsPerPage,
      selectedProcessTypeId,
      selectedRequestUserId
    );
    console.log(`User requested page number ${event.selected}, which is offset ${newOffset}`);
    setItemOffset(newOffset);
  };

  const goToPage = (page: number) => {
    handlePageClick({ selected: page });
  };

  useEffect(() => {
    setpageCount(Math.ceil(gridData.length / itemsPerPage));
    getApproveDetail(selectedStatus!);
  }, [itemsPerPage]);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  async function getApproveList() {
    var api = new ApproveItemsApi(configuration);
    var data = await (await api.apiApproveItemsAllGet()).data;
    setListDto(data);
    setpendingCount(data.pendingCount!);
    setapproveCount(data.approveCount!);
    setrejectCount(data.rejectCount!);
    return data;
  }

  async function goTicketDetail(headId: any) {
    let api = new ApproveItemsApi(configuration);
    var res = await api.apiApproveItemsGetTicketIdGetTicketIdGet(headId);
    sessionStorage.setItem("ticketId", res.data);
    navigate("/tickets/detail/", {
      state: { ticketId: res.data, fromApr: true },
    });
  }

  async function getApproveDetail(
    status: ApproverStatus,
    skip: number = 0,
    top: number = itemsPerPage,
    processType: string = "",
    reqUserId: string = ""
  ) {
    if (status == 0) {
      setstatusText("Bekleyenler");
    } else if (status == 1) {
      setstatusText("Onaylananlar");
    } else if (status == 2) {
      setstatusText("Reddedilenler");
    } else if (status == 3) {
      setstatusText("Gönderdiklerim");
    }

    setselectedStatus(status);
    dispatchBusy({ isBusy: true });

    let api = new ApproveItemsApi(configuration);
    console.log("status", status);
    console.log("offset:", skip, top);
    console.log("processtype:", processType);
    var result = await api.apiApproveItemsGetApprovesGet(status, skip, top, processType, reqUserId);

    result.data.approveItemsDtoList!.sort((a, b) => {
      let dateA = a.workFlowItem?.workflowHead?.createdDate
        ? new Date(a.workFlowItem?.workflowHead?.createdDate).getTime()
        : 0;
      let dateB = b.workFlowItem?.workflowHead?.createdDate
        ? new Date(b.workFlowItem?.workflowHead?.createdDate).getTime()
        : 0;
      return dateB - dateA;
    });

    setGridData(result.data.approveItemsDtoList!);
    console.log(">>>>", result.data);
    dispatchBusy({ isBusy: false });

    const endOffset = itemOffset + itemsPerPage;
    console.log(`Loading items from ${itemOffset} to ${endOffset}`);
    const currentItems = result.data.approveItemsDtoList!.slice(itemOffset, endOffset);
    setapproveDataCount(result.data.count!);
    setpageCount(Math.ceil(result.data.count! / itemsPerPage));
  }

  const handleSelection = (event: any) => {
    const selectedIndices = Object.keys(event.detail.selectedRowIds).filter(
      (index) => event.detail.selectedRowIds[index]
    );
    const selectedRowsData = selectedIndices.map((index) => gridData[parseInt(index)]);
    setSelectedRows(selectedRowsData);
  };

  function multipleApprove() {
    console.log("Selected Rows:", selectedRows);
    selectedRows.forEach((row) => {
      if (row) {
        dispatchBusy({ isBusy: true });
        var workFlowApi = new WorkFlowApi(configuration);
        let contiuneDto: WorkFlowContiuneApiDto = {};
        contiuneDto.approveItem = row.id;
        contiuneDto.workFlowItemId = row.workflowItemId;
        contiuneDto.userName = username;
        contiuneDto.input = "yes";
        contiuneDto.note = "";

        workFlowApi
          .apiWorkFlowContiunePost(contiuneDto)
          .then(async (response) => {
            await getApproveDetail(selectedStatus!);
            dispatchAlert({ message: "Onay Başarılı", type: "Success" });
          })
          .catch((error) => {
            dispatchAlert({ message: "Bir hata oluştu", type: "Warning" });
          })
          .finally(() => {
            dispatchBusy({ isBusy: false });
          });

        setSelectedRows([]);
      } else {
        console.error("hata", row);
      }
    });
  }

  function multipleReject() {
    console.log("Selected Rows:", selectedRows);
    selectedRows.forEach((row) => {
      if (row) {
        dispatchBusy({ isBusy: true });
        var workFlowApi = new WorkFlowApi(configuration);
        let contiuneDto: WorkFlowContiuneApiDto = {};
        contiuneDto.approveItem = row.id;
        contiuneDto.workFlowItemId = row.workflowItemId;
        contiuneDto.userName = username;
        contiuneDto.input = "no";
        contiuneDto.note = rejectText;

        workFlowApi
          .apiWorkFlowContiunePost(contiuneDto)
          .then(async (response) => {
            await getApproveDetail(selectedStatus!);
            dispatchAlert({ message: "Red Başarılı", type: "Success" });
          })
          .catch((error) => {
            dispatchAlert({ message: "Bir hata oluştu", type: "Warning" });
          })
          .finally(() => {
            dispatchBusy({ isBusy: false });
          });

        getApproveList();
        setrejectdialogOpen(false);
        setrejectText("");
        setSelectedRows([]);
      } else {
        console.error("hata", row);
      }
    });
  }

  function onApprove(obj: any): void {
    dispatchBusy({ isBusy: true });
    var workFlowApi = new WorkFlowApi(configuration);
    let contiuneDto: WorkFlowContiuneApiDto = {};
    contiuneDto.approveItem = obj.original.id;
    contiuneDto.workFlowItemId = obj.original.workflowItemId;
    contiuneDto.userName = username;
    contiuneDto.input = "yes";
    contiuneDto.note = description;
    contiuneDto.numberManDay = numberManDay.toString();

    workFlowApi
      .apiWorkFlowContiunePost(contiuneDto)
      .then(async (response) => {
        await getApproveDetail(selectedStatus!);
        dispatchAlert({ message: "Onay Başarılı", type: "Success" });
      })
      .catch((error) => {
        dispatchAlert({ message: "Bir hata oluştu", type: "Warning" });
      })
      .finally(() => {
        dispatchBusy({ isBusy: false });
      });
  }

  async function openDetail(obj: any) {
    let api = new ApproveItemsApi(configuration);
    let result = await api.apiApproveItemsGetOpenDetailGetOpenDetailGet(
      obj.cell.row.original.workFlowItem.workflowHead.id
    );
    window.open(result.data);
  }

  function openRejectDialog(obj: any) {
    setrejectdialogOpen(true);
    setselectedInstance(obj);
  }

  function handleTextChange(event: any) {
    const newText = event.target.value;
    setrejectText(newText);
  }

  function onReject(obj: any): void {
    dispatchBusy({ isBusy: true });
    var workFlowApi = new WorkFlowApi(configuration);
    let contiuneDto: WorkFlowContiuneApiDto = {};
    contiuneDto.approveItem = obj.original.id;
    contiuneDto.workFlowItemId = obj.original.workflowItemId;
    contiuneDto.userName = username;
    contiuneDto.input = "no";
    contiuneDto.note = description;

    workFlowApi
      .apiWorkFlowContiunePost(contiuneDto)
      .then(async (response) => {
        await getApproveDetail(selectedStatus!);
        dispatchAlert({ message: "Red Başarılı", type: "Success" });
      })
      .catch((error) => {
        dispatchAlert({ message: "Bir hata oluştu", type: "Warning" });
      })
      .finally(() => {
        dispatchBusy({ isBusy: false });
      });

    getApproveList();
    setrejectdialogOpen(false);
    setrejectText("");
  }

  useEffect(() => {
    getProcessTypes();
    getApproveList();
    const defaultDate = formatDate(new Date());
    setSelectedDate(defaultDate);
    getApproveDetail(ApproverStatus.NUMBER_0);
    setselectedStatus(ApproverStatus.NUMBER_0);
    getLoginUser();
  }, []);

  async function getLoginUser() {
    var conf = getConfiguration();
    var api = new UserApi(conf);
    var data = await api.apiUserGetLoginUserDetailGet();
    setLoginusername(data.data.email);
  }

  async function onProcessComboChange(event: any) {
    console.log(event);
    const selectedItem = event.detail.item;
    var selectedItemId = selectedItem.getAttribute("data-id");
    setselectedProcessType(selectedItem.text);
    setselectedProcessTypeId(selectedItemId);
    dispatchBusy({ isBusy: true });
    await getApproveDetail(selectedStatus!, 0, itemsPerPage, selectedItemId, selectedRequestUserId);
    dispatchBusy({ isBusy: false });
  }

  async function onApproveDatePickerChange(event: any) {
    dispatchBusy({ isBusy: true });
    console.log(event);
    const selectedDate = event.detail.value;
    const selectedDateObj = parse(selectedDate, "d MMM yyyy", new Date(), { locale: tr });

    var toShowData: ApproveItemsDto[] = [];
    await getApproveList().then(async (response) => {
      var result = response!.items;
      if (result) {
        result.forEach((item) => {
          const testDateObj = new Date(item.workFlowItem?.workflowHead?.createdDate!);
          if (
            selectedDateObj.getFullYear() === testDateObj.getFullYear() &&
            selectedDateObj.getMonth() === testDateObj.getMonth() &&
            selectedDateObj.getDate() === testDateObj.getDate()
          ) {
            toShowData.push(item);
          }
        });
      }
    });
    setGridData(toShowData);
    dispatchBusy({ isBusy: false });
  }

  async function onProcessDatePickerChange(event: any) {
    dispatchBusy({ isBusy: true });
    console.log(event);
    const selectedDate = event.detail.value;
    const selectedDateObj = parse(selectedDate, "d MMM yyyy", new Date(), { locale: tr });

    var toShowData: ApproveItemsDto[] = [];
    await getApproveList().then(async (response) => {
      var result = response!.items;
      if (result) {
        result.forEach((item) => {
          const testDateObj = new Date(item.updatedDate!);
          if (
            selectedDateObj.getFullYear() === testDateObj.getFullYear() &&
            selectedDateObj.getMonth() === testDateObj.getMonth() &&
            selectedDateObj.getDate() === testDateObj.getDate()
          ) {
            toShowData.push(item);
          }
        });
      }
    });
    setGridData(toShowData);
    dispatchBusy({ isBusy: false });
  }

  async function getProcessTypes() {
    var api = new WorkFlowDefinationApi(configuration);
    var result = api
      .apiWorkFlowDefinationGet()
      .then((response: AxiosResponse<WorkFlowDefinationListDto[]>) => {
        console.log("WorkFlowDefinationApi", response.data);
        setProcessTypes(response.data);
      })
      .catch((error) => {})
      .finally(() => {});
  }

  const onRequestingUserChange = async (e: any) => {
    console.log("onRequestingUserChange", e);
    setselectedRequestUser(e.defaultFullName);
    setselectedRequestUserId(e.userId);
    setUserDialogVisible(false);
    await getApproveDetail(selectedStatus!, 0, itemsPerPage, selectedProcessTypeId, e.userId);
  };

  const handleOpenQuestionBox = (obj: any, type: string) => {
    setSelectedRow(obj);
    console.log("satır>>", obj);
    setObjectType(type);
    setIsQuestionMessageBoxOpen(true);
    setDescription("");
    getLastManDay(obj.original.workFlowItem.workflowHead.id);
    var isExist = emails.emails.find((e) => e == loginUserName);
    if (isExist != null) {
      setCanEditManDay(false);
    } else {
      setCanEditManDay(true);
    }
  };

  async function getLastManDay(workflowid: string) {
    var api = new WorkFlowItemApi(configuration);
    console.log("workflowid", workflowid);
    var data = await api.apiWorkFlowItemGetApproveItemsWorkFlowHeadIdGet(workflowid);
    console.log("getLastManDay", data.data);
    var haveManDay: any[] = [];

    data.data.forEach((item) => {
      var temp = item.approveItems[0];
      if (temp.approvedUser_RuntimeNumberManDay != null) {
        haveManDay.push(temp);
      }
    });

    if (haveManDay.length > 0) {
      haveManDay.sort((a: any, b: any) => b.createdDate - a.createdDate);
      console.log("haveManDay", haveManDay);
      lastsetNumberManDay(haveManDay[0].approvedUser_RuntimeNumberManDay);
      setNumberManDay(haveManDay[0].approvedUser_RuntimeNumberManDay);
    }
  }

  useEffect(() => {
    console.log("description", description);
  }, [description]);

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes" && objectType === "approve") {
      try {
        onApprove(selectedRow);
      } catch (error) {
        dispatchAlert({ message: "Bir hata oluştu", type: "Warning" });
      }
    }
    if (action === "Yes" && objectType === "reject") {
      try {
        onReject(selectedRow);
      } catch (error) {
        dispatchAlert({ message: "Bir hata oluştu", type: "Warning" });
      }
    }
  };

  // ── Row selection helpers ────────────────────────────────────────────────────

  const isRowSelected = (row: ApproveItemsDto) =>
    selectedRows.some((r) => r?.id === (row as any).id);

  const toggleRowSelection = (row: ApproveItemsDto) => {
    setSelectedRows((prev) =>
      isRowSelected(row) ? prev.filter((r) => r?.id !== (row as any).id) : [...prev, row]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === gridData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...gridData]);
    }
  };

  // ── Status filter definitions ────────────────────────────────────────────────

  const sideNavItems: SideNavItem[] = [
    {
      label: "Gönderdiklerim",
      icon: <Send className="w-4 h-4" />,
      status: ApproverStatus.NUMBER_3,
    },
    {
      label: "Bekleyenler",
      icon: <Clock className="w-4 h-4" />,
      status: ApproverStatus.NUMBER_0,
      badgeCount: pendingCount,
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      label: "Onaylananlar",
      icon: <CheckCircle2 className="w-4 h-4" />,
      status: ApproverStatus.NUMBER_1,
      badgeCount: approveCount,
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      label: "Red",
      icon: <XCircle className="w-4 h-4" />,
      status: ApproverStatus.NUMBER_2,
      badgeCount: rejectCount,
      badgeColor: "bg-red-100 text-red-700",
    },
  ];

  // ── Table columns ─────────────────────────────────────────────────────────────

  const showNoteColumn = selectedStatus === 1 || selectedStatus === 2;

  // ── Pagination helper ─────────────────────────────────────────────────────────

  const renderPagination = () => {
    if (pageCount <= 1) return null;

    const pages: (number | "...")[] = [];
    const maxVisible = 5;
    if (pageCount <= maxVisible + 2) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(pageCount - 2, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < pageCount - 3) pages.push("...");
      pages.push(pageCount - 1);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Toplam <span className="font-semibold text-slate-700">{approveDataCount}</span> kayıt
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-7 px-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-300 bg-white text-slate-700"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / sayfa</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => goToPage(currentPage - 1)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {pages.map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">…</span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page as number)}
                className={cn(
                  "h-7 min-w-[28px] px-2 text-xs rounded-md border transition-colors",
                  currentPage === page
                    ? "bg-violet-600 text-white border-violet-600 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => goToPage(currentPage + 1)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <DashboardLayout>
        <DashboardNavbar />

        <div
          className="flex flex-col gap-3 mt-2 mx-1 w-full min-w-0 max-w-full"
          style={{ minHeight: "calc(100vh - 120px)" }}
        >
          {/* ── Horizontal filter bar (replaces left sidebar) ── */}
          <div className="w-full min-w-0 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-100 bg-slate-50/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                  <Workflow className="w-4 h-4 text-white" aria-hidden />
                </div>
                <span className="text-sm font-semibold text-slate-700">Onay Kutusu</span>
              </div>
              <nav
                className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end sm:min-w-0"
                role="group"
                aria-label="Onay durumu filtreleri"
              >
                {sideNavItems.map((item) => {
                  const isActive = selectedStatus === item.status;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        getApproveDetail(
                          item.status,
                          0,
                          itemsPerPage,
                          selectedProcessTypeId!,
                          selectedRequestUserId!
                        )
                      }
                      className={cn(
                        "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border min-h-[40px] flex-1 basis-[calc(50%-0.25rem)] min-w-0 max-w-full sm:flex-initial sm:basis-auto sm:max-w-none",
                        isActive
                          ? "bg-violet-50 text-violet-700 font-semibold border-violet-200 shadow-sm"
                          : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <span className={cn("shrink-0", isActive ? "text-violet-600" : "text-slate-400")}>
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span
                          className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0",
                            item.badgeColor
                          )}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ── Main content: full width list ── */}
          <div className="w-full min-w-0 flex flex-col gap-3 flex-1">

            {/* Table card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden w-full min-w-0">

              {/* Table header */}
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-semibold text-slate-700">{statusText || "Onaylar"}</h2>
                  {approveDataCount > 0 && (
                    <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      {approveDataCount}
                    </span>
                  )}
                </div>

                {/* Bulk action buttons (shown when rows selected) */}
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 mr-1">
                      {selectedRows.length} seçili
                    </span>
                    <Button
                      size="sm"
                      onClick={multipleApprove}
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      onClick={multipleReject}
                      className="bg-red-600 hover:bg-red-700 text-white gap-1.5 h-8 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reddet
                    </Button>
                  </div>
                )}
              </div>

              {/* Table: tek yatay scroll, thead/tbody sütunları aynı tabloda hizalı */}
              <div className="overflow-x-auto w-full min-w-0 overscroll-x-contain">
                <table className="min-w-max mx-auto border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200">
                      {/* Checkbox */}
                      <th className="w-10 px-3 py-3 align-middle">
                        <input
                          type="checkbox"
                          checked={gridData.length > 0 && selectedRows.length === gridData.length}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600 cursor-pointer"
                          aria-label="Tümünü seç"
                        />
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        İşlemler
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          Onay No
                        </div>
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 align-middle min-w-[16rem]">
                        Detay
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Talep Eden
                        </div>
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Beklenen
                        </div>
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        İşlem Yapan
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Onaya Gönderilen
                        </div>
                      </th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          İşlem Tarihi
                        </div>
                      </th>
                      {showNoteColumn && (
                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 align-middle min-w-[12rem]">
                          {selectedStatus === 1 ? "Onay Açıklaması" : "Red Açıklaması"}
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {gridData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={showNoteColumn ? 10 : 9}
                          className="px-5 py-14 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                              <FileText className="w-7 h-7 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">
                              Gösterilecek onay kaydı bulunamadı
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      gridData.map((row, rowIdx) => {
                        const rowObj = { original: row };
                        const rowSelected = isRowSelected(row);
                        const createUserRaw = (row as any).workFlowItem?.workflowHead?.createUser;
                        const createUserStr =
                          createUserRaw != null && createUserRaw !== ""
                            ? String(createUserRaw)
                            : "-";
                        const approveUserRaw = (row as any).approveUserNameSurname;
                        const approveUserStr =
                          approveUserRaw != null && approveUserRaw !== ""
                            ? String(approveUserRaw)
                            : "-";
                        const approvedByRaw = (row as any).approvedUser_RuntimeNameSurname;
                        const approvedByStr =
                          approvedByRaw != null && approvedByRaw !== ""
                            ? String(approvedByRaw)
                            : "-";
                        const detailRaw = (row as any).workFlowItem?.workflowHead?.workFlowInfo;
                        const detailStr =
                          detailRaw != null && String(detailRaw).trim() !== ""
                            ? String(detailRaw)
                            : "-";
                        const noteRaw = (row as any).approvedUser_RuntimeNote;
                        const noteStr =
                          noteRaw != null && String(noteRaw).trim() !== ""
                            ? String(noteRaw)
                            : "-";

                        return (
                          <tr
                            key={(row as any).id ?? rowIdx}
                            className={cn(
                              "transition-colors",
                              rowSelected ? "bg-violet-50/40" : "hover:bg-slate-50/60"
                            )}
                          >
                            {/* Checkbox */}
                            <td className="w-10 px-3 py-3 align-middle">
                              <input
                                type="checkbox"
                                checked={rowSelected}
                                onChange={() => toggleRowSelection(row)}
                                className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600 cursor-pointer"
                                aria-label="Satırı seç"
                              />
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {statusText === "Bekleyenler" && (
                                  <>
                                    <button
                                      type="button"
                                      title="Onayla"
                                      onClick={() => handleOpenQuestionBox(rowObj, "approve")}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all"
                                      aria-label="Onayla"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Reddet"
                                      onClick={() => handleOpenQuestionBox(rowObj, "reject")}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                      aria-label="Reddet"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  title="Onay Geçmişi"
                                  onClick={() => {
                                    setselectedAprHis((row as any).workFlowItem?.workflowHead?.id);
                                    setaprHistoryOpen(true);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                                  aria-label="Onay Geçmişi"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Talep Detayına Git"
                                  onClick={() =>
                                    goTicketDetail((row as any).workFlowItem?.workflowHead?.id)
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-violet-500 hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all"
                                  aria-label="Talep Detayına Git"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                            {/* Onay No */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <span className="text-xs font-mono font-semibold text-violet-700 bg-violet-50 px-2 py-1 rounded-md border border-violet-100">
                                {(row as any).workFlowItem?.workflowHead?.uniqNumber ?? "-"}
                              </span>
                            </td>

                            {/* Detay — tam metin, satır kırar; tablo genişler, yatay kaydır */}
                            <td className="px-3 py-3 align-top min-w-[16rem] max-w-md">
                              <p className="text-xs text-slate-700 break-words leading-relaxed whitespace-normal">
                                {detailStr}
                              </p>
                            </td>

                            {/* Talep Eden */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                                  {getInitials((row as any).workFlowItem?.workflowHead?.createUser)}
                                </div>
                                <span className="text-xs text-slate-700">{createUserStr}</span>
                              </div>
                            </td>

                            {/* Beklenen */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <span className="text-xs text-slate-700">{approveUserStr}</span>
                            </td>

                            {/* İşlem Yapan Kullanıcı */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <span className="text-xs text-slate-700">{approvedByStr}</span>
                            </td>

                            {/* Onaya Gönderilen Tarih */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <span className="text-xs text-slate-500">
                                {formatTableDate(
                                  (row as any).workFlowItem?.workflowHead?.createdDate
                                )}
                              </span>
                            </td>

                            {/* İşlem Tarihi */}
                            <td className="px-3 py-3 align-middle whitespace-nowrap">
                              <span className="text-xs text-slate-500">
                                {formatTableDate((row as any).updatedDate)}
                              </span>
                            </td>

                            {/* Onay/Red Açıklaması (conditional) */}
                            {showNoteColumn && (
                              <td className="px-3 py-3 align-top min-w-[12rem] max-w-md">
                                <p className="text-xs text-slate-600 break-words leading-relaxed whitespace-normal">
                                  {noteStr}
                                </p>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {renderPagination()}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectdialogOpen} onOpenChange={setrejectdialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reddetme Sebebi</DialogTitle>
          </DialogHeader>
          {/* <label className="text-sm text-slate-600">Red sebebi giriniz</label> */}
          {/* <textarea onChange={handleTextChange} value={rejectText} className="w-full min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 resize-none" /> */}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setrejectdialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              İptal
            </Button>
            <Button
              onClick={() => onReject(selectedInstance)}
              className="flex-1 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white"
            >
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ShowHistory ── */}
      {aprHistoryOpen && (
        <ShowHistory
          approveId={selectedAprHis}
          open={aprHistoryOpen}
          onClose={() => setaprHistoryOpen(false)}
        />
      )}

      {/* ── MessageBox ── */}
      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
        type={objectType}
        description={description}
        setDescription={setDescription}
        numberManDay={numberManDay}
        setNumberManDay={setNumberManDay}
        canEditManDay={canEditManDay}
        lastnumberManDay={lastnumberManDay}
      />
    </>
  );
}

export default ApproveList;
