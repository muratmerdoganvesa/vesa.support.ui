import { Dispatch, SetStateAction } from "react";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "components/ui/sheet";
import { Button } from "components/ui/button";
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
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { UserAppDtoWithoutPhoto, TicketProjectsListDto } from "api/generated";
import {
  STATUS_OPTIONS,
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

// ─── Colour maps ───────────────────────────────────────────────────────────────

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

const STATUS_BADGE: Record<string, { bg: string; dot: string; text: string }> = {
  Backlog:     { bg: "bg-slate-100",    dot: "bg-slate-400",    text: "text-slate-600" },
  Realization: { bg: "bg-blue-50",      dot: "bg-blue-500",     text: "text-blue-700" },
  UAT:         { bg: "bg-amber-50",     dot: "bg-amber-500",    text: "text-amber-700" },
  Preparation: { bg: "bg-violet-50",    dot: "bg-violet-500",   text: "text-violet-700" },
  Done:        { bg: "bg-emerald-50",   dot: "bg-emerald-500",  text: "text-emerald-700" },
};

// ─── Helper ────────────────────────────────────────────────────────────────────

const getProjectLabel = (p: TicketProjectsListDto) =>
  p.subProjectName ? `${p.name} - ${p.subProjectName}` : p.name ?? "";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface KanbanTaskPanelProps {
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
  onSave: () => void;
  onDelete: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const KanbanTaskPanel = ({
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
}: KanbanTaskPanelProps) => {
  const isTicket = mode === "edit" && form.Type === "Ticket";
  const tagList = form.Tags.split(",").map((t) => t.trim()).filter(Boolean);

  const statusBadge = STATUS_BADGE[form.Status] ?? STATUS_BADGE.Backlog;
  const typeColor = TYPE_COLORS[form.Type] ?? "#94a3b8";
  const priorityColor = PRIORITY_COLORS[form.Priority] ?? "#64748b";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[680px] p-0 flex flex-col gap-0"
      >
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <div className="shrink-0 bg-white border-b border-slate-200">

          {/* Breadcrumb row */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden />
              <span className="shrink-0">Kanban</span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" aria-hidden />
              <span className="font-semibold text-slate-700 truncate">
                {mode === "add" ? "Yeni Görev" : "Görevi Düzenle"}
              </span>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Paneli kapat"
                className="ml-3 shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <X className="w-4 h-4" />
              </button>
            </SheetClose>
          </div>

          {/* Live pill badges row */}
          <div className="flex items-center gap-2 px-6 py-3 flex-wrap">
            {/* Status */}
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
              statusBadge.bg,
              statusBadge.text
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusBadge.dot)} />
              {form.Status || "Backlog"}
            </span>

            {/* Type */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: typeColor }}
              />
              {form.Type || "Task"}
              {isTicket && (
                <Lock className="w-3 h-3 ml-0.5 opacity-60" aria-label="Kilitli — Ticket" />
              )}
            </span>

            {/* Priority */}
            {form.Priority && (
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
            )}

            {/* Assignee avatar */}
            {form.Assignee && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                  {form.Assignee[0]?.toUpperCase()}
                </span>
                {form.Assignee}
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-slate-50/80 px-6 py-6 space-y-5">

          {/* ÖZET */}
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
              onChange={(e) => {
                setForm((f) => ({ ...f, Summary: e.target.value }));
                setErrors((prev) => ({ ...prev, Summary: "" }));
              }}
              aria-label="Görev özeti"
              aria-required="true"
              className={cn(
                "w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-2 text-xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none transition-colors",
                errors.Summary
                  ? "border-red-400"
                  : "border-slate-200 focus:border-indigo-400"
              )}
            />
            {errors.Summary && (
              <p className="text-xs text-red-500">{errors.Summary}</p>
            )}
          </div>

          {/* ÖZELLİKLER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Özellikler
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">

              {/* Durum */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Durum <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.Status}
                  onChange={(e) => setForm((f) => ({ ...f, Status: e.target.value }))}
                  aria-label="Durum"
                  className={cn(
                    "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors",
                    errors.Status ? "border-red-400" : "border-slate-200"
                  )}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {errors.Status && (
                  <p className="text-xs text-red-500">{errors.Status}</p>
                )}
              </div>

              {/* Tür */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Tür <span className="text-red-400">*</span>
                </label>
                {isTicket ? (
                  <div className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center gap-2 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-sky-400" aria-hidden />
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${TYPE_COLORS["Ticket"]}18`,
                        color: TYPE_COLORS["Ticket"],
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: TYPE_COLORS["Ticket"] }}
                      />
                      Ticket
                    </span>
                  </div>
                ) : (
                  <select
                    value={form.Type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setForm((f) => ({
                        ...f,
                        Type: newType,
                        projectId: newType === "Proje Planlama" ? f.projectId : "",
                      }));
                    }}
                    aria-label="Tür"
                    className={cn(
                      "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors",
                      errors.Type ? "border-red-400" : "border-slate-200"
                    )}
                  >
                    {TYPE_OPTIONS.filter((o) => o !== "Ticket").map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
                {errors.Type && (
                  <p className="text-xs text-red-500">{errors.Type}</p>
                )}
              </div>

              {/* Öncelik */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Öncelik <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.Priority}
                  onChange={(e) => setForm((f) => ({ ...f, Priority: e.target.value }))}
                  aria-label="Öncelik"
                  className={cn(
                    "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors",
                    errors.Priority ? "border-red-400" : "border-slate-200"
                  )}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {errors.Priority && (
                  <p className="text-xs text-red-500">{errors.Priority}</p>
                )}
              </div>

              {/* Atanan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Atanan <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.Assignee}
                  onChange={(e) => {
                    const opt = e.target.selectedOptions[0];
                    const id = opt?.getAttribute("data-id") ?? "";
                    setForm((f) => ({ ...f, Assignee: e.target.value, AssigneeId: id }));
                    setErrors((prev) => ({ ...prev, Assignee: "", AssigneeId: "" }));
                  }}
                  aria-label="Atanan kişi"
                  className={cn(
                    "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors",
                    errors.Assignee ? "border-red-400" : "border-slate-200"
                  )}
                >
                  <option value="">Kişi seçin</option>
                  {assigneeData.map((u) => {
                    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                    return (
                      <option key={u.id} value={name} data-id={u.id}>
                        {name || "Bilinmeyen"}
                      </option>
                    );
                  })}
                </select>
                {errors.Assignee && (
                  <p className="text-xs text-red-500">{errors.Assignee}</p>
                )}
              </div>

              {/* Son Tarih */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <CalendarClock className="w-3.5 h-3.5 text-indigo-400" aria-hidden />
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
                    onChange={(e) => {
                      setForm((f) => ({ ...f, dueDate: e.target.value }));
                      setErrors((prev) => ({ ...prev, dueDate: "" }));
                    }}
                    aria-label="Son tarih"
                    aria-required="true"
                    className={cn(
                      "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors",
                      errors.dueDate ? "border-red-400" : "border-slate-200"
                    )}
                  />
                )}
                {errors.dueDate && (
                  <p className="text-xs text-red-500">{errors.dueDate}</p>
                )}
              </div>

              {/* Proje — only for "Proje Planlama" */}
              {form.Type === "Proje Planlama" && (
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Folder className="w-3.5 h-3.5 text-indigo-400" aria-hidden />
                    Proje
                    {catalogLoading && (
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-400" aria-hidden />
                    )}
                  </label>
                  <div className="relative">
                    <select
                      value={form.projectId}
                      onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                      disabled={catalogLoading}
                      aria-label="Proje"
                      className={cn(
                        "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-opacity",
                        catalogLoading
                          ? "border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                          : "border-slate-200"
                      )}
                    >
                      <option value="">
                        {catalogLoading ? "Projeler yükleniyor..." : "Proje seçin (opsiyonel)"}
                      </option>
                      {!catalogLoading &&
                        catalogProjects.map((p) => (
                          <option key={p.id} value={p.id ?? ""}>
                            {getProjectLabel(p)}
                          </option>
                        ))}
                    </select>
                    {catalogLoading && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" aria-hidden />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AÇIKLAMA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Açıklama
              </p>
            </div>
            <div className="p-4">
              <textarea
                rows={8}
                placeholder="Görev detaylarını, kabul kriterlerini veya notlarını buraya girin..."
                value={form.Description}
                onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))}
                aria-label="Açıklama"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors"
              />
            </div>
          </div>

          {/* ETİKETLER */}
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
                placeholder="Frontend, Bug, Kritik (virgülle ayırın)"
                value={form.Tags}
                onChange={(e) => setForm((f) => ({ ...f, Tags: e.target.value }))}
                aria-label="Etiketler"
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors"
              />
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1.5" aria-label="Eklenen etiketler">
                  {tagList.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sticky Footer ─────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="shrink-0">
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                className="h-9 px-3 sm:px-4 text-sm gap-1.5"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Görevi </span>Sil
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 sm:px-4 text-sm"
              >
                İptal
              </Button>
            </SheetClose>
            <Button
              type="button"
              className="h-9 px-3 sm:px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 whitespace-nowrap"
              onClick={onSave}
            >
              <Save className="w-4 h-4 shrink-0" aria-hidden />
              {mode === "add" ? "Oluştur" : "Kaydet"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KanbanTaskPanel;
