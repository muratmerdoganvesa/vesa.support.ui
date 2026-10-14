import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

import {
  TicketApi,
  TicketAssigneDto,
  TicketListDto,
  TicketNotificationsInsertDto,
  TicketStatus,
  TicketTeamApi,
  TicketUpdateDto,
  UserApi,
} from "api/generated";
import getConfiguration from "confiuration";
import { cn } from "lib/utils";
import { useAlert } from "layouts/pages/hooks/useAlert";

export interface QuickUpdateTicket {
  id: string;
  ticketNumber?: number | string | null;
  title?: string | null;
  status?: number | null;
  statusText?: string | null;
  ticketAssigneText?: string | null;
}

interface TeamOption {
  id: string;
  name: string;
}

interface AssignUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userAppName?: string | null;
}

interface StatusOption {
  id: number;
  name: string;
  description: string;
}

interface QuickUpdatePanelProps {
  ticket: QuickUpdateTicket;
  onClose: () => void;
  onUpdated: (ticketId: string, status: number, statusText: string, assigneeText?: string) => void;
  onBusyChange: (busy: boolean) => void;
}

const LOCKED_STATUS_IDS = new Set([9, 10, 11, 12]);

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const displayUserName = (user: AssignUser | null): string => {
  if (!user) return "";
  if (user.userAppName) return user.userAppName;
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
};

const formatRequestError = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { errors?: unknown } } }).response?.data;
    const errors = data?.errors;
    if (Array.isArray(errors) && errors.length > 0) return errors.map(String).join(", ");
    if (typeof errors === "string" && errors.trim() !== "") return errors;
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

const QuickUpdatePanel = ({ ticket, onClose, onUpdated, onBusyChange }: QuickUpdatePanelProps) => {
  const dispatchAlert = useAlert();
  const statusRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const statusReadyToLeaveRef = useRef(false);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(
    ticket.status != null ? String(ticket.status) : ""
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assignTeam, setAssignTeam] = useState(false);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
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
    statusRef.current?.focus();
  }, [ticket.id]);

  useEffect(() => {
    if (statusOptions.length > 0) return;

    let cancelled = false;
    const loadStatuses = async () => {
      setOptionsLoading(true);
      try {
        const api = new TicketApi(getConfiguration());
        const response = await api.apiTicketTicketStatusGet();
        const statData = (response.data ?? []) as StatusOption[];
        if (cancelled) return;
        setStatusOptions(
          statData.filter((item) => {
            const id = Number(item.id);
            return id !== 1 && id !== 2 && id !== 12;
          })
        );
      } catch (error) {
        if (!cancelled) {
          dispatchAlert({ message: "Hata oluştu " + formatRequestError(error), type: "Error" });
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    loadStatuses();
    return () => {
      cancelled = true;
    };
  }, [statusOptions.length, dispatchAlert]);

  useEffect(() => {
    let cancelled = false;
    const loadTeams = async () => {
      try {
        const api = new TicketTeamApi(getConfiguration());
        const response = await api.apiTicketTeamWithoutTeamGet(false);
        if (cancelled) return;
        setTeams(
          (response.data ?? [])
            .map((team) => ({ id: String(team.id ?? ""), name: team.name ?? "" }))
            .filter((team) => team.id !== "" && team.name !== "")
        );
      } catch (error) {
        if (!cancelled) {
          dispatchAlert({ message: "Hata oluştu " + formatRequestError(error), type: "Error" });
        }
      }
    };
    loadTeams();
    return () => {
      cancelled = true;
    };
  }, [dispatchAlert]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  const visibleOptions = useMemo(() => {
    if (ticket.status == null) return statusOptions;
    const currentId = Number(ticket.status);
    // Onay Sürecinde (12) seçenek listesinde gösterilmez
    if (currentId === 12) return statusOptions;
    if (statusOptions.some((item) => Number(item.id) === currentId)) return statusOptions;
    return [
      ...statusOptions,
      {
        id: currentId,
        name: ticket.statusText ?? String(currentId),
        description: ticket.statusText ?? String(currentId),
      },
    ];
  }, [statusOptions, ticket.status, ticket.statusText]);

  const handleCancel = () => {
    if (submitting) return;
    onClose();
  };

  const handleAssignMode = (teamMode: boolean) => {
    setAssignTeam(teamMode);
    if (teamMode) {
      setSelectedUser(null);
      setUserQuery("");
      setUserResults([]);
      return;
    }
    setSelectedTeamId("");
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

  const moveStatus = (direction: 1 | -1) => {
    if (visibleOptions.length === 0) return;
    const currentIndex = visibleOptions.findIndex((item) => String(item.id) === selectedStatusId);
    const start = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (start + direction + visibleOptions.length) % visibleOptions.length;
    setSelectedStatusId(String(visibleOptions[nextIndex].id));
    statusReadyToLeaveRef.current = true;
  };

  const handleUpdate = async () => {
    if (submitting || locked) return;

    const updateReason = description.trim();
    if (!updateReason) {
      dispatchAlert({ message: "Lütfen güncelleme nedenini yazınız.", type: "Warning" });
      descriptionRef.current?.focus();
      return;
    }

    if (!selectedStatusId) {
      dispatchAlert({ message: "Lütfen durum seçiniz.", type: "Warning" });
      statusRef.current?.focus();
      return;
    }

    const nextStatus = Number(selectedStatusId);
    setSubmitting(true);

    try {
      const api = new TicketApi(getConfiguration());
      const ticketResponse = await api.apiTicketIdGet(ticket.id);
      const ticketData = ticketResponse.data as TicketListDto | null;

      if (!ticketData?.id) {
        dispatchAlert({ message: "Talep atanırken bir hata oluştu", type: "Error" });
        return;
      }

      if (ticketData.canEdit === false || LOCKED_STATUS_IDS.has(Number(ticketData.status))) {
        dispatchAlert({ message: "Bu talep mevcut durumunda güncellenemez.", type: "Warning" });
        return;
      }

      const assigneeText = ticketData.ticketAssigneText ?? ticket.ticketAssigneText ?? "";
      const hasNewAssignee = (assignTeam && selectedTeamId !== "") || (!assignTeam && Boolean(selectedUser?.id));
      if (nextStatus !== 10 && (assigneeText === "" || assigneeText === "Atama Yok") && !hasNewAssignee) {
        dispatchAlert({ message: "Lütfen atanılan kişi veya talep seçiniz.", type: "Warning" });
        return;
      }

      const notifications: TicketNotificationsInsertDto[] = [];
      for (const item of ticketData.ticketNotificationsListDto ?? []) {
        const userAppId = item.userAppId ?? item.user?.id;
        if (!userAppId) continue;
        notifications.push({ ticketId: ticket.id, userAppId });
      }

      const storedDescription = (ticketData.description ?? "").trim();
      const managerDto: TicketUpdateDto = {
        id: ticket.id,
        title: (ticketData.title ?? ticket.title ?? "").trim() || "Talep",
        description: storedDescription !== "" ? ticketData.description : updateReason,
        workCompanyId: ticketData.workCompanyId,
        workCompanySystemInfoId: ticketData.workCompanySystemInfoId,
        userAppId: ticketData.userAppId,
        type: ticketData.type,
        ticketSLA: ticketData.ticketSLA,
        ticketSubject: ticketData.ticketSubject,
        priority: ticketData.priority,
        ticketCode: ticketData.ticketCode,
        customerRefId: ticketData.customerRefId,
        addedMailAddresses: ticketData.addedMailAddresses,
        ticketDepartmentId: ticketData.ticketDepartmentId,
        status: nextStatus as TicketStatus,
        estimatedDeadline: ticketData.estimatedDeadline ?? null,
        ticketProjectId: ticketData.ticketProjectId ?? null,
      };

      const assigngDto: TicketAssigneDto = {
        ticketsId: ticket.id,
        isActive: true,
        description: updateReason,
      };
      if (assignTeam && selectedTeamId) {
        assigngDto.ticketTeamID = selectedTeamId;
      } else if (!assignTeam && selectedUser?.id) {
        assigngDto.userAppId = selectedUser.id;
      }

      await api.apiTicketAssignPost({
        managerDto,
        assigngDto,
        notificationsInsertDtos: notifications,
      });

      const statusText = visibleOptions.find((item) => Number(item.id) === nextStatus)?.description
        ?? ticket.statusText
        ?? "";
      const nextAssigneeText = assignTeam
        ? teams.find((team) => team.id === selectedTeamId)?.name
        : displayUserName(selectedUser);

      dispatchAlert({ message: "Talep başarıyla güncellendi", type: "Success" });
      onUpdated(ticket.id, nextStatus, statusText, nextAssigneeText || undefined);
    } catch (error) {
      dispatchAlert({
        message: "Talep atanırken bir hata oluştu " + formatRequestError(error),
        type: "Error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusKeyDown = (event: React.KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveStatus(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      descriptionRef.current?.focus();
      return;
    }

    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      moveStatus(-1);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      if (!statusReadyToLeaveRef.current) {
        moveStatus(1);
        return;
      }
      descriptionRef.current?.focus();
    }
  };

  const handleDescriptionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }

    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      statusReadyToLeaveRef.current = false;
      statusRef.current?.focus();
      return;
    }

    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      handleUpdate();
    }
  };

  const ticketLabel = ticket.ticketNumber != null && ticket.ticketNumber !== ""
    ? `#${ticket.ticketNumber}`
    : "Talep";
  const currentAssignee = ticket.ticketAssigneText && ticket.ticketAssigneText !== "Atama Yok"
    ? ticket.ticketAssigneText
    : "Atama yok";

  return (
    <div className="w-full bg-white">
      <div className="h-[3px] bg-gradient-to-r from-[#3e5d8f] via-[#5272a8] to-[#8aaad4]" />
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-slate-900">
            Hızlı Güncelle · {ticketLabel}
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
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[16rem_minmax(0,1fr)]">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700">Talep durumu</span>
            <select
              ref={statusRef}
              value={selectedStatusId}
              disabled={submitting || locked || optionsLoading}
              aria-label="Talep durumu"
              onChange={(event) => {
                setSelectedStatusId(event.target.value);
                statusReadyToLeaveRef.current = true;
              }}
              onKeyDown={handleStatusKeyDown}
              className={fieldClassName}
            >
              {optionsLoading && visibleOptions.length === 0 && (
                <option value={selectedStatusId}>Yükleniyor...</option>
              )}
              {visibleOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.description || option.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Atama</span>
              <span className="truncate text-[11px] text-slate-500">
                Mevcut: <span className="font-medium text-[#3e5d8f]">{currentAssignee}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="grid w-[11rem] shrink-0 grid-cols-2 rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Atama tipi">
                <button
                  type="button"
                  onClick={() => handleAssignMode(false)}
                  disabled={submitting || locked}
                  className={cn(
                    "h-9 rounded-md text-xs font-semibold transition-colors",
                    !assignTeam ? "bg-white text-[#3e5d8f] shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Kullanıcı
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignMode(true)}
                  disabled={submitting || locked}
                  className={cn(
                    "h-9 rounded-md text-xs font-semibold transition-colors",
                    assignTeam ? "bg-white text-[#3e5d8f] shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Takım
                </button>
              </div>

              {!assignTeam ? (
                <input
                  type="text"
                  value={userQuery}
                  disabled={submitting || locked}
                  aria-label="Kullanıcı ara"
                  placeholder="Kullanıcı ara"
                  onChange={(event) => handleUserQueryChange(event.target.value)}
                  className={cn(fieldClassName, "min-w-0 flex-1")}
                />
              ) : (
                <select
                  value={selectedTeamId}
                  disabled={submitting || locked}
                  aria-label="Takım"
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  className={cn(fieldClassName, "min-w-0 flex-1")}
                >
                  <option value="">Takım seçiniz</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!assignTeam && userSearchLoading && (
              <p className="text-[11px] text-slate-400">Aranıyor...</p>
            )}
            {!assignTeam && userResults.length > 0 && (
              <ul className="max-h-28 overflow-auto rounded-lg border border-slate-200 bg-white">
                {userResults.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {displayUserName(user)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Açıklama</span>
          <textarea
            ref={descriptionRef}
            value={description}
            disabled={submitting || locked}
            aria-label="Açıklama"
            placeholder="Güncelleme nedeni"
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            className="h-10 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm leading-5 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3e5d8f] focus:ring-2 focus:ring-[#3e5d8f]/10 disabled:bg-slate-50"
          />
        </label>
      </div>

      {locked && (
        <p className="px-4 pb-2 text-xs text-amber-700">
          Bu talep mevcut durumunda güncellenemez.
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
          onClick={handleUpdate}
          disabled={submitting || locked || optionsLoading}
          aria-busy={submitting}
          tabIndex={-1}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3e5d8f] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#324d7a] disabled:opacity-40"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Güncelle
        </button>
      </div>
    </div>
  );
};

export default QuickUpdatePanel;
