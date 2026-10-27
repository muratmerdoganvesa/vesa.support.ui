import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

import { UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { axiosInstance } from "utils/axiosInstance";
import { cn } from "lib/utils";
import { useAlert } from "layouts/pages/hooks/useAlert";

export interface SubmitForApprovalTicket {
  id: string;
  ticketNumber?: number | string | null;
  title?: string | null;
  status?: number | null;
  statusText?: string | null;
  ticketAssigneText?: string | null;
}

interface AssignUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  userAppName?: string | null;
  email?: string | null;
}

interface SubmitForApprovalPanelProps {
  ticket: SubmitForApprovalTicket;
  onClose: () => void;
  onSubmitted: (ticketId: string) => void;
  onBusyChange: (busy: boolean) => void;
}

const LOCKED_STATUS_IDS = new Set([9, 10, 11, 12]);

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
    const data = (error as { response?: { data?: { errors?: unknown; message?: unknown } } }).response?.data;
    const errors = data?.errors;
    if (Array.isArray(errors) && errors.length > 0) return errors.map(String).join(", ");
    if (typeof errors === "string" && errors.trim() !== "") return errors;
    if (typeof data?.message === "string" && data.message.trim() !== "") return data.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

const SubmitForApprovalPanel = ({
  ticket,
  onClose,
  onSubmitted,
  onBusyChange,
}: SubmitForApprovalPanelProps) => {
  const dispatchAlert = useAlert();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AssignUser | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<AssignUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const searchTimerRef = useRef<number | null>(null);

  const locked = LOCKED_STATUS_IDS.has(Number(ticket.status));

  useEffect(() => {
    onBusyChange(submitting);
    return () => onBusyChange(false);
  }, [submitting, onBusyChange]);

  useEffect(() => {
    userInputRef.current?.focus();
  }, [ticket.id]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleCancel = () => {
    if (submitting) return;
    onClose();
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
    if (submitting || locked) return;

    if (!selectedUser?.id) {
      dispatchAlert({ message: "Lütfen onayına sunulacak kişiyi seçiniz.", type: "Warning" });
      userInputRef.current?.focus();
      return;
    }

    const note = description.trim();
    setSubmitting(true);

    try {
      await axiosInstance.post("/api/Ticket/SubmitForSingleApproval", {
        ticketId: ticket.id,
        approveUserAppId: selectedUser.id,
        description: note || undefined,
      });

      dispatchAlert({
        message: `Talep ${displayUserName(selectedUser)} onayına sunuldu. Atama değişmedi; onaylanana kadar listede görünmez.`,
        type: "Success",
      });
      onSubmitted(ticket.id);
    } catch (error) {
      dispatchAlert({
        message: "Onaya sunulurken hata oluştu: " + formatRequestError(error),
        type: "Error",
      });
    } finally {
      setSubmitting(false);
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

  const handleDescriptionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const ticketLabel =
    ticket.ticketNumber != null && ticket.ticketNumber !== ""
      ? `#${ticket.ticketNumber}`
      : "Talep";

  return (
    <div className="w-full bg-white">
      <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-slate-900">
            Onaya Sun · {ticketLabel}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {ticket.title || "Başlıksız talep"}
            {ticket.statusText ? ` · ${ticket.statusText}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          aria-label="Vazgeç"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Onaylayacak kişi</span>
          <input
            ref={userInputRef}
            type="text"
            value={userQuery}
            disabled={submitting || locked}
            aria-label="Onaylayacak kişi ara"
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
            disabled={submitting || locked}
            aria-label="Onaya sunma açıklaması"
            placeholder="Neden onaya sunuyorsunuz? (opsiyonel)"
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            className="h-16 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm leading-5 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/10 disabled:bg-slate-50"
          />
        </label>

        <p className="text-[11px] leading-relaxed text-slate-500">
          Atama değişmez. Seçilen kişi onaylayana kadar talep listede görünmez; onay sonrası mevcut
          atanan / talep sahibinin listesinde görünür.
        </p>
      </div>

      {locked && (
        <p className="px-4 pb-2 text-xs text-amber-700">
          Bu talep mevcut durumunda onaya sunulamaz.
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2.5">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="h-9 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-500 hover:bg-rose-50 disabled:opacity-40"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || locked || !selectedUser?.id}
          aria-busy={submitting}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3e5d8f] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#324d7a] disabled:opacity-40"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Onaya Gönder
        </button>
      </div>
    </div>
  );
};

export default SubmitForApprovalPanel;
