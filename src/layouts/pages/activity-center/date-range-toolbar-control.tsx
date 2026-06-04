import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";

export type DateRangeValue = { from: Date; to: Date };

export const getCurrentMonthRange = (): DateRangeValue => {
  const now = new Date();
  return { from: startOfMonth(now), to: endOfMonth(now) };
};

type CalendarRangeDraft = { from?: Date; to?: Date };

const normalizeOrderedRange = (a: Date, b: Date): DateRangeValue => {
  const d1 = startOfDay(a).getTime();
  const d2 = startOfDay(b).getTime();
  if (d1 <= d2) {
    return { from: startOfDay(a), to: startOfDay(b) };
  }
  return { from: startOfDay(b), to: startOfDay(a) };
};

type DateRangeToolbarControlProps = {
  from: Date;
  to: Date;
  onRangeChange: (next: DateRangeValue) => void;
};

const DateRangeToolbarControl = ({
  from,
  to,
  onRangeChange,
}: DateRangeToolbarControlProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CalendarRangeDraft | undefined>({ from, to });

  useEffect(() => {
    if (open) {
      setDraft({ from, to });
    }
  }, [open, from, to]);

  const label = useMemo(
    () =>
      `${format(from, "dd.MM.yyyy", { locale: tr })} - ${format(to, "dd.MM.yyyy", { locale: tr })}`,
    [from, to]
  );

  const handlePrevMonth = () => {
    const ref = startOfMonth(from);
    const target = subMonths(ref, 1);
    onRangeChange({
      from: startOfMonth(target),
      to: endOfMonth(target),
    });
  };

  const handleNextMonth = () => {
    const ref = startOfMonth(from);
    const target = addMonths(ref, 1);
    onRangeChange({
      from: startOfMonth(target),
      to: endOfMonth(target),
    });
  };

  const handleCalendarSelect = (range: CalendarRangeDraft | undefined) => {
    setDraft(range);
    if (range?.from && range?.to) {
      onRangeChange(normalizeOrderedRange(range.from, range.to));
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 shrink-0">Tarih Aralığı:</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={handlePrevMonth}
          aria-label="Bir önceki ay"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-8 min-w-[220px] max-w-[min(100vw-12rem,320px)] px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 justify-between font-normal"
              aria-label="Tarih aralığı seçmek için takvimi aç"
              aria-expanded={open}
            >
              <span className="truncate text-sm">{label}</span>
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              locale={tr}
              defaultMonth={from}
              selected={draft as { from: Date; to?: Date } | undefined}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={handleNextMonth}
          aria-label="Bir sonraki ay"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
};

export default DateRangeToolbarControl;
