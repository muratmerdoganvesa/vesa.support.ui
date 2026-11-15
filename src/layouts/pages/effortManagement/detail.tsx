import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  RotateCcw,
  Send,
  Timer,
  UserRound,
} from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "components/ui/breadcrumb";
import { Button } from "components/ui/button";
import { Skeleton } from "components/ui/skeleton";
import { Textarea } from "components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { cn } from "lib/utils";
import {
  assignCustomerApprovalUser,
  claimEffortManagement,
  decideCustomerApproval,
  fetchEffortApprovalUsers,
  fetchEffortManagementDetail,
  fetchEffortManagementEfforts,
  managerApproveEffort,
  markMailEffortRequested,
  readEffortApiError,
  returnEffortManagement,
} from "./api";
import { downloadApprovedEffortHtml } from "./approvedEffortReport";
import { openExternalEffortMailInOutlook } from "./effortMailDraft";
import {
  EffortAlert,
  EffortEmptyState,
  EffortInfoItem,
  EffortPageHeader,
  EffortPageShell,
  EffortStatusBadge,
  effortPrimaryButtonClass,
  effortSecondaryButtonClass,
  formatDateTime,
  formatHours,
  formatManDays,
} from "./shared";
import { TicketEffortStatus } from "./types";
import type {
  TicketEffortManagementDetailDto,
  TicketEffortManagementEffortsDto,
  TicketEffortManagementUserOptionDto,
} from "./types";

type ApprovalActionTab = "submit" | "self-approve" | "return" | "decide";
type DetailSectionTab = "approval" | "summary" | "description" | "comments" | "efforts";
type ConfirmAction = "approve" | "reject" | "return" | "manager-approve" | null;

const detailTabTriggerClass =
  "gap-2 px-4 text-[13px] font-medium transition-all data-[state=active]:font-semibold data-[state=active]:text-[#3e5d8f] sm:px-5";

const DetailSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/40">
    <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />
    <div className="border-b border-slate-100 px-5 pt-5 pb-4 md:px-6">
      <Skeleton className="mb-3 h-5 w-48" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-28 rounded-lg" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-100 p-4">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  </div>
);

const StatusBanner = ({
  tone,
  title,
  meta,
  body,
  action,
}: {
  tone: "violet" | "indigo" | "emerald" | "rose";
  title: string;
  meta?: string;
  body?: ReactNode;
  action?: ReactNode;
}) => {
  const tones = {
    violet: "border-violet-100 bg-violet-50 text-violet-900",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-900",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
    rose: "border-rose-100 bg-rose-50 text-rose-900",
  } as const;
  const metaTones = {
    violet: "text-violet-800",
    indigo: "text-indigo-800",
    emerald: "text-emerald-800",
    rose: "text-rose-800",
  } as const;
  const bodyTones = {
    violet: "text-violet-950",
    indigo: "text-indigo-950",
    emerald: "text-emerald-950",
    rose: "text-rose-950",
  } as const;

  return (
    <section className={cn("rounded-2xl border px-5 py-4", tones[tone])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {meta && <p className={cn("mt-1 text-xs", metaTones[tone])}>{meta}</p>}
          {body && <div className={cn("mt-2 whitespace-pre-wrap text-sm", bodyTones[tone])}>{body}</div>}
        </div>
        {action}
      </div>
    </section>
  );
};

const EffortManagementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const approvalSectionRef = useRef<HTMLElement | null>(null);
  const [detail, setDetail] = useState<TicketEffortManagementDetailDto | null>(null);
  const [efforts, setEfforts] = useState<TicketEffortManagementEffortsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [returning, setReturning] = useState(false);
  const [approvalUsers, setApprovalUsers] = useState<TicketEffortManagementUserOptionDto[]>([]);
  const [approvalUserId, setApprovalUserId] = useState("");
  const [approvalSearch, setApprovalSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [managerApproveNote, setManagerApproveNote] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [managerApproving, setManagerApproving] = useState(false);
  const [approvalActionTab, setApprovalActionTab] = useState<ApprovalActionTab>("submit");
  const [detailSectionTab, setDetailSectionTab] = useState<DetailSectionTab>("summary");
  const [creatingMail, setCreatingMail] = useState(false);
  const [submittingForApproval, setSubmittingForApproval] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const load = async (recordId: string) => {
    const [detailData, effortData] = await Promise.all([
      fetchEffortManagementDetail(recordId),
      fetchEffortManagementEfforts(recordId),
    ]);
    setDetail(detailData);
    setEfforts(effortData);
    setApprovalUserId(detailData.customerApprovedByUserId ?? "");
    if (detailData.canAssignCustomerApproval) {
      const users = await fetchEffortApprovalUsers(recordId);
      setApprovalUsers(users);
      return;
    }
    setApprovalUsers([]);
  };

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await load(id);
      } catch (loadError) {
        setDetail(null);
        setEfforts(null);
        setError(readEffortApiError(loadError));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  useEffect(() => {
    if (loading || !detail) return;

    const hasApprovalActions =
      detail.status !== TicketEffortStatus.CustomerApproved &&
      (Boolean(detail.canManagerApprove) ||
        Boolean(detail.canReturn) ||
        Boolean(detail.canDecideCustomerApproval));

    if (window.location.hash === "#approve") {
      setDetailSectionTab("approval");
      if (detail.canDecideCustomerApproval) {
        setApprovalActionTab("decide");
      }
      const timer = window.setTimeout(() => {
        approvalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }

    setDetailSectionTab(hasApprovalActions ? "approval" : "summary");
  }, [loading, detail?.id]);

  const handleClaim = async () => {
    if (!id || claiming) return;
    try {
      setClaiming(true);
      setError("");
      await claimEffortManagement(id);
      await load(id);
    } catch (claimError) {
      setError(readEffortApiError(claimError));
    } finally {
      setClaiming(false);
    }
  };

  const handleReturn = async () => {
    if (!id || returning) return;
    const note = returnNote.trim();
    if (!note) {
      setError("Geri gönderme notu zorunludur.");
      return;
    }
    try {
      setReturning(true);
      setError("");
      await returnEffortManagement(id, note);
      setReturnNote("");
      setConfirmAction(null);
      await load(id);
      setSuccessMessage("Efor düzenleme için geri gönderildi.");
    } catch (returnError) {
      setError(readEffortApiError(returnError));
    } finally {
      setReturning(false);
    }
  };

  const handleAssignApprovalUser = async () => {
    if (!id || assigning || approvalUserId.trim() === "") return;
    try {
      setAssigning(true);
      setError("");
      await assignCustomerApprovalUser(id, approvalUserId);
      await load(id);
    } catch (assignError) {
      setError(readEffortApiError(assignError));
    } finally {
      setAssigning(false);
    }
  };

  const handleApprove = async () => {
    if (!id || approving || rejecting) return;
    try {
      setApproving(true);
      setError("");
      await decideCustomerApproval(id, true);
      setRejectNote("");
      setConfirmAction(null);
      await load(id);
      setSuccessMessage("Efor onaylandı.");
    } catch (approveError) {
      setError(readEffortApiError(approveError));
    } finally {
      setApproving(false);
    }
  };

  const handleManagerApprove = async () => {
    if (!id || managerApproving || assigning) return;
    const note = managerApproveNote.trim();
    if (!note) {
      setError("Onay açıklaması zorunludur.");
      return;
    }
    try {
      setManagerApproving(true);
      setError("");
      await managerApproveEffort(id, note);
      setManagerApproveNote("");
      setConfirmAction(null);
      await load(id);
      setSuccessMessage("Efor yönetici onayı ile tamamlandı.");
    } catch (managerApproveError) {
      setError(readEffortApiError(managerApproveError));
    } finally {
      setManagerApproving(false);
    }
  };

  const handleReject = async () => {
    if (!id || approving || rejecting) return;
    const note = rejectNote.trim();
    if (!note) {
      setError("Red nedeni zorunludur.");
      return;
    }
    try {
      setRejecting(true);
      setError("");
      await decideCustomerApproval(id, false, note);
      setRejectNote("");
      setConfirmAction(null);
      await load(id);
      setSuccessMessage("Efor reddedildi.");
    } catch (rejectError) {
      setError(readEffortApiError(rejectError));
    } finally {
      setRejecting(false);
    }
  };

  const handleBack = () => {
    navigate("/effortManagement");
  };

  const handleDownloadEffortReport = () => {
    if (!detail) return;
    try {
      setError("");
      downloadApprovedEffortHtml(detail, efforts);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Efor raporu indirilemedi."
      );
    }
  };

  const handleCreateExternalEffortMail = async () => {
    if (!detail || creatingMail || submittingForApproval) return;
    if (detail.status === TicketEffortStatus.CustomerApproved) {
      setError("Efor onaylandıktan sonra şablon kopyalanamaz veya düzenleme yapılamaz.");
      return;
    }

    try {
      setCreatingMail(true);
      setError("");
      setSuccessMessage("");
      // Yalnızca şablon kopyalanır; status değişmez.
      const openMessage = await openExternalEffortMailInOutlook(detail, efforts);
      setSuccessMessage(openMessage);
    } catch (mailError) {
      setError(readEffortApiError(mailError));
    } finally {
      setCreatingMail(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!id || !detail || submittingForApproval || creatingMail) return;
    if (detail.status === TicketEffortStatus.CustomerApproved) {
      setError("Efor onaylandıktan sonra onaya sunulamaz.");
      return;
    }
    if (detail.status === TicketEffortStatus.WaitingCustomerApproval) {
      setError("Bu kayıt zaten onaya sunuldu.");
      return;
    }

    try {
      setSubmittingForApproval(true);
      setError("");
      setSuccessMessage("");
      await markMailEffortRequested(id);
      await load(id);
      setSuccessMessage("Talep onaya sunuldu.");
    } catch (submitError) {
      setError(readEffortApiError(submitError));
    } finally {
      setSubmittingForApproval(false);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === "approve") {
      void handleApprove();
      return;
    }
    if (confirmAction === "reject") {
      void handleReject();
      return;
    }
    if (confirmAction === "return") {
      void handleReturn();
      return;
    }
    if (confirmAction === "manager-approve") {
      void handleManagerApprove();
    }
  };

  const canDownloadEffortReport =
    detail?.status === TicketEffortStatus.SentToEffortManager ||
    detail?.status === TicketEffortStatus.UnderReview ||
    detail?.status === TicketEffortStatus.WaitingCustomerApproval ||
    detail?.status === TicketEffortStatus.MailEffortRequested ||
    detail?.status === TicketEffortStatus.CustomerApproved;

  const canViewActualHours = detail?.canViewActualHours !== false && efforts?.canViewActualHours !== false;
  const rejectedByCustomer =
    detail?.status === TicketEffortStatus.ReturnedToDepartment && Boolean(detail.customerApprovedByUserName);
  // Talebi Onaya Sun gizlendiği için kullanıcı filtresi geçici olarak kapatıldı
  // const filteredApprovalUsers = approvalUsers.filter((user) => {
  //   const term = approvalSearch.trim().toLocaleLowerCase("tr");
  //   if (!term) return true;
  //   const label = `${user.name ?? ""} ${user.email ?? ""}`.toLocaleLowerCase("tr");
  //   return label.includes(term);
  // });
  const isEffortApproved = detail?.status === TicketEffortStatus.CustomerApproved;
  const canShowApprovalActions =
    !isEffortApproved &&
    // Boolean(detail?.canAssignCustomerApproval) || // Talebi Onaya Sun gizlendi
    (Boolean(detail?.canManagerApprove) ||
      Boolean(detail?.canReturn) ||
      Boolean(detail?.canDecideCustomerApproval));
  const approvalActionTabs: {
    value: ApprovalActionTab;
    label: string;
    icon: ReactNode;
  }[] = [];
  // Talebi Onaya Sun sekmesi geçici olarak gizlendi
  // if (detail?.canAssignCustomerApproval) {
  //   approvalActionTabs.push({
  //     value: "submit",
  //     label: "Talebi Onaya Sun",
  //     icon: <Send className="w-3.5 h-3.5" />,
  //   });
  // }
  if (detail?.canManagerApprove) {
    approvalActionTabs.push({
      value: "self-approve",
      label: "Kendim Onaylıyorum",
      icon: <BadgeCheck className="w-3.5 h-3.5" />,
    });
  }
  if (detail?.canReturn) {
    approvalActionTabs.push({
      value: "return",
      label: "Eforu Geri Gönder",
      icon: <RotateCcw className="w-3.5 h-3.5" />,
    });
  }
  if (detail?.canDecideCustomerApproval) {
    approvalActionTabs.push({
      value: "decide",
      label: "Efor onayı",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    });
  }
  const activeApprovalActionTab = approvalActionTabs.some((tab) => tab.value === approvalActionTab)
    ? approvalActionTab
    : (approvalActionTabs[0]?.value ?? "submit");
  const approvalSectionDescription =
    activeApprovalActionTab === "decide"
      ? "Adam gün değerlerini ve yapılacak işleri inceleyin. Onaylarsanız efor onaylandı durumuna geçer ve talep tekrar açık olur. Reddederseniz red nedeni departman yöneticisine döner."
      : "Kendiniz onaylayabilir veya eforu düzenleme için geri gönderebilirsiniz.";

  const detailSectionTabs: { value: DetailSectionTab; label: string; icon: ReactNode; badge?: number }[] = [
    {
      value: "approval",
      label: "Onay işlemleri",
      icon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      value: "summary",
      label: "Efor özeti",
      icon: <Building2 className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      value: "description",
      label: "Talep açıklaması",
      icon: <FileText className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      value: "comments",
      label: "Talep yorumları",
      icon: <MessageSquare className="h-3.5 w-3.5" aria-hidden />,
      badge: detail?.comments?.length ?? 0,
    },
    {
      value: "efforts",
      label: canViewActualHours ? "Efor kayıtları" : "Yapılacak işler",
      icon: <Timer className="h-3.5 w-3.5" aria-hidden />,
      badge: detail?.status === TicketEffortStatus.ReturnedToDepartment ? undefined : efforts?.items?.length,
    },
  ];

  const activeDetailSectionTab = detailSectionTabs.some((tab) => tab.value === detailSectionTab)
    ? detailSectionTab
    : canShowApprovalActions
      ? "approval"
      : "summary";

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; description: string; actionLabel: string; destructive?: boolean }> = {
    approve: {
      title: "Eforu onaylıyor musunuz?",
      description: "Onay sonrası efor onaylandı durumuna geçer ve talep tekrar açık olur.",
      actionLabel: "Onaylıyorum",
    },
    reject: {
      title: "Eforu reddetmek istiyor musunuz?",
      description: "Red nedeni departman yöneticisine iletilecektir.",
      actionLabel: "Red ediyorum",
      destructive: true,
    },
    return: {
      title: "Eforu geri göndermek istiyor musunuz?",
      description: "Efor girişi yeniden açılır; departman yöneticisi düzeltip tekrar gönderebilir.",
      actionLabel: "Geri gönder",
      destructive: true,
    },
    "manager-approve": {
      title: "Kendiniz onaylıyor musunuz?",
      description: "Kimseye göndermeden doğrudan onaylanacak ve talep tekrar açık olacaktır.",
      actionLabel: "Kendim onaylıyorum",
    },
  };

  const confirmBusy =
    (confirmAction === "approve" && approving) ||
    (confirmAction === "reject" && rejecting) ||
    (confirmAction === "return" && returning) ||
    (confirmAction === "manager-approve" && managerApproving);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <EffortPageShell>
        <EffortPageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/effortManagement" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800">
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                      Efor listesi
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-700">
                    {detail?.ticketNumber ? `#${detail.ticketNumber}` : "Efor detayı"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          icon={<ClipboardList className="h-5 w-5" aria-hidden />}
          title={
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate">
                {detail?.ticketNumber ? `#${detail.ticketNumber}` : "Efor detayı"}
                {detail?.title ? ` · ${detail.title}` : ""}
              </span>
              {detail && (
                <EffortStatusBadge status={detail.status} label={detail.statusText} size="lg" />
              )}
            </span>
          }
          description={
            detail
              ? [detail.customerName, detail.departmentName].filter(Boolean).join(" · ") || undefined
              : "Seçilen efor kaydının detayları ve onay işlemleri"
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                aria-label="Efor listesine dön"
                className={effortSecondaryButtonClass}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Listeye dön
              </Button>
              {detail?.canRequestMailEffort &&
                detail.status !== TicketEffortStatus.CustomerApproved && (
                <Button
                  type="button"
                  onClick={() => void handleCreateExternalEffortMail()}
                  disabled={creatingMail || submittingForApproval}
                  aria-label="Efor şablonunu panoya kopyala"
                  className={effortSecondaryButtonClass}
                >
                  {creatingMail ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Efor şablonu kopyala
                </Button>
              )}
              {detail?.canRequestMailEffort &&
                detail.status !== TicketEffortStatus.CustomerApproved &&
                detail.status !== TicketEffortStatus.WaitingCustomerApproval && (
                <Button
                  type="button"
                  onClick={() => void handleSubmitForApproval()}
                  disabled={submittingForApproval || creatingMail}
                  aria-label="Talebi onaya sun"
                  className={effortPrimaryButtonClass}
                >
                  {submittingForApproval ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Onaya Sun
                </Button>
              )}
              {canDownloadEffortReport &&
                detail?.status !== TicketEffortStatus.CustomerApproved && (
                  <Button
                    type="button"
                    onClick={handleDownloadEffortReport}
                    aria-label={`Talep No ${detail?.ticketNumber ?? ""} efor raporunu indir`}
                    className={effortSecondaryButtonClass}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Raporu indir
                    {detail?.ticketNumber != null ? ` (Ticket No : ${detail.ticketNumber})` : ""}
                  </Button>
                )}
              {detail?.canClaim && (
                <Button
                  type="button"
                  onClick={() => void handleClaim()}
                  disabled={claiming}
                  aria-label="İncelemeyi üstlen"
                  className={effortPrimaryButtonClass}
                >
                  {claiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  İncelemeyi üstlen
                </Button>
              )}
            </>
          }
        />

        {error && <EffortAlert tone="error">{error}</EffortAlert>}
        {successMessage && <EffortAlert tone="success">{successMessage}</EffortAlert>}

        {loading ? (
          <DetailSkeleton />
        ) : detail && (
          <>
            {detail.status === TicketEffortStatus.MailEffortRequested && (
              <StatusBanner
                tone="indigo"
                title="Mail ile efor istendi"
                meta={`${detail.customerApprovedByUserName || "Atanan"} · Bu kayıt mail sürecinde. Durumu giriş yapan kullanıcı onay işlemlerinden güncelleyebilir.`}
              />
            )}

            {detail.status === TicketEffortStatus.CustomerApproved && (
              <StatusBanner
                tone="emerald"
                title="Efor onaylandı"
                meta={`${detail.customerApprovedByUserName || "Onaylayan"}${detail.customerApprovedAt ? ` · ${formatDateTime(detail.customerApprovedAt)}` : ""}`}
                body={detail.returnNote ? `Onay açıklaması: ${detail.returnNote}` : undefined}
                action={
                  <Button
                    type="button"
                    onClick={handleDownloadEffortReport}
                    aria-label={`Talep No ${detail.ticketNumber ?? ""} onay raporunu indir`}
                    className="h-10 shrink-0 rounded-xl bg-emerald-700 px-4 text-white hover:bg-emerald-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Raporu indir
                    {detail.ticketNumber != null ? ` (Ticket No : ${detail.ticketNumber})` : ""}
                  </Button>
                }
              />
            )}

            {detail.status === TicketEffortStatus.ReturnedToDepartment && (
              <StatusBanner
                tone="rose"
                title={rejectedByCustomer ? "Müşteri reddetti" : "Düzenleme için geri gönderildi"}
                meta={`${
                  rejectedByCustomer
                    ? detail.customerApprovedByUserName
                    : detail.effortManagerUserName || "Efor yöneticisi"
                }${detail.returnedAt ? ` · ${formatDateTime(detail.returnedAt)}` : ""}${
                  rejectedByCustomer ? " · Süreç departman yöneticisine döndü." : ""
                }`}
                body={
                  detail.returnNote
                    ? rejectedByCustomer
                      ? `Red nedeni: ${detail.returnNote}`
                      : detail.returnNote
                    : undefined
                }
              />
            )}

            <section
              ref={approvalSectionRef}
              id="approve"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_40px_rgba(62,93,143,0.08)]"
            >
              <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />

              <Tabs
                value={activeDetailSectionTab}
                onValueChange={(value) => setDetailSectionTab(value as DetailSectionTab)}
              >
                <div className="border-b border-slate-100/80 px-5 pt-5 pb-0 md:px-6">
                  <h2 className="text-[15px] font-bold tracking-tight text-slate-900">Efor detayı</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Onay, özet, açıklama, yorum ve efor kayıtlarını sekmeler arasında gezinerek inceleyin.
                  </p>

                  <TabsList
                    variant="line"
                    aria-label="Efor detay bölümleri"
                    className="mt-4 h-auto min-h-10 w-full flex-wrap justify-start gap-1"
                  >
                    {detailSectionTabs.map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value} className={detailTabTriggerClass}>
                        {tab.icon}
                        <span>{tab.label}</span>
                        {typeof tab.badge === "number" && (
                          <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#3e5d8f]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#3e5d8f]">
                            {tab.badge}
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="approval" className="mt-0 outline-none">
                  {canShowApprovalActions ? (
                    <Tabs
                      value={activeApprovalActionTab}
                      onValueChange={(value) => setApprovalActionTab(value as ApprovalActionTab)}
                    >
                      <div className="border-b border-slate-100/80 px-5 pt-4 pb-0 md:px-6">
                        <p className="text-xs text-slate-500">{approvalSectionDescription}</p>
                        <TabsList
                          variant="line"
                          aria-label="Onay işlemleri"
                          className="mt-3 h-auto min-h-10 w-full flex-wrap justify-start gap-1"
                        >
                          {approvalActionTabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className={detailTabTriggerClass}>
                              {tab.icon}
                              {tab.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      {/* Talebi Onaya Sun paneli geçici olarak gizlendi
                      {detail.canAssignCustomerApproval && (
                        <TabsContent value="submit" className="mt-0 outline-none">
                          <div className="flex flex-col gap-4 p-6">
                            <p className="text-xs text-slate-500">
                              Onayı VESA içindeki efor yöneticilerinden veya talebin müşterisine bağlı kişilerden isteyebilirsiniz. Seçilen kişi bu talebi, adam gün değerlerini ve yapılacak işleri görür.
                            </p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
                              <div className="flex flex-col gap-1.5">
                                <label htmlFor="approval-user-search" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Kişide ara
                                </label>
                                <input
                                  id="approval-user-search"
                                  value={approvalSearch}
                                  onChange={(event) => setApprovalSearch(event.target.value)}
                                  placeholder="Ad veya e-posta"
                                  aria-label="Onay kullanıcısında ara"
                                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#3e5d8f]"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label htmlFor="approval-user" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Onaya sunulacak kişi
                                </label>
                                <select
                                  id="approval-user"
                                  value={approvalUserId}
                                  onChange={(event) => setApprovalUserId(event.target.value)}
                                  aria-label="Onaya sunulacak kişiyi seç"
                                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#3e5d8f]"
                                >
                                  <option value="">Kişi seçin</option>
                                  {approvalUserId &&
                                    !filteredApprovalUsers.some((user) => user.id === approvalUserId) &&
                                    detail.customerApprovedByUserName && (
                                      <option value={approvalUserId}>{detail.customerApprovedByUserName}</option>
                                    )}
                                  {filteredApprovalUsers.map((user) => (
                                    <option key={user.id} value={user.id ?? ""}>
                                      {user.name || user.email || "—"}
                                      {user.email ? ` · ${user.email}` : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button
                                type="button"
                                onClick={() => void handleAssignApprovalUser()}
                                disabled={assigning || managerApproving || approvalUserId.trim() === ""}
                                aria-label="Seçilen kişiyi onaya sun"
                                className="h-10 rounded-xl bg-[#3e5d8f] px-5 text-white hover:bg-[#324d7a]"
                              >
                                {assigning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Onaya sun
                              </Button>
                            </div>
                            {approvalUsers.length === 0 && (
                              <p className="text-xs text-amber-700">Seçilebilir kullanıcı bulunamadı.</p>
                            )}
                          </div>
                        </TabsContent>
                      )}
                      */}

                      {detail.canManagerApprove && (
                        <TabsContent value="self-approve" className="mt-0 outline-none">
                          <div className="flex flex-col gap-4 p-5 md:p-6">
                            <p className="text-xs text-slate-500">
                              Kimseye göndermeden onaylamak için açıklama yazın. Onay sonrası talep tekrar açık olur.
                            </p>
                            <div>
                              <label
                                htmlFor="manager-approve-note"
                                className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                              >
                                Onay açıklaması
                              </label>
                              <Textarea
                                id="manager-approve-note"
                                value={managerApproveNote}
                                onChange={(event) => setManagerApproveNote(event.target.value)}
                                placeholder="Neden doğrudan onayladığınızı yazın"
                                aria-label="Onay açıklaması"
                                rows={3}
                                className="mt-1.5 rounded-xl border-slate-200 focus-visible:border-[#3e5d8f] focus-visible:ring-[#3e5d8f]/20"
                              />
                            </div>
                            <div>
                              <Button
                                type="button"
                                onClick={() => {
                                  if (!managerApproveNote.trim()) {
                                    setError("Onay açıklaması zorunludur.");
                                    return;
                                  }
                                  setConfirmAction("manager-approve");
                                }}
                                disabled={managerApproving || assigning || managerApproveNote.trim() === ""}
                                aria-label="Açıklama ile kendim onaylıyorum"
                                className="h-10 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                              >
                                {managerApproving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Kendim onaylıyorum
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      )}

                      {detail.canReturn && (
                        <TabsContent value="return" className="mt-0 outline-none">
                          <div className="flex flex-col gap-4 p-5 md:p-6">
                            <p className="text-xs text-slate-500">
                              Tüm eforu kabul etmek zorunda değilsiniz. Notu yazın; efor girişi yeniden açılır ve departman yöneticisi düzeltip tekrar gönderir.
                            </p>
                            <div>
                              <label htmlFor="return-note" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Geri gönderme notu
                              </label>
                              <Textarea
                                id="return-note"
                                value={returnNote}
                                onChange={(event) => setReturnNote(event.target.value)}
                                placeholder="Neden geri gönderildiğini ve neyin düzeltilmesi gerektiğini yazın"
                                aria-label="Geri gönderme notu"
                                rows={3}
                                className="mt-1.5 rounded-xl border-slate-200 focus-visible:border-[#3e5d8f] focus-visible:ring-[#3e5d8f]/20"
                              />
                            </div>
                            <div>
                              <Button
                                type="button"
                                onClick={() => {
                                  if (!returnNote.trim()) {
                                    setError("Geri gönderme notu zorunludur.");
                                    return;
                                  }
                                  setConfirmAction("return");
                                }}
                                disabled={returning || returnNote.trim() === ""}
                                aria-label="Eforu düzenleme için geri gönder"
                                className="h-10 rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
                              >
                                {returning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Geri gönder
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      )}

                      {detail.canDecideCustomerApproval && (
                        <TabsContent value="decide" className="mt-0 outline-none">
                          <div className="flex flex-col gap-4 p-5 md:p-6">
                            <div>
                              <label
                                htmlFor="reject-note"
                                className="block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                              >
                                Red nedeni
                              </label>
                              <Textarea
                                id="reject-note"
                                value={rejectNote}
                                onChange={(event) => setRejectNote(event.target.value)}
                                placeholder="Reddediyorsanız nedenini yazın"
                                aria-label="Red nedeni"
                                rows={3}
                                className="mt-1.5 rounded-xl border-slate-200 focus-visible:border-[#3e5d8f] focus-visible:ring-[#3e5d8f]/20"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                onClick={() => setConfirmAction("approve")}
                                disabled={approving || rejecting}
                                aria-label="Eforu onaylıyorum"
                                className="h-10 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                              >
                                {approving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Onaylıyorum
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  if (!rejectNote.trim()) {
                                    setError("Red nedeni zorunludur.");
                                    return;
                                  }
                                  setConfirmAction("reject");
                                }}
                                disabled={approving || rejecting || rejectNote.trim() === ""}
                                aria-label="Eforu red ediyorum"
                                className="h-10 rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
                              >
                                {rejecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Red ediyorum
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  ) : (
                    <div className="p-5 md:p-6">
                      <EffortEmptyState
                        icon={<BadgeCheck className="h-5 w-5" aria-hidden />}
                        title="Bu kayıt için aktif onay işlemi yok"
                        description="Yetkiniz dahilinde bir işlem bulunmuyorsa veya süreç tamamlandıysa bu sekmede aksiyon gösterilmez."
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="summary" className="mt-0 outline-none">
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 md:p-5">
                    <EffortInfoItem label="Efor / talep no" value={detail.ticketNumber != null ? `#${detail.ticketNumber}` : null} />
                    <EffortInfoItem label="Müşteri" value={detail.customerName} />
                    <EffortInfoItem label="Şirket" value={detail.workCompanyName} />
                    <EffortInfoItem label="Departman" value={detail.departmentName} />
                    <EffortInfoItem label="Departman yöneticisi" value={detail.departmentManagerName || detail.sentByUserName} />
                    <EffortInfoItem label="Talep durumu" value={detail.ticketStatusText} />
                    <EffortInfoItem label="Öncelik" value={detail.priorityText} />
                    <EffortInfoItem label="Tip" value={detail.typeText} />
                    <EffortInfoItem label="Talep sahibi" value={detail.ticketOwnerName || detail.ticketCreatedBy} />
                    <EffortInfoItem label="Oluşturma" value={formatDateTime(detail.ticketCreatedDate)} />
                    <EffortInfoItem label="Gönderen" value={detail.sentByUserName} />
                    <EffortInfoItem label="Gönderim tarihi" value={formatDateTime(detail.sentAt)} />
                    <EffortInfoItem label="Efor durumu">
                      <EffortStatusBadge status={detail.status} label={detail.statusText} />
                    </EffortInfoItem>
                    {(detail.status === TicketEffortStatus.WaitingCustomerApproval ||
                      detail.status === TicketEffortStatus.MailEffortRequested) &&
                      detail.customerApprovedByUserName && (
                      <EffortInfoItem
                        label={
                          detail.status === TicketEffortStatus.MailEffortRequested
                            ? "Mail ile atanan"
                            : "Onaya sunulan"
                        }
                        value={detail.customerApprovedByUserName}
                      />
                    )}
                    {detail.status === TicketEffortStatus.CustomerApproved && (
                      <EffortInfoItem
                        label="Onay kaydı"
                        value={`${detail.customerApprovedByUserName || "—"}${detail.customerApprovedAt ? ` · ${formatDateTime(detail.customerApprovedAt)}` : ""}`}
                      />
                    )}
                    {canViewActualHours && detail.effortManagerUserName && (
                      <EffortInfoItem
                        label="İnceleyen"
                        value={`${detail.effortManagerUserName}${detail.effortManagerAssignedAt ? ` · ${formatDateTime(detail.effortManagerAssignedAt)}` : ""}`}
                      />
                    )}
                    {detail.claimedByCurrentUser && (
                      <EffortInfoItem label="Üstlenme" value="Bu kayıt incelemenizde." />
                    )}
                    {detail.status !== TicketEffortStatus.ReturnedToDepartment && (
                      <EffortInfoItem
                        label="Toplam adam gün"
                        value={formatManDays(efforts?.totalInvoiceHours)}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="description" className="mt-0 outline-none">
                  <div className="px-5 py-5 md:px-6">
                    {detail.description ? (
                      <div
                        className="prose prose-sm max-w-none text-slate-700 [&_p]:mb-2"
                        dangerouslySetInnerHTML={{ __html: detail.description }}
                      />
                    ) : (
                      <EffortEmptyState
                        icon={<FileText className="h-5 w-5" aria-hidden />}
                        title="Bu talep için açıklama bulunmuyor"
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-0 outline-none">
                  <div className="p-4 md:p-5">
                    {(detail.comments ?? []).length === 0 ? (
                      <EffortEmptyState
                        icon={<MessageSquare className="h-5 w-5" aria-hidden />}
                        title="Bu talebe ait yorum yok"
                      />
                    ) : (
                      <div className="flex max-h-[32rem] flex-col gap-3 overflow-auto pr-1">
                        {(detail.comments ?? []).map((comment) => (
                          <article key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3e5d8f]/10 text-[#3e5d8f]">
                                  <UserRound className="h-3.5 w-3.5" aria-hidden />
                                </span>
                                {comment.createdByName || comment.createdBy || "—"}
                              </p>
                              <time className="text-xs text-slate-400" dateTime={comment.createdDate}>
                                {formatDateTime(comment.createdDate)}
                              </time>
                            </div>
                            {comment.body ? (
                              <div
                                className="mt-2 text-sm text-slate-700 [&_p]:mb-2"
                                dangerouslySetInnerHTML={{ __html: comment.body }}
                              />
                            ) : (
                              <p className="mt-2 text-sm text-slate-400">Yorum metni yok.</p>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="efforts" className="mt-0 outline-none">
                  {detail.status !== TicketEffortStatus.ReturnedToDepartment && (
                    <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 md:px-5">
                      {canViewActualHours && (
                        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                          Toplam fiili saat{" "}
                          <strong className="text-slate-800">{formatHours(efforts?.totalEffortHours)}</strong>
                        </span>
                      )}
                      {canViewActualHours && (
                        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                          Toplam fatura saati{" "}
                          <strong className="text-slate-800">{formatHours(efforts?.totalInvoiceHours)}</strong>
                        </span>
                      )}
                      <span className="rounded-lg bg-[#3e5d8f]/5 px-2.5 py-1 text-xs text-[#3e5d8f]">
                        Toplam adam gün{" "}
                        <strong>{formatManDays(efforts?.totalInvoiceHours)}</strong>
                      </span>
                    </div>
                  )}

                  {detail.status === TicketEffortStatus.ReturnedToDepartment ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-500">
                      Efor düzenleme için geri gönderildi. Onaylanmamış eforlar burada gösterilmez; talep tekrar efor
                      onayına gönderildiğinde listelenir.
                    </p>
                  ) : (efforts?.items ?? []).length === 0 ? (
                    <EffortEmptyState
                      icon={<Timer className="h-5 w-5" aria-hidden />}
                      title="Bu talebe bağlı efor kaydı yok"
                    />
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 p-4 md:hidden">
                        {(efforts?.items ?? []).map((effort) => (
                          <article
                            key={effort.id}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              {canViewActualHours ? (
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-800">
                                    {effort.userAppName || "—"}
                                  </p>
                                  {effort.userTitle && (
                                    <p className="truncate text-xs text-slate-400">{effort.userTitle}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Yapılacak iş
                                </p>
                              )}
                              <time className="shrink-0 text-xs text-slate-400" dateTime={effort.createdDate}>
                                {formatDateTime(effort.createdDate)}
                              </time>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                              {canViewActualHours && (
                                <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-100">
                                  Fiili{" "}
                                  <strong className="text-slate-800">{formatHours(effort.effortHours)}</strong>
                                </span>
                              )}
                              {canViewActualHours && (
                                <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-100">
                                  Fatura{" "}
                                  <strong className="text-slate-800">{formatHours(effort.invoiceHours)}</strong>
                                </span>
                              )}
                              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-100">
                                Adam gün{" "}
                                <strong className="text-slate-800">{formatManDays(effort.invoiceHours)}</strong>
                              </span>
                            </div>
                            <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm text-slate-700">
                              {effort.description || "—"}
                            </p>
                          </article>
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto md:block">
                        <Table className="table-fixed">
                          <TableHeader>
                            <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                              {canViewActualHours && (
                                <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  Personel
                                </TableHead>
                              )}
                              {canViewActualHours && (
                                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  Fiili saat
                                </TableHead>
                              )}
                              {canViewActualHours && (
                                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  Fatura saati
                                </TableHead>
                              )}
                              <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Adam gün
                              </TableHead>
                              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Yapılacak iş
                              </TableHead>
                              <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                Tarih
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(efforts?.items ?? []).map((effort) => (
                              <TableRow key={effort.id} className="border-slate-100 hover:bg-[#3e5d8f]/[0.02]">
                                {canViewActualHours && (
                                  <TableCell className="whitespace-normal px-4 py-3.5 align-top">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                      {effort.userAppName || "—"}
                                    </p>
                                    {effort.userTitle && (
                                      <p className="truncate text-xs text-slate-400">{effort.userTitle}</p>
                                    )}
                                  </TableCell>
                                )}
                                {canViewActualHours && (
                                  <TableCell className="px-4 py-3.5 align-top text-sm tabular-nums text-slate-700">
                                    {formatHours(effort.effortHours)}
                                  </TableCell>
                                )}
                                {canViewActualHours && (
                                  <TableCell className="px-4 py-3.5 align-top text-sm tabular-nums text-slate-700">
                                    {formatHours(effort.invoiceHours)}
                                  </TableCell>
                                )}
                                <TableCell className="px-4 py-3.5 align-top text-sm font-medium tabular-nums text-slate-800">
                                  {formatManDays(effort.invoiceHours)}
                                </TableCell>
                                <TableCell className="whitespace-normal px-4 py-3.5 align-top">
                                  <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm text-slate-600">
                                    {effort.description || "—"}
                                  </p>
                                </TableCell>
                                <TableCell className="px-4 py-3.5 align-top text-sm text-slate-600">
                                  {formatDateTime(effort.createdDate)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </section>
          </>
        )}
      </EffortPageShell>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !confirmBusy) setConfirmAction(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction ? confirmCopy[confirmAction].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction ? confirmCopy[confirmAction].description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmBusy}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmBusy}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
              className={cn(
                confirmAction && confirmCopy[confirmAction].destructive
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {confirmBusy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {confirmAction ? confirmCopy[confirmAction].actionLabel : "Onayla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EffortManagementDetailPage;
