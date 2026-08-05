import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
  KeyboardEvent,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { cn } from "lib/utils";
import {
  X,
  Save,
  Trash2,
  Folder,
  CalendarClock,
  Lock,
  Tag,
  FileText,
  Loader2,
  Plus,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { UserAppDtoWithoutPhoto, TicketProjectsListDto } from "api/generated";
import {
  STATUS_OPTIONS,
  STATUS_LABELS,
  getStatusLabel,
  TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from "../types/kanban.types";

// ─── Form state type ───────────────────────────────────────────────────────────

export interface KanbanTaskFormState {
  Status: string;
  Type: string;
  Priority: string;
  Assignee: string;
  AssigneeId: string;
  Summary: string;
  Description: string;
  Tags: string;
  RankId: string;
  projectId: string;
  dueDate: string;
}

const FIELD_LABELS: Record<string, string> = {
  Status: "Durum",
  Type: "Tür",
  Priority: "Öncelik",
  Assignee: "Atanan",
  AssigneeId: "Atanan",
  Summary: "Özet",
  dueDate: "Son tarih",
  projectId: "Proje",
};

const TYPE_COLORS: Record<string, string> = {
  Task: "#3b82f6",
  "Proje Planlama": "#8b5cf6",
  Proje: "#8b5cf6",
  Destek: "#f59e0b",
  CR: "#6366f1",
  Bug: "#ef4444",
  Günlük: "#22c55e",
  Ticket: "#0ea5e9",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  "Release Breaker": "#dc2626",
  High: "#f59e0b",
  Normal: "#3b82f6",
  Low: "#22c55e",
};

const STATUS_BADGE: Record<string, { bg: string; dot: string; text: string; active: string }> = {
  Backlog: {
    bg: "bg-slate-100",
    dot: "bg-slate-400",
    text: "text-slate-600",
    active: "ring-slate-400/40 bg-slate-200 text-slate-800",
  },
  Realization: {
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    text: "text-blue-700",
    active: "ring-blue-400/40 bg-blue-100 text-blue-800",
  },
  UAT: {
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    text: "text-amber-700",
    active: "ring-amber-400/40 bg-amber-100 text-amber-900",
  },
  Preparation: {
    bg: "bg-violet-50",
    dot: "bg-violet-500",
    text: "text-violet-700",
    active: "ring-violet-400/40 bg-violet-100 text-violet-900",
  },
  Done: {
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    active: "ring-emerald-400/40 bg-emerald-100 text-emerald-900",
  },
};

const getProjectLabel = (p: TicketProjectsListDto) =>
  p.subProjectName ? `${p.name} - ${p.subProjectName}` : p.name ?? "";

interface SearchComboboxOption {
  value: string;
  label: string;
  meta?: string;
}

function SearchCombobox({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  disabled,
  error,
  clearable = true,
}: {
  options: SearchComboboxOption[];
  value: string;
  onChange: (value: string, option?: SearchComboboxOption | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-[#3e5d8f]/20 focus:border-[#3e5d8f]/50",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
            "transition-colors hover:border-slate-300",
            error ? "border-red-400" : "border-slate-200"
          )}
        >
          <span className={cn("truncate text-left", !selected && "text-slate-400")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[10060] w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı</CommandEmpty>
            <CommandGroup>
              {clearable && value ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange("", null);
                    setOpen(false);
                  }}
                  className="text-xs text-slate-400"
                >
                  <X className="mr-2 h-3 w-3" />
                  Temizle
                </CommandItem>
              ) : null}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.meta ?? ""}`}
                  onSelect={() => {
                    onChange(opt.value, opt);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === opt.value ? "opacity-100 text-[#3e5d8f]" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function OptionChips({
  options,
  value,
  onChange,
  colors,
  disabled,
  error,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  colors?: Record<string, string>;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 rounded-lg p-0.5",
        error && "ring-1 ring-red-300"
      )}
      role="listbox"
      aria-disabled={disabled}
    >
      {options.map((opt) => {
        const selected = value === opt;
        const color = colors?.[opt];
        return (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e5d8f]/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "ring-2 shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
            style={
              selected && color
                ? {
                    backgroundColor: `${color}18`,
                    color,
                    boxShadow: `0 0 0 2px ${color}33`,
                  }
                : undefined
            }
          >
            {color ? (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
            ) : null}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface KanbanTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  form: KanbanTaskFormState;
  setForm: Dispatch<SetStateAction<KanbanTaskFormState>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
  assigneeData: UserAppDtoWithoutPhoto[];
  catalogProjects: TicketProjectsListDto[];
  catalogLoading: boolean;
  canDelete: boolean;
  onSave: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

const KanbanTaskDialog = ({
  open,
  onOpenChange,
  mode,
  form,
  setForm,
  errors,
  setErrors,
  assigneeData,
  catalogProjects,
  catalogLoading,
  canDelete,
  onSave,
  onDelete,
}: KanbanTaskDialogProps) => {
  const isTicket = mode === "edit" && form.Type === "Ticket";
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tagList = useMemo(
    () => form.Tags.split(",").map((t) => t.trim()).filter(Boolean),
    [form.Tags]
  );

  useEffect(() => {
    if (!open) {
      setTagDraft("");
      setSaving(false);
      setDeleting(false);
    }
  }, [open]);

  const statusBadge = STATUS_BADGE[form.Status] ?? STATUS_BADGE.Backlog;
  const typeColor = TYPE_COLORS[form.Type] ?? "#94a3b8";
  const priorityColor = PRIORITY_COLORS[form.Priority] ?? "#64748b";
  const busy = saving || deleting;

  const assigneeOptions = useMemo<SearchComboboxOption[]>(
    () =>
      assigneeData.map((u) => {
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Bilinmeyen";
        return { value: u.id ?? "", label: name, meta: u.userName ?? "" };
      }).filter((o) => o.value),
    [assigneeData]
  );

  const projectOptions = useMemo<SearchComboboxOption[]>(
    () =>
      catalogProjects.map((p) => ({
        value: p.id ?? "",
        label: getProjectLabel(p),
      })).filter((o) => o.value),
    [catalogProjects]
  );

  const typeChoices = isTicket
    ? ["Ticket"]
    : TYPE_OPTIONS.filter((o) => o !== "Ticket");

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (tagList.some((t) => t.toLowerCase() === next.toLowerCase())) {
      setTagDraft("");
      return;
    }
    const merged = [...tagList, next];
    setForm((f) => ({ ...f, Tags: merged.join(", ") }));
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    const merged = tagList.filter((t) => t !== tag);
    setForm((f) => ({ ...f, Tags: merged.join(", ") }));
  };

  const handleSave = async () => {
    if (busy) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[680px] w-full p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col"
        style={{ maxHeight: "min(820px, 90vh)" }}
        onKeyDown={onDialogKeyDown}
      >
        <DialogHeader className="shrink-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 space-y-0">
          <div className="flex items-center gap-3 px-6 py-4">
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-white",
                mode === "add" ? "bg-[#3e5d8f]" : "bg-slate-700"
              )}
            >
              {mode === "add" ? (
                <Plus className="w-4 h-4" aria-hidden />
              ) : (
                <FileText className="w-4 h-4" aria-hidden />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold text-slate-800 leading-tight">
                {mode === "add" ? "Yeni Görev Oluştur" : "Görevi Düzenle"}
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === "add"
                  ? "Zorunlu alanları doldurun · Ctrl+Enter ile kaydet"
                  : "Değişiklikleri kaydedin · Ctrl+Enter"}
              </p>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Dialog'u kapat"
                disabled={busy}
                className="ml-1 shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogClose>
          </div>

          <div className="flex items-center gap-2 px-6 pb-3 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                statusBadge.bg,
                statusBadge.text
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusBadge.dot)} />
              {getStatusLabel(form.Status)}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: typeColor }}
              />
              {form.Type || "Task"}
              {isTicket ? <Lock className="w-3 h-3 ml-0.5 opacity-60" /> : null}
            </span>
            {form.Priority ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${priorityColor}18`, color: priorityColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColor }}
                />
                {form.Priority}
              </span>
            ) : null}
            {form.Assignee ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                  {form.Assignee[0]?.toUpperCase()}
                </span>
                {form.Assignee}
              </span>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/80 px-6 py-5 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5" aria-hidden />
              Özet
              <span className="text-red-400 normal-case">*</span>
            </label>
            <input
              type="text"
              placeholder="Görev özetini girin..."
              value={form.Summary}
              disabled={busy}
              onChange={(e) => {
                setForm((f) => ({ ...f, Summary: e.target.value }));
                setErrors((prev) => ({ ...prev, Summary: "" }));
              }}
              aria-label="Görev özeti"
              aria-required="true"
              className={cn(
                "w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-2 text-xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none transition-colors disabled:opacity-60",
                errors.Summary
                  ? "border-red-400"
                  : "border-slate-200 focus:border-[#3e5d8f]"
              )}
            />
            {errors.Summary ? (
              <p className="text-xs text-red-500">{errors.Summary}</p>
            ) : null}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Özellikler
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Durum <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const badge = STATUS_BADGE[opt] ?? STATUS_BADGE.Backlog;
                    const selected = form.Status === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setForm((f) => ({ ...f, Status: opt }));
                          setErrors((prev) => ({ ...prev, Status: "" }));
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all border",
                          selected
                            ? cn(badge.active, "border-transparent ring-2")
                            : cn(badge.bg, badge.text, "border-transparent opacity-80 hover:opacity-100")
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                        {STATUS_LABELS[opt]}
                      </button>
                    );
                  })}
                </div>
                {errors.Status ? (
                  <p className="text-xs text-red-500">{errors.Status}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Tür <span className="text-red-400">*</span>
                  {isTicket ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 normal-case tracking-normal">
                      <Lock className="w-3 h-3" />
                      Ticket kaynaklı — değiştirilemez
                    </span>
                  ) : null}
                </label>
                <OptionChips
                  options={typeChoices}
                  value={form.Type}
                  colors={TYPE_COLORS}
                  disabled={busy || isTicket}
                  error={!!errors.Type}
                  onChange={(newType) => {
                    setForm((f) => ({
                      ...f,
                      Type: newType,
                      projectId: newType === "Proje Planlama" ? f.projectId : "",
                    }));
                    setErrors((prev) => ({ ...prev, Type: "" }));
                  }}
                />
                {errors.Type ? (
                  <p className="text-xs text-red-500">{errors.Type}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Öncelik <span className="text-red-400">*</span>
                </label>
                <OptionChips
                  options={PRIORITY_OPTIONS}
                  value={form.Priority}
                  colors={PRIORITY_COLORS}
                  disabled={busy}
                  error={!!errors.Priority}
                  onChange={(next) => {
                    setForm((f) => ({ ...f, Priority: next }));
                    setErrors((prev) => ({ ...prev, Priority: "" }));
                  }}
                />
                {errors.Priority ? (
                  <p className="text-xs text-red-500">{errors.Priority}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Atanan <span className="text-red-400">*</span>
                  </label>
                  <SearchCombobox
                    options={assigneeOptions}
                    value={form.AssigneeId}
                    placeholder="Kişi ara / seç"
                    searchPlaceholder="İsim ara..."
                    disabled={busy}
                    error={!!errors.Assignee || !!errors.AssigneeId}
                    onChange={(id, opt) => {
                      setForm((f) => ({
                        ...f,
                        AssigneeId: id,
                        Assignee: opt?.label ?? "",
                      }));
                      setErrors((prev) => ({ ...prev, Assignee: "", AssigneeId: "" }));
                    }}
                  />
                  {errors.Assignee || errors.AssigneeId ? (
                    <p className="text-xs text-red-500">
                      {errors.Assignee || errors.AssigneeId}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <CalendarClock className="w-3.5 h-3.5 text-[#3e5d8f]" aria-hidden />
                    Son Tarih <span className="text-red-400">*</span>
                  </label>
                  {isTicket ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm flex items-center gap-2 cursor-not-allowed select-none text-slate-500">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-sky-400" aria-hidden />
                        {form.dueDate
                          ? new Date(form.dueDate).toLocaleDateString("tr-TR")
                          : "—"}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Ticket kaynaklı tarih
                      </span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={form.dueDate}
                      disabled={busy}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, dueDate: e.target.value }));
                        setErrors((prev) => ({ ...prev, dueDate: "" }));
                      }}
                      aria-label="Son tarih"
                      aria-required="true"
                      className={cn(
                        "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3e5d8f]/20 transition-colors disabled:opacity-60",
                        errors.dueDate ? "border-red-400" : "border-slate-200"
                      )}
                    />
                  )}
                  {errors.dueDate ? (
                    <p className="text-xs text-red-500">{errors.dueDate}</p>
                  ) : null}
                </div>
              </div>

              {form.Type === "Proje Planlama" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Folder className="w-3.5 h-3.5 text-[#3e5d8f]" aria-hidden />
                    Proje
                    {catalogLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#3e5d8f]" aria-hidden />
                    ) : null}
                  </label>
                  <SearchCombobox
                    options={projectOptions}
                    value={form.projectId}
                    placeholder={
                      catalogLoading ? "Projeler yükleniyor..." : "Proje ara / seç (opsiyonel)"
                    }
                    searchPlaceholder="Proje ara..."
                    disabled={busy || catalogLoading}
                    onChange={(id) => setForm((f) => ({ ...f, projectId: id }))}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Açıklama
              </p>
            </div>
            <div className="p-4">
              <textarea
                rows={5}
                placeholder="Görev detaylarını, kabul kriterlerini veya notlarını buraya girin..."
                value={form.Description}
                disabled={busy}
                onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))}
                aria-label="Açıklama"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 resize-y focus:outline-none focus:ring-2 focus:ring-[#3e5d8f]/20 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Tag className="w-3 h-3" aria-hidden />
                Etiketler
              </p>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Yazıp Enter ile ekle"
                value={tagDraft}
                disabled={busy}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Backspace" && !tagDraft && tagList.length) {
                    removeTag(tagList[tagList.length - 1]);
                  }
                }}
                aria-label="Etiketler"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3e5d8f]/20 transition-colors disabled:opacity-60"
              />
              {tagList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5" aria-label="Eklenen etiketler">
                  {tagList.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      disabled={busy}
                      onClick={() => removeTag(tag)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      {tag}
                      <X className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
          <div className="shrink-0">
            {canDelete ? (
              <Button
                type="button"
                variant="destructive"
                className="h-9 px-4 text-sm gap-1.5"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                )}
                {deleting ? "Siliniyor…" : "Görevi Sil"}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-sm"
                disabled={busy}
              >
                İptal
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="h-9 px-5 text-sm bg-[#3e5d8f] hover:bg-[#324d7a] text-white gap-1.5 whitespace-nowrap"
              disabled={busy}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Save className="w-4 h-4 shrink-0" aria-hidden />
              )}
              {saving
                ? "Kaydediliyor…"
                : mode === "add"
                  ? "Oluştur"
                  : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KanbanTaskDialog;
export { FIELD_LABELS };
