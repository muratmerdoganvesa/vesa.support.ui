import React, { useState } from "react";
import { AlertTriangle, CalendarClock, Folder, Mail, Ticket } from "lucide-react";
import { cn } from "lib/utils";
import { getDueDateStatus, formatDueDate, DueDateStatus } from "../utils/dueDateHelpers";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/ui/tooltip";
import { Button } from "components/ui/button";
import { Dialog, DialogTitle, DialogHeader, DialogContent, DialogDescription, DialogFooter } from "components/ui/dialog";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { KanbanApi } from "api/generated";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";

// KanbanCard receives the full data object from Syncfusion (field names are PascalCase)
interface KanbanCardData {
  Id?: string;
  Summary?: string;
  Description?: string;
  Type?: string;
  Priority?: string;
  Tags?: string;
  Assignee?: string;
  AssigneeId?: string;
  Status?: string;
  RankId?: string | number;
  creatorId?: string;
  projectName?: string | null;
  dueDate?: string | null;
  CanSendMail?: boolean;
}

interface KanbanCardProps {
  data: KanbanCardData;
}

// ─── Priority left border accent ─────────────────────────────────────────────

const PRIORITY_BORDER: Record<string, string> = {
  Low:               "border-l-green-400",
  Normal:            "border-l-blue-400",
  High:              "border-l-amber-400",
  Critical:          "border-l-red-500",
  "Release Breaker": "border-l-rose-600",
};

const DUE_DATE_STYLES: Record<DueDateStatus, { badge: string; icon?: boolean }> = {
  none:     { badge: "" },
  ok:       { badge: "text-slate-400" },
  dueSoon:  { badge: "text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5" },
  dueToday: { badge: "text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-1.5 py-0.5", icon: true },
  overdue:  { badge: "text-red-600 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5", icon: true },
};

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { badge: string; dot: string }> = {
  Low:             { badge: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500"  },
  Normal:          { badge: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500"   },
  High:            { badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500"  },
  Critical:        { badge: "bg-red-50 text-red-700 border-red-200",        dot: "bg-red-500"    },
  "Release Breaker": { badge: "bg-rose-50 text-rose-700 border-rose-200",  dot: "bg-rose-600"   },
};

const DEFAULT_PRIORITY = { badge: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" };

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Task:             { label: "Görev",   color: "text-indigo-500" },
  "Proje Planlama": { label: "Proje",   color: "text-violet-500" },
  Destek:           { label: "Destek",  color: "text-sky-500"    },
  CR:               { label: "CR",      color: "text-indigo-500" },
  Bug:              { label: "Bug",     color: "text-red-500"    },
  Günlük:           { label: "Günlük",  color: "text-emerald-500"},
  Ticket:           { label: "Ticket",  color: "text-sky-500"    },
};

// ─── Avatar initials ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

const avatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────

const KanbanCard: React.FC<KanbanCardProps> = ({ data }) => {
  const priority      = PRIORITY_CONFIG[data.Priority ?? ""] ?? DEFAULT_PRIORITY;
  const type          = TYPE_CONFIG[data.Type ?? ""];
  const dueDateStatus = getDueDateStatus({ dueDate: data.dueDate, Status: data.Status });
  const dueDateStyle  = DUE_DATE_STYLES[dueDateStatus];
  const [showMailDialog, setShowMailDialog] = useState(false);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const tags = (data.Tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const assigneeName = data.Assignee ?? "";
  const initials = assigneeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const isCardOverdue = dueDateStatus === "overdue";

  const handleMailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowMailDialog(true);
  };

  const handleMailSend = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new KanbanApi(getConfiguration());
      await api.apiKanbanSendTaskReminderMailTaskIdPost(data.Id);
      dispatchAlert({ message: "Hatırlatma maili başarıyla gönderildi", type: "Success" });
      dispatchBusy({ isBusy: false });
    } catch (error) {
      console.error("Error sending mail:", error);
      dispatchBusy({ isBusy: false });
      dispatchAlert({ message: "Hatırlatma maili gönderimi sırasında bir hata oluştu", type: "Error" });
    }
    setShowMailDialog(false);
  };

  return (
    <div className={cn(
      "group p-3.5 bg-white border-l-[3px]",
      isCardOverdue ? "border-l-red-500 bg-red-50/30" : (PRIORITY_BORDER[data.Priority ?? ""] ?? "border-l-slate-200"),
    )}>

      {/* ── Header row: summary + priority badge ── */}
      <div className="flex items-start justify-between gap-2 mb-2">
        
        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 flex-1">
          {data.Summary}
        </p>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap",
            priority.badge
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priority.dot)} />
          {data.Priority}
        </span>

        {data.CanSendMail && (
          <Tooltip>
            <TooltipTrigger asChild>
          <Button onClick={(e) => handleMailClick(e)} variant="ghost"  className="inline-flex p-0 h-4 w-4 items-center justify-center hover:bg-sky-50 hover:text-sky-600 hover:cursor-pointer">
              <Mail className="size-3.5 text-sky-600 shrink-0" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Mail göndermek için tıklayınız.
          </TooltipContent>
        </Tooltip>
        )}
      </div>

      {/* ── Description ── */}
      {data.Description && (
        <p className="text-[12px] text-slate-500 leading-relaxed mb-2.5 line-clamp-2">
          {data.Description}
        </p>
      )}

      {/* ── Tags ── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Project name ── */}
      {data.projectName && (
        <div className="flex items-center gap-1 mb-2.5">
          <Folder className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium truncate">
            {data.projectName}
          </span>
        </div>
      )}

      {/* ── Due date row ── */}
      {data.dueDate && (
        <div className="mb-2">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold", dueDateStyle.badge)}>
            {dueDateStyle.icon
              ? <AlertTriangle className="w-2.5 h-2.5 shrink-0" aria-hidden />
              : <CalendarClock className="w-2.5 h-2.5 shrink-0" aria-hidden />
            }
            {dueDateStatus === "overdue"  && "Gecikmiş · "}
            {dueDateStatus === "dueToday" && "Bugün · "}
            {formatDueDate(data.dueDate)}
          </span>
        </div>
      )}

      {/* ── Footer: assignee + type ── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">

        {/* Assignee */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={cn(
              "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ring-1 ring-white",
              avatarColor(assigneeName)
            )}
          >
            {initials || "?"}
          </div>
          <span className="text-[11px] text-slate-500 font-medium truncate">
            {assigneeName || "—"}
          </span>
        </div>

        {/* Type */}
        {type && (
          data.Type === "Ticket" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md  text-sky-600">
              <Ticket className="w-2.5 h-2.5 shrink-0" aria-hidden />
              Ticket
            </span>
          ) : (
            <span className={cn("text-[10px] font-semibold", type.color)}>
              {type.label}
            </span>
          )
        )}
      </div>
      <Dialog open={showMailDialog} onOpenChange={setShowMailDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}
    onPointerDown={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
    onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Hatırlatma Maili Gönder</DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-2">
            <span className="text-xs text-slate-500 block">
              Tamam butonuna basıldığında ilgili göreve ait atanan kişiye bir hatırlatma maili gönderilecektir.
            </span>
          </DialogDescription>
          <DialogFooter>
            <Button className="hover:cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowMailDialog(false); }} variant="outline">İptal</Button>
            <Button className="hover:cursor-pointer" onClick={(e) => { e.stopPropagation(); void handleMailSend(); }} variant="default">Gönder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanCard;
