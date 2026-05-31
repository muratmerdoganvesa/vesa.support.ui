// @fullcalendar components
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Custom CalendarRoot (FullCalendar CSS overrides)
import CalendarRoot from "examples/Calendar/CalendarRoot";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  header?: {
    title?: string;
    date?: string;
  };
  [key: string]: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

function Calendar({ header, ...rest }: Props): JSX.Element {
  const validClassNames = [
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ];

  const events = rest.events
    ? rest.events.map((el: any) => ({
        ...el,
        className: validClassNames.find((item) => item === el.className)
          ? `event-${el.className}`
          : "event-info",
      }))
    : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-hidden flex flex-col [&_.fc-toolbar]:rounded-none">
      {(header?.title || header?.date) && (
        <div className="px-5 pt-4 pb-1 shrink-0">
          {header?.title && (
            <h6 className="text-sm font-semibold text-slate-800 capitalize leading-tight">
              {header.title}
            </h6>
          )}
          {header?.date && (
            <p className="text-xs text-slate-500 mt-0.5">{header.date}</p>
          )}
        </div>
      )}

      <CalendarRoot ownerState={{ darkMode: false }} className="flex-1 min-h-0">
        <FullCalendar
          {...rest}
          locale="tr"
          displayEventTime={true}
          displayEventEnd={true}
          fixedWeekCount={false}
          firstDay={1}
          weekNumbers={true}
          weekNumberCalculation="ISO"
          progressiveEventRendering={true}
          weekText="Hafta "
          lazyFetching={true}
          views={{
            dayGridMonth: {
              titleFormat: { year: "numeric", month: "long" },
              displayEventEnd: false,
            },
            timeGridWeek: {
              titleFormat: { year: "numeric", month: "short", day: "2-digit" },
              displayEventEnd: false,
              slotLabelFormat: {
                hour: "2-digit",
                minute: "2-digit",
              },
            },
          }}
          nextDayThreshold="00:00:00"
          handleWindowResize={true}
          windowResizeDelay={100}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          events={events}
          height="100%"
        />
      </CalendarRoot>
    </div>
  );
}

// Declaring default props for Calendar
Calendar.defaultProps = {
  header: {
    title: "",
    date: "",
  },
};

export default Calendar;
