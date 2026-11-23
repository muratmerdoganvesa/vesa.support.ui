import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Lock, Trash2, X } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../createTicket/index.css";

import { TicketApi, UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { axiosInstance } from "utils/axiosInstance";
import { cn } from "lib/utils";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Switch } from "components/ui/switch";
import { readEffortApiError, setTicketEffortEnter } from "../createTicket/api/ticketEffortApi";
import { fetchEffortManagementByTicket } from "layouts/pages/effortManagement/api";
import {
  TicketEffortStatus,
  type TicketEffortManagementStatusDto,
} from "layouts/pages/effortManagement/types";
import { formatDateTime } from "layouts/pages/effortManagement/shared";

export interface GrantTicketAccessTicket {
  id: string;
  ticketNumber?: number | string | null;
  title?: string | null;
  status?: number | null;
  statusText?: string | null;
  ticketAssigneText?: string | null;
  isEffortEnter?: boolean;
}

interface AssignUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  userAppName?: string | null;
  email?: string | null;
}

interface AccessListItem {
  id: string;
  userAppId: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
  isEffort?: boolean;
  isEffortComplated?: boolean;
  /** null: onay başlamadı; false: yönetici onayında beklemede; true: yönetici onayladı */
  isManagerApproved?: boolean | null;
}

type AccessListApiItem = AccessListItem & {
  UserAppId?: string;
  IsPrimary?: boolean;
  Name?: string;
  Id?: string;
};

const normalizeAccessListItem = (raw: AccessListApiItem): AccessListItem => ({
  id: String(raw.id ?? raw.Id ?? ""),
  userAppId: String(raw.userAppId ?? raw.UserAppId ?? ""),
  name: String(raw.name ?? raw.Name ?? ""),
  isPrimary: Boolean(raw.isPrimary ?? raw.IsPrimary),
  isActive: Boolean(raw.isActive),
  isEffort: raw.isEffort,
  isEffortComplated: raw.isEffortComplated,
  isManagerApproved: raw.isManagerApproved,
});

const isSameUserId = (left?: string | null, right?: string | null): boolean => {
  if (!left || !right) return false;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
};

interface GrantTicketAccessPanelProps {
  ticket: GrantTicketAccessTicket;
  onClose: () => void;
  onGranted: (ticketId: string) => void;
  onTicketStatusChange: (ticketId: string, status: number, statusText: string) => void;
  onEffortEnterChange: (ticketId: string, isEffortEnter: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

const hasVisibleRichText = (html?: string | null): boolean => {
  if (!html) return false;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
};

const normalizeCustomerEffortContact = (html?: string | null): string | null =>
  hasVisibleRichText(html) ? (html ?? "").trim() : null;

const customerEffortModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const customerEffortFormats = ["bold", "italic", "underline", "list", "bullet", "link"];

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const displayUserName = (user: AssignUser | null): string => {
  if (!user) return "";
  if (user.userAppName) return user.userAppName;
  if (user.firstName || user.lastName) {
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  }
  return user.email ?? user.userName ?? "";
};

const formatRequestError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { errors?: unknown; message?: unknown } } }).response
      ?.data;
    const errors = data?.errors;
    if (Array.isArray(errors) && errors.length > 0) return errors.map(String).join(", ");
    if (typeof errors === "string" && errors.trim() !== "") return errors;
    if (typeof data?.message === "string" && data.message.trim() !== "") return data.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

const GrantTicketAccessPanel = ({
  ticket,
  onClose,
  onGranted,
  onTicketStatusChange,
  onEffortEnterChange,
  onBusyChange,
}: GrantTicketAccessPanelProps) => {
  const dispatchAlert = useAlert();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AssignUser | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<AssignUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [accessList, setAccessList] = useState<AccessListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
  const [pendingSelfRevoke, setPendingSelfRevoke] = useState<AccessListItem | null>(null);
  const [isEffortEnter, setIsEffortEnter] = useState(Boolean(ticket.isEffortEnter));
  const [effortEnterSaving, setEffortEnterSaving] = useState(false);
  const [effortSendStatus, setEffortSendStatus] = useState<TicketEffortManagementStatusDto | null>(null);
  const [effortStatusLoading, setEffortStatusLoading] = useState(false);
  const [userInputFocused, setUserInputFocused] = useState(false);
  const [customerEffortContact, setCustomerEffortContact] = useState("");
  const [contactVisible, setContactVisible] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const initialContactRef = useRef("");
  const searchTimerRef = useRef<number | null>(null);
  const searchRequestIdRef = useRef(0);
  const currentUserIdRef = useRef("");

  const isReturnedForEdit = effortSendStatus?.status === TicketEffortStatus.ReturnedToDepartment;
  const isCustomerApproved = effortSendStatus?.status === TicketEffortStatus.CustomerApproved;
  const isEffortProcessLocked =
    Boolean(effortSendStatus?.exists) && !isReturnedForEdit;
  const isMutating =
    submitting ||
    revokingUserId != null ||
    effortEnterSaving ||
    effortStatusLoading ||
    contactSaving ||
    pendingSelfRevoke != null;
  const isFormLocked = isEffortProcessLocked || isMutating;

  const loadAccessList = async () => {
    setListLoading(true);
    try {
      const response = await axiosInstance.get<AccessListApiItem[]>("/api/Ticket/GetActiveTicketAccess", {
        params: { ticketId: ticket.id },
      });
      setAccessList((response.data ?? []).map(normalizeAccessListItem));
    } catch {
      setAccessList([]);
    } finally {
      setListLoading(false);
    }
  };

  const loadCustomerEffortContact = async () => {
    try {
      const api = new TicketApi(getConfiguration());
      const response = await api.apiTicketIdGet(ticket.id);
      const value = response.data?.customerEffortContact ?? "";
      if (!hasVisibleRichText(value)) {
        setContactVisible(false);
        setCustomerEffortContact("");
        initialContactRef.current = "";
        return;
      }
      setContactVisible(true);
      setCustomerEffortContact(value);
      initialContactRef.current = value;
    } catch {
      setContactVisible(false);
      setCustomerEffortContact("");
      initialContactRef.current = "";
    }
  };

  const persistCustomerEffortContact = async (): Promise<"saved" | "unchanged"> => {
    if (!contactVisible || isEffortProcessLocked) return "unchanged";
    const next = normalizeCustomerEffortContact(customerEffortContact);
    const initial = normalizeCustomerEffortContact(initialContactRef.current);
    if ((next ?? "") === (initial ?? "")) return "unchanged";

    const response = await axiosInstance.post<{ customerEffortContact?: string | null }>(
      "/api/Ticket/UpdateCustomerEffortContact",
      {
        ticketId: ticket.id,
        customerEffortContact: next,
      }
    );
    const saved = response.data?.customerEffortContact ?? "";
    initialContactRef.current = saved;
    setCustomerEffortContact(saved);
    if (!hasVisibleRichText(saved)) setContactVisible(false);
    return "saved";
  };

  const loadEffortStatus = async () => {
    setEffortStatusLoading(true);
    try {
      const status = await fetchEffortManagementByTicket(ticket.id);
      setEffortSendStatus(status);
    } catch {
      setEffortSendStatus(null);
    } finally {
      setEffortStatusLoading(false);
    }
  };

  const resolveCurrentUserId = async (): Promise<string> => {
    if (currentUserIdRef.current) return currentUserIdRef.current;
    try {
      const api = new UserApi(getConfiguration());
      const response = await api.apiUserGetLoginUserGet();
      const id = response.data?.id ?? "";
      currentUserIdRef.current = id;
      return id;
    } catch {
      currentUserIdRef.current = "";
      return "";
    }
  };

  useEffect(() => {
    setIsEffortEnter(Boolean(ticket.isEffortEnter));
    setPendingSelfRevoke(null);
  }, [ticket.id, ticket.isEffortEnter]);

  useEffect(() => {
    onBusyChange(
      submitting || revokingUserId != null || effortEnterSaving || contactSaving || pendingSelfRevoke != null
    );
    return () => onBusyChange(false);
  }, [submitting, revokingUserId, effortEnterSaving, contactSaving, pendingSelfRevoke, onBusyChange]);

  useEffect(() => {
    void resolveCurrentUserId();
  }, []);

  useEffect(() => {
    if (!isEffortProcessLocked) {
      // preventScroll: popover üstte kesilmesin / sayfa kaymasın
      userInputRef.current?.focus({ preventScroll: true });
    }
    void loadAccessList();
    void loadEffortStatus();
    void loadCustomerEffortContact();
  }, [ticket.id]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
      searchRequestIdRef.current += 1;
    };
  }, []);

  const clearUserSearch = () => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    searchRequestIdRef.current += 1;
    setUserResults([]);
    setUserSearchLoading(false);
  };

  const handleSaveCustomerEffortContact = async () => {
    if (!contactVisible || isFormLocked || contactSaving) return;
    setContactSaving(true);
    try {
      const result = await persistCustomerEffortContact();
      if (result === "saved") {
        dispatchAlert({ message: "Müşteri yetkili bilgisi güncellendi.", type: "Success" });
      }
    } catch (error) {
      dispatchAlert({
        message: "Müşteri yetkili bilgisi güncellenemedi: " + formatRequestError(error),
        type: "Error",
      });
    } finally {
      setContactSaving(false);
    }
  };

  const handleCancel = () => {
    if (submitting || revokingUserId || effortEnterSaving || contactSaving || pendingSelfRevoke) return;
    onClose();
  };

  const handleCancelSelfRevoke = () => {
    if (revokingUserId) return;
    setPendingSelfRevoke(null);
  };

  const handleToggleEffortEnter = async (next: boolean) => {
    if (isEffortProcessLocked || effortEnterSaving || submitting || revokingUserId) return;
    setEffortEnterSaving(true);
    try {
      const saved = await setTicketEffortEnter(ticket.id, next);
      setIsEffortEnter(saved);
      onEffortEnterChange(ticket.id, saved);
      dispatchAlert({
        message: saved ? "Efor girişi açıldı." : "Efor girişi kapatıldı.",
        type: "Success",
      });
    } catch (error) {
      dispatchAlert({
        message: "Efor girilebilir durumu güncellenemedi: " + readEffortApiError(error),
        type: "Error",
      });
    } finally {
      setEffortEnterSaving(false);
    }
  };

  const handleUserQueryChange = (value: string) => {
    setUserQuery(value);
    setSelectedUser(null);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    const query = value.trim();
    if (!query) {
      clearUserSearch();
      return;
    }
    const requestId = ++searchRequestIdRef.current;
    searchTimerRef.current = window.setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const api = new UserApi(getConfiguration());
        const response = await api.apiUserGetAllUsersWitNameAssignGet(query);
        if (requestId !== searchRequestIdRef.current) return;
        setUserResults((response.data ?? []) as AssignUser[]);
      } catch {
        if (requestId !== searchRequestIdRef.current) return;
        setUserResults([]);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setUserSearchLoading(false);
        }
      }
    }, 300);
  };

  const handleSelectUser = (user: AssignUser) => {
    clearUserSearch();
    setSelectedUser(user);
    setUserQuery(displayUserName(user));
    setUserInputFocused(false);
  };

  const handleUserInputBlur = () => {
    // Sonuç satırına tıklamada blur önce gelir; onMouseDown preventDefault ile seçim korunur
    window.setTimeout(() => {
      setUserInputFocused(false);
      clearUserSearch();
    }, 150);
  };

  const handleSubmit = async () => {
    if (isEffortProcessLocked) {
      dispatchAlert({
        message: isCustomerApproved
          ? "Efor süreci tamamlandı. Yeni efor isteği gönderilemez."
          : "Efor onay sürecindeyken yeni efor isteği gönderilemez.",
        type: "Warning",
      });
      return;
    }

    if (submitting || !selectedUser?.id) {
      if (!selectedUser?.id) {
        dispatchAlert({ message: "Lütfen efor istenecek kişiyi seçiniz.", type: "Warning" });
        userInputRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      try {
        await persistCustomerEffortContact();
      } catch (error) {
        dispatchAlert({
          message: "Müşteri yetkili bilgisi güncellenemedi: " + formatRequestError(error),
          type: "Error",
        });
        return;
      }

      const response = await axiosInstance.post<{ status?: number; statusText?: string }>(
        "/api/Ticket/GrantTicketAccess",
        {
          ticketId: ticket.id,
          userAppId: selectedUser.id,
          description: description.trim() || undefined,
        }
      );

      dispatchAlert({
        message: `${displayUserName(selectedUser)} kişisinden efor istendi.`,
        type: "Success",
      });
      setSelectedUser(null);
      setUserQuery("");
      setDescription("");
      await loadAccessList();
      if (response.data?.status != null) {
        onTicketStatusChange(
          ticket.id,
          response.data.status,
          response.data.statusText || String(response.data.status)
        );
      }
      onGranted(ticket.id);
    } catch (error) {
      dispatchAlert({
        message: "Efor istenirken hata oluştu: " + formatRequestError(error),
        type: "Error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const executeRevoke = async (item: AccessListItem) => {
    setRevokingUserId(item.userAppId);
    try {
      const response = await axiosInstance.post<{ status?: number; statusText?: string }>(
        "/api/Ticket/RevokeTicketAccess",
        {
          ticketId: ticket.id,
          userAppId: item.userAppId,
        }
      );
      dispatchAlert({ message: `${item.name} için efor isteği kaldırıldı.`, type: "Success" });
      setPendingSelfRevoke(null);
      await loadAccessList();
      if (response.data?.status != null) {
        onTicketStatusChange(
          ticket.id,
          response.data.status,
          response.data.statusText || String(response.data.status)
        );
      }
    } catch (error) {
      dispatchAlert({
        message: "Efor isteği kaldırılırken hata oluştu: " + formatRequestError(error),
        type: "Error",
      });
    } finally {
      setRevokingUserId(null);
    }
  };

  const handleRevoke = async (item: AccessListItem) => {
    if (
      item.isPrimary ||
      isEffortProcessLocked ||
      revokingUserId ||
      submitting ||
      effortEnterSaving ||
      contactSaving ||
      pendingSelfRevoke
    ) {
      return;
    }

    const loginUserId = await resolveCurrentUserId();
    if (isSameUserId(item.userAppId, loginUserId)) {
      setPendingSelfRevoke(item);
      return;
    }

    await executeRevoke(item);
  };

  const handleConfirmSelfRevoke = () => {
    if (!pendingSelfRevoke || revokingUserId) return;
    void executeRevoke(pendingSelfRevoke);
  };

  const handleUserKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      descriptionRef.current?.focus();
    }
  };

  const ticketLabel =
    ticket.ticketNumber != null && ticket.ticketNumber !== ""
      ? `#${ticket.ticketNumber}`
      : "Talep";

  const extraAccess = accessList.filter((item) => !item.isPrimary);

  return (
    <div className="w-full bg-white">
      <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-slate-900">
            Efor İste · {ticketLabel}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {ticket.title || "Başlıksız talep"}
            {ticket.ticketAssigneText ? ` · Atanan: ${ticket.ticketAssigneText}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={
            submitting || revokingUserId != null || effortEnterSaving || contactSaving || pendingSelfRevoke != null
          }
          aria-label="Vazgeç"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {pendingSelfRevoke && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="self-revoke-title"
          aria-describedby="self-revoke-description"
          className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <div className="min-w-0">
              <p id="self-revoke-title" className="text-sm font-semibold text-amber-950">
                Görünürlük yetkisini kaldırma
              </p>
              <p id="self-revoke-description" className="mt-1 text-[12px] leading-5 text-amber-900">
                Talebin görünürlük yetkisini kendinizden kaldırıyorsunuz. Onaylamanız halinde:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12px] leading-5 text-amber-900">
                <li>Bu talep için başka kişilerden efor isteğinde bulunamazsınız.</li>
                <li>Talebin sizin için görünürlüğü sona erebilir.</li>
              </ol>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelSelfRevoke}
              disabled={revokingUserId != null}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleConfirmSelfRevoke}
              disabled={revokingUserId != null}
              aria-busy={revokingUserId === pendingSelfRevoke.userAppId}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-700 px-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-40"
            >
              {revokingUserId === pendingSelfRevoke.userAppId && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Onayla
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 py-3">
        {effortStatusLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-[11px] text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Efor süreci kontrol ediliyor...
          </div>
        ) : isCustomerApproved ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
              <Lock className="h-3.5 w-3.5" />
              Efor süreci tamamlandı
            </p>
            <p className="mt-1 text-[11px] text-emerald-800">
              {effortSendStatus?.customerApprovedByUserName || "Onaylayan"}
              {effortSendStatus?.customerApprovedAt
                ? ` · ${formatDateTime(effortSendStatus.customerApprovedAt)}`
                : ""}
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">
              Onaylandıktan sonra efor isteği, efor girişi ve efor kayıtları değiştirilemez.
            </p>
          </div>
        ) : isEffortProcessLocked ? (
          <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-900">
              <Lock className="h-3.5 w-3.5" />
              Efor onay sürecinde
            </p>
            <p className="mt-1 text-[11px] text-sky-800">
              Durum: {effortSendStatus?.statusText || "Gönderildi"}
              {effortSendStatus?.sentAt ? ` · ${formatDateTime(effortSendStatus.sentAt)}` : ""}
            </p>
            <p className="mt-1 text-[11px] text-sky-700">
              Süreç tamamlanana veya düzenleme için geri gönderilene kadar efor isteği ve girişi
              kilitlidir.
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700">Efor girilebilir</p>
            <p className="text-[11px] text-slate-400">
              {isEffortProcessLocked
                ? "Efor süreci kilitli. Giriş durumu değiştirilemez."
                : isEffortEnter
                  ? "Yalnızca efor istenen kişiler efor girebilir. Talebin atananı efor giremez."
                  : "Kapalıyken efor eklenemez, silinemez ve güncellenemez."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "text-[11px] font-semibold",
                isEffortEnter ? "text-emerald-600" : "text-slate-400"
              )}
            >
              {effortEnterSaving ? "Kaydediliyor" : isEffortEnter ? "Aktif" : "Pasif"}
            </span>
            <Switch
              checked={isEffortEnter}
              disabled={isFormLocked}
              onCheckedChange={(checked) => void handleToggleEffortEnter(checked)}
              aria-label="Efor girilebilir durumunu değiştir"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Efor istenecek kişi</span>
          <input
            ref={userInputRef}
            type="text"
            value={userQuery}
            disabled={isFormLocked}
            aria-label="Efor istenecek kişiyi ara"
            placeholder="Kullanıcı ara (örn. murat.merdogan)"
            onChange={(event) => handleUserQueryChange(event.target.value)}
            onFocus={() => setUserInputFocused(true)}
            onBlur={handleUserInputBlur}
            onKeyDown={handleUserKeyDown}
            className={cn(fieldClassName, "min-w-0")}
          />
          {userInputFocused && userSearchLoading && (
            <p className="text-[11px] text-slate-400">Aranıyor...</p>
          )}
          {userInputFocused &&
            !userSearchLoading &&
            !selectedUser &&
            !isEffortProcessLocked &&
            userResults.length > 0 && (
            <ul className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-white">
              {userResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectUser(user)}
                    className="w-full px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span className="font-medium">{displayUserName(user)}</span>
                    {user.email ? (
                      <span className="ml-2 text-xs text-slate-400">{user.email}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedUser && !isEffortProcessLocked && (
            <p className="text-[11px] text-slate-500">
              Seçilen:{" "}
              <span className="font-medium text-[#3e5d8f]">{displayUserName(selectedUser)}</span>
              {selectedUser.email ? ` · ${selectedUser.email}` : ""}
            </p>
          )}
        </div>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Açıklama</span>
          <textarea
            ref={descriptionRef}
            value={description}
            disabled={isFormLocked}
            aria-label="Efor açıklaması"
            placeholder="Neden efor istiyorsunuz? (opsiyonel)"
            onChange={(event) => setDescription(event.target.value)}
            className="h-14 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm leading-5 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/10 disabled:bg-slate-50"
          />
        </label>

        {contactVisible && (
          <div className="flex min-w-0 flex-col gap-1.5" role="group" aria-label="Müşteri Yetkili Bilgisi">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Müşteri Yetkili Bilgisi</span>
              {!isEffortProcessLocked && (
                <button
                  type="button"
                  onClick={() => void handleSaveCustomerEffortContact()}
                  disabled={isFormLocked}
                  aria-label="Müşteri yetkili bilgisini güncelle"
                  className="h-7 rounded-md border border-slate-200 px-2.5 text-[11px] font-semibold text-[#3e5d8f] hover:bg-slate-50 disabled:opacity-40"
                >
                  {contactSaving ? "Kaydediliyor" : "Güncelle"}
                </button>
              )}
            </div>
            {isEffortProcessLocked ? (
              <div
                className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm leading-5 text-slate-700 [&_p]:mb-1"
                dangerouslySetInnerHTML={{ __html: customerEffortContact }}
              />
            ) : (
              <ReactQuill
                className="customer-effort-quill customer-effort-quill-dialog"
                theme="snow"
                value={customerEffortContact}
                onChange={(value, _delta, source) => {
                  if (source === "user") setCustomerEffortContact(value);
                }}
                modules={customerEffortModules}
                formats={customerEffortFormats}
                readOnly={isFormLocked}
                placeholder="Müşteri yetkili bilgisi"
              />
            )}
          </div>
        )}

        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Efor istenen kişiler</p>
          {listLoading ? (
            <p className="text-[11px] text-slate-400">Yükleniyor...</p>
          ) : extraAccess.length === 0 ? (
            <p className="text-[11px] text-slate-400">Henüz efor istenen kişi yok.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {extraAccess.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-sm text-slate-700"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="truncate font-medium">{item.name}</span>
                    {item.isEffortComplated ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Efor-girişi yapıldı
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700">
                        Beklemede
                      </span>
                    )}
                    {item.isManagerApproved === true ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Yönetici onayladı
                      </span>
                    ) : item.isManagerApproved === false ? (
                      <span className="inline-flex shrink-0 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-violet-700">
                        Yönetici onayında beklemede
                      </span>
                    ) : null}
                  </div>
                  {!isEffortProcessLocked && (
                    <button
                      type="button"
                      aria-label={`${item.name} efor isteğini kaldır`}
                      disabled={isFormLocked}
                      onClick={() => void handleRevoke(item)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      {revokingUserId === item.userAppId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2.5">
        <button
          type="button"
          onClick={handleCancel}
          disabled={
            submitting || revokingUserId != null || effortEnterSaving || contactSaving || pendingSelfRevoke != null
          }
          className="h-9 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-40"
        >
          Kapat
        </button>
        {!isEffortProcessLocked && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isFormLocked || !selectedUser?.id || pendingSelfRevoke != null}
            aria-busy={submitting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3e5d8f] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#324d7a] disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Efor İste
          </button>
        )}
      </div>
    </div>
  );
};

export default GrantTicketAccessPanel;
