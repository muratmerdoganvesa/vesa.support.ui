import { useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, CheckSquare, Loader2, Info, Save } from "lucide-react";
import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { TicketTaskListDto, TicketTaskUpdateDto, UserAppDto } from "api/generated";
import { TicketTaskInput } from "../../types/ticketTask.types";
import { getUserDisplayName } from "../UserSearchCombobox";
import TaskItem from "./TaskItem";

const MAX_TASKS = 20;

// ─── Sortable wrapper (create modu) ──────────────────────────────────────────

const SortableTaskItem = ({
  task,
  onTitleChange,
  onDescriptionChange,
  onAssigneeChange,
  onDueDateChange,
  onDelete,
  userSearchResults,
  onUserSearch,
  assignDisabled,
}: {
  task: TicketTaskInput;
  onTitleChange: (clientId: string, title: string) => void;
  onDescriptionChange: (clientId: string, description: string) => void;
  onAssigneeChange: (clientId: string, user: UserAppDto | null) => void;
  onDueDateChange: (clientId: string, dueDate: string | null) => void;
  onDelete: (clientId: string) => void;
  userSearchResults: UserAppDto[];
  onUserSearch: (q: string) => void;
  assignDisabled?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.clientId });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <TaskItem
        mode="create"
        task={task}
        dragHandleProps={{ ...attributes, ...listeners }}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        onAssigneeChange={onAssigneeChange}
        onDueDateChange={onDueDateChange}
        onDelete={onDelete}
        userSearchResults={userSearchResults}
        onUserSearch={onUserSearch}
        assignDisabled={assignDisabled}
      />
    </div>
  );
};

// ─── Create modu ──────────────────────────────────────────────────────────────

interface CreateModeProps {
  mode: "create";
  tasks: TicketTaskInput[];
  onChange: (tasks: TicketTaskInput[]) => void;
  userSearchResults: UserAppDto[];
  onUserSearch: (q: string) => void;
  assignDisabled?: boolean;
}

const CreateTaskList = ({
  tasks,
  onChange,
  userSearchResults,
  onUserSearch,
  assignDisabled,
}: CreateModeProps) => {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError("Görev başlığı boş olamaz.");
      inputRef.current?.focus();
      return;
    }
    if (tasks.length >= MAX_TASKS) return;

    const newTask: TicketTaskInput = {
      clientId: crypto.randomUUID(),
      title: trimmed,
      order: tasks.length,
      assigneeId: null,
    };
    onChange([...tasks, newTask]);
    setInputValue("");
    setInputError("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setInputValue("");
      setInputError("");
    }
  };

  const handleTitleChange = (clientId: string, title: string) => {
    onChange(tasks.map((t) => (t.clientId === clientId ? { ...t, title } : t)));
  };

  const handleDescriptionChange = (clientId: string, description: string) => {
    onChange(tasks.map((t) => (t.clientId === clientId ? { ...t, description } : t)));
  };

  const handleAssigneeChange = (clientId: string, user: UserAppDto | null) => {
    onChange(
      tasks.map((t) =>
        t.clientId === clientId
          ? {
              ...t,
              assigneeId: user?.id ?? null,
              assigneeLabel: user ? getUserDisplayName(user) : undefined,
            }
          : t
      )
    );
  };

  const handleDueDateChange = (clientId: string, dueDate: string | null) => {
    onChange(tasks.map((t) => (t.clientId === clientId ? { ...t, dueDate } : t)));
  };

  const handleDelete = (clientId: string) => {
    const filtered = tasks
      .filter((t) => t.clientId !== clientId)
      .map((t, i) => ({ ...t, order: i }));
    onChange(filtered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = tasks.findIndex((t) => t.clientId === active.id);
    const newIdx = tasks.findIndex((t) => t.clientId === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(tasks, oldIdx, newIdx).map((t, i) => ({ ...t, order: i }));
    onChange(reordered);
  };

  const atLimit = tasks.length >= MAX_TASKS;

  return (
    <div className="flex flex-col gap-4">

      {/* Bilgilendirme */}
      <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Kanban kartı için her göreve atanan seçin; ticket&apos;taki kullanıcı görevlere otomatik atanmaz.
        </p>
      </div>

      {/* Input satırı */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Görev başlığı yazın..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError("");
            }}
            onKeyDown={handleInputKeyDown}
            disabled={atLimit}
            aria-label="Yeni görev başlığı"
            className={cn(
              "rounded-xl border-slate-200 bg-white text-sm",
              inputError && "border-rose-400 focus-visible:ring-rose-100"
            )}
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={atLimit}
            className="shrink-0 h-9 px-4 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            aria-label="Görev ekle"
          >
            <Plus className="w-3.5 h-3.5" />
            Ekle
          </Button>
        </div>
        {inputError && (
          <p className="text-xs text-rose-500 ml-1">{inputError}</p>
        )}
        {atLimit && (
          <p className="text-xs text-amber-600 ml-1">Maksimum {MAX_TASKS} görev eklenebilir.</p>
        )}
      </div>

      {/* Sayaç */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Görevler</span>
        <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 min-w-[22px]">
          {tasks.length}
        </span>
        <span className="text-[10px] text-slate-300 font-medium">/ {MAX_TASKS}</span>
      </div>

      {/* Liste */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <CheckSquare className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-400">Henüz görev eklenmedi.</p>
          <p className="text-xs text-slate-300">Yukarıdan görev ekleyin veya boş bırakın.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.clientId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.clientId}
                  task={task}
                  onTitleChange={handleTitleChange}
                  onDescriptionChange={handleDescriptionChange}
                  onAssigneeChange={handleAssigneeChange}
                  onDueDateChange={handleDueDateChange}
                  onDelete={handleDelete}
                  userSearchResults={userSearchResults}
                  onUserSearch={onUserSearch}
                  assignDisabled={assignDisabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

// ─── Edit modu ────────────────────────────────────────────────────────────────

interface EditModeProps {
  mode: "edit";
  tasks: TicketTaskListDto[];
  loading: boolean;
  onPatch: (taskId: string, dto: TicketTaskUpdateDto) => Promise<void>;
  onDelete: (taskId: string) => void;
  onAdd?: (title: string, description?: string, assigneeId?: string | null) => Promise<void>;
  userSearchResults: UserAppDto[];
  onUserSearch: (q: string) => void;
  assignDisabled?: boolean;
}

const EditTaskList = ({
  tasks,
  loading,
  onPatch,
  onDelete,
  onAdd,
  userSearchResults,
  onUserSearch,
  assignDisabled,
}: EditModeProps) => {
  const [newTitle, setNewTitle] = useState("");
  const [newTitleError, setNewTitleError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const newTitleRef = useRef<HTMLInputElement>(null);

  const handleAddTask = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setNewTitleError("Görev başlığı boş olamaz.");
      newTitleRef.current?.focus();
      return;
    }
    if (!onAdd) return;
    try {
      setIsSaving(true);
      await onAdd(trimmed);
      setNewTitle("");
      setNewTitleError("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleAddTask(); }
    if (e.key === "Escape") { setNewTitle(""); setNewTitleError(""); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Görevler yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Info callout */}
      <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 px-3.5 py-2.5">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          Başlık, atama ve açıklama düzenlemeleri eş zamanlı olarak Kanban tarafında da güncellenir.{" "}
          Diğer durumlar için Kanban tarafından ilgili görevi düzenleyin.
        </p>
      </div>

      {/* Add new task input — independent save */}
      {onAdd && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-1">Yeni Görev Ekle</p>
          <div className="flex gap-2">
            <Input
              ref={newTitleRef}
              type="text"
              placeholder="Görev başlığı yazın..."
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (newTitleError) setNewTitleError("");
              }}
              onKeyDown={handleNewTitleKeyDown}
              disabled={isSaving || assignDisabled}
              aria-label="Yeni görev başlığı"
              className={cn(
                "rounded-xl border-slate-200 bg-white text-sm",
                newTitleError && "border-rose-400 focus-visible:ring-rose-100"
              )}
            />
            <Button
              type="button"
              onClick={handleAddTask}
              disabled={isSaving || assignDisabled}
              className="shrink-0 h-9 px-4 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
              aria-label="Görevi kaydet"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Kaydet
            </Button>
          </div>
          {newTitleError && (
            <p className="text-xs text-rose-500 ml-1">{newTitleError}</p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Görevler</span>
        <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 min-w-[22px]">
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <CheckSquare className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-400">Bu ticket&apos;a ait görev bulunamadı.</p>
          <p className="text-xs text-slate-300">Yukarıdan yeni görev ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((task) => (
              <TaskItem
                key={task.id}
                mode="edit"
                task={task}
                onPatch={onPatch}
                onDelete={onDelete}
                userSearchResults={userSearchResults}
                onUserSearch={onUserSearch}
                assignDisabled={assignDisabled}
              />
            ))}
        </div>
      )}
    </div>
  );
};

// ─── Public export ──────────────────────────────────────────────────────────────

type TaskListProps = CreateModeProps | EditModeProps;

const TaskList = (props: TaskListProps) => {
  if (props.mode === "create") {
    return <CreateTaskList {...props} />;
  }
  return <EditTaskList {...props} />;
};

export default TaskList;
