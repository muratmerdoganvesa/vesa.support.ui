import { useRef, useState } from "react";
import { GripVertical, Trash2, AlignLeft } from "lucide-react";
import { cn } from "lib/utils";
import UserSearchCombobox, { getUserDisplayName } from "../UserSearchCombobox";
import { TicketTaskInput, TASK_STATUS_CONFIG, TaskStatus } from "../../types/ticketTask.types";
import { TicketTaskListDto, TicketTaskUpdateDto } from "api/generated";
import type { UserAppDto } from "api/generated";

// ─── Create modu props ────────────────────────────────────────────────────────

interface CreateModeProps {
  mode: "create";
  task: TicketTaskInput;
  dragHandleProps?: Record<string, unknown>;
  onTitleChange: (clientId: string, title: string) => void;
  onDescriptionChange: (clientId: string, description: string) => void;
  onAssigneeChange: (clientId: string, user: UserAppDto | null) => void;
  userSearchResults: UserAppDto[];
  onUserSearch: (q: string) => void;
  assignDisabled?: boolean;
  onDelete: (clientId: string) => void;
}

// ─── Edit modu props ──────────────────────────────────────────────────────────

interface EditModeProps {
  mode: "edit";
  task: TicketTaskListDto;
  onPatch: (taskId: string, dto: TicketTaskUpdateDto) => Promise<void>;
  onDelete: (taskId: string) => void;
  userSearchResults: UserAppDto[];
  onUserSearch: (q: string) => void;
  assignDisabled?: boolean;
}

type TaskItemProps = CreateModeProps | EditModeProps;

// ─── Status colour maps ───────────────────────────────────────────────────────

const STATUS_LEFT_BORDER: Partial<Record<TaskStatus, string>> = {
  todo:        "border-l-slate-300",
  in_progress: "border-l-amber-400",
  done:        "border-l-emerald-400",
};

const STATUS_DOT: Partial<Record<TaskStatus, string>> = {
  todo:        "bg-slate-400",
  in_progress: "bg-amber-400",
  done:        "bg-emerald-500",
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const key = (status ?? "todo") as TaskStatus;
  const cfg = TASK_STATUS_CONFIG[key] ?? TASK_STATUS_CONFIG.todo;
  const dot = STATUS_DOT[key] ?? "bg-slate-400";

  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        cfg.className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      {cfg.label}
    </span>
  );
};

// ─── Assignee avatar initials ─────────────────────────────────────────────────

const AssigneeAvatar = ({ name }: { name: string }) => {
  if (!name) return null;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      title={name}
      aria-label={name}
      className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold ring-1 ring-indigo-200 select-none"
    >
      {initials}
    </span>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const TaskItem = (props: TaskItemProps) => {
  const { mode, task, onDelete } = props;

  const titleValue =
    mode === "create"
      ? (task as TicketTaskInput).title
      : (task as TicketTaskListDto).title ?? "";

  const descriptionValue =
    mode === "create"
      ? (task as TicketTaskInput).description ?? ""
      : (task as TicketTaskListDto).description ?? "";

  // ── Title editing state ──────────────────────────────────────────────────
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(titleValue);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleStartTitleEdit = () => {
    setTitleDraft(titleValue);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleCommitTitle = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(titleValue);
      setIsEditingTitle(false);
      return;
    }
    if (mode === "create") {
      (props as CreateModeProps).onTitleChange((task as TicketTaskInput).clientId, trimmed);
    } else {
      (props as EditModeProps).onPatch((task as TicketTaskListDto).id!, { title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleCommitTitle(); }
    if (e.key === "Escape") { setTitleDraft(titleValue); setIsEditingTitle(false); }
  };

  // ── Description editing state ────────────────────────────────────────────
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(descriptionValue);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const handleStartDescEdit = () => {
    setDescDraft(descriptionValue);
    setIsEditingDesc(true);
    setTimeout(() => {
      descRef.current?.focus();
      const len = descRef.current?.value.length ?? 0;
      descRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  const handleCommitDesc = () => {
    const trimmed = descDraft.trim();
    if (mode === "create") {
      (props as CreateModeProps).onDescriptionChange(
        (task as TicketTaskInput).clientId,
        trimmed,
      );
    } else {
      (props as EditModeProps).onPatch((task as TicketTaskListDto).id!, {
        description: trimmed,
      });
    }
    setIsEditingDesc(false);
  };

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setDescDraft(descriptionValue);
      setIsEditingDesc(false);
    }
    // Ctrl+Enter commits
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommitDesc();
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteClick = () => {
    if (mode === "create") {
      onDelete((task as TicketTaskInput).clientId);
    } else {
      onDelete((task as TicketTaskListDto).id!);
    }
  };

  const createTask = mode === "create" ? (task as TicketTaskInput) : null;
  const editTask   = mode === "edit"   ? (task as TicketTaskListDto) : null;

  const createAssigneeValue =
    createTask?.assigneeId != null
      ? {
          id: createTask.assigneeId,
          userAppName: createTask.assigneeLabel ?? "",
          firstName: "",
          lastName: "",
        }
      : null;

  const editAssigneeValue = editTask?.assignee
    ? editTask.assignee
    : editTask?.assigneeId
      ? { id: editTask.assigneeId, firstName: "", lastName: "", email: "" }
      : null;

  const editAssigneeName = editTask?.assignee ? getUserDisplayName(editTask.assignee) : "";

  const statusKey = (editTask?.status ?? "todo") as TaskStatus;
  const leftBorder =
    mode === "edit"
      ? (STATUS_LEFT_BORDER[statusKey] ?? "border-l-slate-200")
      : "border-l-slate-200";

  const hasDescription = descriptionValue.trim().length > 0;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-slate-200/80 border-l-[3px] bg-white px-3 py-2.5 shadow-sm",
        "transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-px",
        leftBorder,
      )}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-2">

        {/* Left: drag handle (create) / order pill (edit) */}
        <div className="shrink-0">
          {mode === "create" && (
            <span
              {...((props as CreateModeProps).dragHandleProps ?? {})}
              className="flex h-7 w-5 cursor-grab items-center justify-center rounded text-slate-300 hover:text-slate-500 transition-colors touch-none"
              aria-label="Görevi sürükle"
            >
              <GripVertical className="w-4 h-4" />
            </span>
          )}
          {mode === "edit" && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 shadow-sm shrink-0">
              {(editTask?.order ?? 0) + 1}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleCommitTitle}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent text-sm text-slate-800 font-medium outline-none border-b border-indigo-400 pb-0.5"
              aria-label="Görev başlığını düzenle"
            />
          ) : (
            <button
              type="button"
              onClick={handleStartTitleEdit}
              className="w-full text-left text-sm text-slate-700 font-medium truncate hover:text-indigo-600 transition-colors"
              aria-label="Başlığı düzenlemek için tıkla"
            >
              {titleValue || <span className="text-slate-400 italic text-xs">Başlık yok</span>}
            </button>
          )}
        </div>

        {/* Assignee combobox + avatar */}
        <div className="shrink-0 flex items-center gap-1.5">
          {mode === "edit" && editAssigneeName && (
            <AssigneeAvatar name={editAssigneeName} />
          )}
          <div className="w-36 sm:w-44">
            {mode === "create" && createTask && (
              <UserSearchCombobox
                value={createAssigneeValue}
                onChange={(u) =>
                  (props as CreateModeProps).onAssigneeChange(
                    createTask.clientId,
                    (u as UserAppDto | null) ?? null,
                  )
                }
                onSearch={(props as CreateModeProps).onUserSearch}
                results={(props as CreateModeProps).userSearchResults}
                placeholder="Atanan…"
                disabled={(props as CreateModeProps).assignDisabled}
                triggerClassName="h-7 py-1 px-2.5 text-xs rounded-lg"
              />
            )}
            {mode === "edit" && editTask && (
              <UserSearchCombobox
                value={editAssigneeValue}
                onChange={async (u) => {
                  const user = u as UserAppDto | null;
                  if (!user?.id) return;
                  await (props as EditModeProps).onPatch(editTask.id!, { assigneeId: user.id });
                }}
                onSearch={(props as EditModeProps).onUserSearch}
                results={(props as EditModeProps).userSearchResults}
                placeholder="Atanan seç…"
                disabled={(props as EditModeProps).assignDisabled}
                allowClear={false}
                triggerClassName="h-7 py-1 px-2.5 text-xs rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Status badge + Kanban dot + delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          {mode === "edit" && editTask && (
            <>
              <StatusBadge status={editTask.status} />
              {editTask.kanbanCardId && (
                <span
                  title="Kanban kartı mevcut"
                  className="shrink-0 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-indigo-100"
                  aria-label="Kanban kartı mevcut"
                />
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Görevi sil"
            className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity ml-0.5 rounded-lg p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Description row ── */}
      <div className="mt-1.5 pl-7">
        {isEditingDesc ? (
          <div className="flex flex-col gap-1">
            <textarea
              ref={descRef}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleCommitDesc}
              onKeyDown={handleDescKeyDown}
              rows={2}
              placeholder="Açıklama yazın… (Ctrl+Enter kaydet, Esc iptal)"
              className="w-full resize-none rounded-lg border border-indigo-300 bg-indigo-50/40 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              aria-label="Görev açıklaması"
            />
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span>Ctrl+Enter kaydet</span>
              <span>Esc iptal</span>
            </div>
          </div>
        ) : hasDescription ? (
          <button
            type="button"
            onClick={handleStartDescEdit}
            className="flex items-start gap-1.5 w-full text-left group/desc"
            aria-label="Açıklamayı düzenle"
          >
            <AlignLeft className="w-3 h-3 text-slate-300 group-hover/desc:text-indigo-400 transition-colors shrink-0 mt-0.5" />
            <span className="text-xs text-slate-500 line-clamp-2 leading-relaxed group-hover/desc:text-slate-700 transition-colors">
              {descriptionValue}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartDescEdit}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 transition-all"
            aria-label="Açıklama ekle"
          >
            <AlignLeft className="w-3 h-3" />
            Açıklama ekle
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
