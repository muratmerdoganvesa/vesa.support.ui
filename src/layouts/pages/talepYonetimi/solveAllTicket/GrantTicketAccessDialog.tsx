import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";

import { UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { axiosInstance } from "utils/axiosInstance";
import { cn } from "lib/utils";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Switch } from "components/ui/switch";
import { readEffortApiError, setTicketEffortEnter } from "../createTicket/api/ticketEffortApi";

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
}

interface GrantTicketAccessPanelProps {
  ticket: GrantTicketAccessTicket;
  onClose: () => void;
  onGranted: (ticketId: string) => void;
  onEffortEnterChange: (ticketId: string, isEffortEnter: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}

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
  const [isEffortEnter, setIsEffortEnter] = useState(Boolean(ticket.isEffortEnter));
  const [effortEnterSaving, setEffortEnterSaving] = useState(false);
  const searchTimerRef = useRef<number | null>(null);

  const loadAccessList = async () => {
    setListLoading(true);
    try {
      const response = await axiosInstance.get<AccessListItem[]>("/api/Ticket/GetActiveTicketAccess", {
        params: { ticketId: ticket.id },
      });
      setAccessList(response.data ?? []);
    } catch {
      setAccessList([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    setIsEffortEnter(Boolean(ticket.isEffortEnter));
  }, [ticket.id, ticket.isEffortEnter]);

  useEffect(() => {
    onBusyChange(submitting || revokingUserId != null || effortEnterSaving);
    return () => onBusyChange(false);
  }, [submitting, revokingUserId, effortEnterSaving, onBusyChange]);

  useEffect(() => {
    userInputRef.current?.focus();
    void loadAccessList();
  }, [ticket.id]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleCancel = () => {
    if (submitting || revokingUserId || effortEnterSaving) return;
    onClose();
  };

  const handleToggleEffortEnter = async (next: boolean) => {
    if (effortEnterSaving || submitting || revokingUserId) return;
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
      setUserResults([]);
      setUserSearchLoading(false);
      return;
    }
    searchTimerRef.current = window.setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const api = new UserApi(getConfiguration());
        const response = await api.apiUserGetAllUsersWitNameAssignGet(query);
        setUserResults((response.data ?? []) as AssignUser[]);
      } catch {
        setUserResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
  };

  const handleSelectUser = (user: AssignUser) => {
    setSelectedUser(user);
    setUserQuery(displayUserName(user));
    setUserResults([]);
  };

  const handleSubmit = async () => {
    if (submitting || !selectedUser?.id) {
      if (!selectedUser?.id) {
        dispatchAlert({ message: "Lütfen efor istenecek kişiyi seçiniz.", type: "Warning" });
        userInputRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/api/Ticket/GrantTicketAccess", {
        ticketId: ticket.id,
        userAppId: selectedUser.id,
        description: description.trim() || undefined,
      });

      dispatchAlert({
        message: `${displayUserName(selectedUser)} kişisinden efor istendi.`,
        type: "Success",
      });
      setSelectedUser(null);
      setUserQuery("");
      setDescription("");
      await loadAccessList();
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

  const handleRevoke = async (item: AccessListItem) => {
    if (item.isPrimary || revokingUserId || submitting || effortEnterSaving) return;

    setRevokingUserId(item.userAppId);
    try {
      await axiosInstance.post("/api/Ticket/RevokeTicketAccess", {
        ticketId: ticket.id,
        userAppId: item.userAppId,
      });
      dispatchAlert({ message: `${item.name} için efor isteği kaldırıldı.`, type: "Success" });
      await loadAccessList();
    } catch (error) {
      dispatchAlert({
        message: "Efor isteği kaldırılırken hata oluştu: " + formatRequestError(error),
        type: "Error",
      });
    } finally {
      setRevokingUserId(null);
    }
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
          disabled={submitting || revokingUserId != null || effortEnterSaving}
          aria-label="Vazgeç"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700">Efor girilebilir</p>
            <p className="text-[11px] text-slate-400">
              {isEffortEnter
                ? "Atanan ve efor istenen kişiler efor girebilir."
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
              disabled={effortEnterSaving || submitting || revokingUserId != null}
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
            disabled={submitting}
            aria-label="Efor istenecek kişiyi ara"
            placeholder="Kullanıcı ara (örn. murat.merdogan)"
            onChange={(event) => handleUserQueryChange(event.target.value)}
            onKeyDown={handleUserKeyDown}
            className={cn(fieldClassName, "min-w-0")}
          />
          {userSearchLoading && <p className="text-[11px] text-slate-400">Aranıyor...</p>}
          {!userSearchLoading && userResults.length > 0 && (
            <ul className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-white">
              {userResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
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
          {selectedUser && (
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
            disabled={submitting}
            aria-label="Efor açıklaması"
            placeholder="Neden efor istiyorsunuz? (opsiyonel)"
            onChange={(event) => setDescription(event.target.value)}
            className="h-14 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm leading-5 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/10 disabled:bg-slate-50"
          />
        </label>

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
                  <span className="truncate font-medium">{item.name}</span>
                  <button
                    type="button"
                    aria-label={`${item.name} efor isteğini kaldır`}
                    disabled={submitting || revokingUserId != null || effortEnterSaving}
                    onClick={() => handleRevoke(item)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                  >
                    {revokingUserId === item.userAppId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
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
          disabled={submitting || revokingUserId != null || effortEnterSaving}
          className="h-9 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-40"
        >
          Kapat
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || revokingUserId != null || effortEnterSaving || !selectedUser?.id}
          aria-busy={submitting}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3e5d8f] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#324d7a] disabled:opacity-40"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Efor İste
        </button>
      </div>
    </div>
  );
};

export default GrantTicketAccessPanel;
