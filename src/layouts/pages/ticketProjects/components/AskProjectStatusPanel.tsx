import { useMemo, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { cn } from "lib/utils";
import type { StatsBoardItem, TicketProjectStatsPersonDto } from "layouts/pages/ticketProjects/types";
import { askProjectStatus } from "layouts/pages/ticketProjects/api/askProjectStatusApi";
import { getProjectStatusLabel } from "layouts/pages/ticketProjects/projectTypeHelpers";
import { Button } from "components/ui/button";
import { Textarea } from "components/ui/textarea";
import {
  Select as ShadcnSelect,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue as ShadcnSelectValue,
  SelectContent as ShadcnSelectContent,
  SelectItem as ShadcnSelectItem,
} from "components/ui/select";

type AskProjectStatusPanelProps = {
  item: StatsBoardItem;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

type MessageTemplate = {
  id: string;
  label: string;
  build: (ctx: TemplateContext) => string;
};

type TemplateContext = {
  customer: string;
  project: string;
  subject: string;
  step: string | null;
  boardStatus: string;
};

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "status",
    label: "Durum nedir?",
    build: ({ subject, boardStatus }) =>
      `${subject} için güncel durumu paylaşabilir misiniz? (Board: ${boardStatus})`,
  },
  {
    id: "update",
    label: "Durumu güncelleyelim",
    build: ({ subject, boardStatus }) =>
      `${subject} için proje durumunu güncelleyelim. Şu an board'da "${boardStatus}" görünüyor; güncel durumu ve gerekirse yeni aşamayı yazar mısınız?`,
  },
  {
    id: "close",
    label: "Projeyi kapatalım",
    build: ({ subject }) =>
      `${subject} için kapanışa geçebilir miyiz? Eksik kalan iş / onay varsa kısaca belirtir misiniz?`,
  },
  {
    id: "blocker",
    label: "Engel var mı?",
    build: ({ subject }) =>
      `${subject} tarafında ilerlemeyi engelleyen bir konu var mı? Varsa kısaca yazar mısınız?`,
  },
  {
    id: "uat",
    label: "UAT'ye geçelim",
    build: ({ subject }) =>
      `${subject} için UAT'ye geçiş uygun mu? Hazırlık / eksik kalan noktaları paylaşır mısınız?`,
  },
];

const collectRecipients = (item: StatsBoardItem): TicketProjectStatsPersonDto[] => {
  const map = new Map<string, TicketProjectStatsPersonDto>();
  if (item.projectManager?.id) {
    map.set(item.projectManager.id, item.projectManager);
  }
  for (const employee of item.employees) {
    if (employee.id) map.set(employee.id, employee);
  }
  return Array.from(map.values());
};

const buildTemplateContext = (item: StatsBoardItem): TemplateContext => {
  const customer = item.customerName?.trim() || "müşteri";
  const project = item.projectDescription?.trim() || "proje";
  const step = item.kalemName?.trim() || null;
  const boardStatus =
    item.kind === "project"
      ? "Seçilmedi"
      : item.projectStatus == null
        ? "Seçilmedi"
        : getProjectStatusLabel(item.projectStatus);

  const subject = step ? `${customer} / ${step}` : `${customer} / ${project}`;

  return { customer, project, subject, step, boardStatus };
};

const AskProjectStatusPanel = ({ item, onSuccess, onError }: AskProjectStatusPanelProps) => {
  const recipients = useMemo(() => collectRecipients(item), [item]);
  const templateCtx = useMemo(() => buildTemplateContext(item), [item]);
  const defaultTemplate = MESSAGE_TEMPLATES[0];
  const defaultTargetId = item.projectManager?.id || recipients[0]?.id || "";

  const [targetUserId, setTargetUserId] = useState(defaultTargetId);
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate.id);
  const [message, setMessage] = useState(() => defaultTemplate.build(templateCtx));
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (recipients.length === 0) {
    return null;
  }

  const applyTemplate = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId) ?? defaultTemplate;
    setSelectedTemplateId(template.id);
    setMessage(template.build(templateCtx));
  };

  const handleSend = async () => {
    if (!targetUserId) {
      onError("Durumu sorulacak kişiyi seçin.");
      return;
    }

    try {
      setIsSending(true);
      const resultMessage = await askProjectStatus({
        targetUserId,
        message: message.trim() || null,
        projectId: item.kind === "simulated" ? null : item.projectId,
        taskId: item.taskId ?? null,
        planId: item.kind === "simulated" ? item.id : null,
        customerName: item.customerName,
        projectDescription: item.projectDescription,
        projectSubDescription: item.projectSubDescription,
        kalemName: item.kalemName,
        statusLabel: templateCtx.boardStatus,
      });
      onSuccess(resultMessage);
      setIsOpen(false);
    } catch {
      onError("Durum sorusu gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="h-7 gap-1 text-[11px]"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
          applyTemplate(selectedTemplateId);
        }}
      >
        <MessageSquare className="size-3" aria-hidden />
        Durum sor
      </Button>
    );
  }

  return (
    <div
      className="w-full space-y-2 rounded-md border border-indigo-100 bg-indigo-50/40 p-2 dark:border-indigo-900/50 dark:bg-indigo-950/20"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          Durum sor
        </span>
        <button
          type="button"
          className="text-[10px] font-medium text-slate-500 hover:text-slate-700"
          onClick={() => setIsOpen(false)}
        >
          Kapat
        </button>
      </div>

      <ShadcnSelect value={targetUserId} onValueChange={setTargetUserId}>
        <ShadcnSelectTrigger className="h-8 w-full bg-white text-[11px] dark:bg-card">
          <ShadcnSelectValue placeholder="Kişi seç" />
        </ShadcnSelectTrigger>
        <ShadcnSelectContent>
          {recipients.map((person) => (
            <ShadcnSelectItem key={person.id} value={person.id} className="text-[11px]">
              {person.fullName}
              {item.projectManager?.id === person.id ? " (PY)" : ""}
            </ShadcnSelectItem>
          ))}
        </ShadcnSelectContent>
      </ShadcnSelect>

      <div className="flex flex-wrap gap-1">
        {MESSAGE_TEMPLATES.map((template) => {
          const isActive = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                isActive
                  ? "border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-border dark:bg-card dark:text-muted-foreground",
              )}
            >
              {template.label}
            </button>
          );
        })}
      </div>

      <Textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setSelectedTemplateId("");
        }}
        rows={3}
        className="min-h-[64px] resize-none bg-white text-[11px] dark:bg-card"
        placeholder="Mesajınız..."
      />

      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="h-7 text-[11px]"
          disabled={isSending}
          onClick={() => setIsOpen(false)}
        >
          İptal
        </Button>
        <Button
          type="button"
          size="xs"
          className={cn("h-7 gap-1 text-[11px]")}
          disabled={isSending || !targetUserId}
          onClick={() => void handleSend()}
        >
          {isSending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : (
            <Send className="size-3" aria-hidden />
          )}
          Gönder
        </Button>
      </div>
    </div>
  );
};

export default AskProjectStatusPanel;
