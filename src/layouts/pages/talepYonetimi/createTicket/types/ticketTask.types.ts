// Client-side only — yeni ticket oluşturma sırasında UI state için kullanılır.
// Backend DTO'ları (TicketTaskInsertDto, TicketTaskListDto, TicketTaskUpdateDto)
// doğrudan "api/generated" üzerinden import edilir.

export interface TicketTaskInput {
  clientId: string;    // crypto.randomUUID() — dnd-kit key ve arrayMove için
  title: string;
  description?: string;
  order: number;
  /** Seçilen görev atananı; null ise Kanban kartı oluşturulmaz (ticket userAppId kullanılmaz) */
  assigneeId: string | null;
  /** Seçicide göstermek için (opsiyonel, arama sonucundan doldurulur) */
  assigneeLabel?: string;
  /** ISO-8601 tarih string — Kanban kartı üzerindeki son tarihe iletilir */
  dueDate?: string | null;
}

export const TASK_STATUS_CONFIG = {
  todo:        { label: "Yapılacak",    className: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "Devam Ediyor", className: "bg-amber-50  text-amber-700  border-amber-200" },
  done:        { label: "Tamamlandı",   className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
} as const;

export type TaskStatus = keyof typeof TASK_STATUS_CONFIG;
