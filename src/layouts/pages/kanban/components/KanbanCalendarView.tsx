import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import trLocale from "@fullcalendar/core/locales/tr";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { cn } from "lib/utils";
import { KanbanTasksListDtoFixed } from "../utils/fetchKanbanData";
import { isOverdue } from "../utils/dueDateHelpers";
import CalendarRoot from "examples/Calendar/CalendarRoot";

interface KanbanCalendarViewProps {
  tasks: KanbanTasksListDtoFixed[];
  onTaskClick: (task: KanbanTasksListDtoFixed) => void;
}

type CalView = "dayGridMonth" | "dayGridWeek";

// Doğrudan hex renk değerleri — CSS class sistemine bağımlılık yok
const PRIORITY_COLORS: Record<string, { bg: string; border: string }> = {
  Critical:          { bg: "#e53935", border: "#c62828" },
  "Release Breaker": { bg: "#e53935", border: "#c62828" },
  High:              { bg: "#f9c900", border: "#d4ab00" },
  Normal:            { bg: "#1a73e8", border: "#1558b0" },
  Low:               { bg: "#43a047", border: "#2d7031" },
};

const OVERDUE_COLOR = { bg: "#e53935", border: "#c62828" };
const DEFAULT_COLOR = { bg: "#1a73e8", border: "#1558b0" };

const LEGEND_ITEMS = [
  { color: "#e53935", label: "Gecikmiş / Kritik" },
  { color: "#f9c900", label: "Yüksek Öncelik" },
  { color: "#1a73e8", label: "Normal" },
  { color: "#43a047", label: "Düşük Öncelik" },
] as const;

const KanbanCalendarView: React.FC<KanbanCalendarViewProps> = ({ tasks, onTaskClick }) => {
  const calRef = useRef<FullCalendar>(null);
  const [calView, setCalView] = useState<CalView>("dayGridMonth");
  const [title, setTitle] = useState("");

  const events = useMemo(() => {
    return tasks
      .filter((t) => !!t.dueDate)
      .map((t) => {
        const overdue = isOverdue(t);
        const color   = overdue ? OVERDUE_COLOR : (PRIORITY_COLORS[t.Priority] ?? DEFAULT_COLOR);
        return {
          id:              t.Id,
          title:           t.Summary,
          start:           t.dueDate!,
          allDay:          true,
          backgroundColor: color.bg,
          borderColor:     color.border,
          textColor:       color.bg === "#f9c900" ? "#5a4500" : "#ffffff",
          extendedProps:   { task: t },
        };
      });
  }, [tasks]);

  const handleEventClick = (info: EventClickArg) => {
    const task = info.event.extendedProps.task as KanbanTasksListDtoFixed;
    onTaskClick(task);
  };

  const handleDatesSet = (info: DatesSetArg) => {
    setTitle(info.view.title);
  };

  const handlePrev  = () => calRef.current?.getApi().prev();
  const handleNext  = () => calRef.current?.getApi().next();
  const handleToday = () => calRef.current?.getApi().today();

  const handleViewChange = (view: CalView) => {
    setCalView(view);
    calRef.current?.getApi().changeView(view);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Bugün
        </button>

        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Önceki"
            className="p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Sonraki"
            className="p-1.5 text-slate-500 hover:bg-slate-100 transition-colors border-l border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-sm font-semibold text-slate-700 capitalize min-w-[160px]">{title}</span>

        <div className="ml-auto flex items-center border border-slate-200 rounded-lg overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => handleViewChange("dayGridMonth")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors",
              calView === "dayGridMonth" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Aylık
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("dayGridWeek")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors border-l border-slate-200",
              calView === "dayGridWeek" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Haftalık
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
        {LEGEND_ITEMS.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-auto text-slate-400">Son tarihi olmayan görevler takvimde görünmez.</span>
      </div>

      {/* ── Calendar ── */}
      <CalendarRoot>
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView={calView}
          locale={trLocale}
          headerToolbar={false}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          editable={false}
          selectable={false}
          eventDisplay="block"
          dayMaxEvents={3}
          height="100%"
        />
      </CalendarRoot>
    </div>
  );
};

export default KanbanCalendarView;
