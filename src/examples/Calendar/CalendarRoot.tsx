import React from "react";
import { cn } from "lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarRootProps {
  children: React.ReactNode;
  ownerState?: { darkMode?: boolean };
  className?: string;
  /** MUI Box spacing props accepted but ignored (replaced by Tailwind) */
  p?: any;
  px?: any;
  py?: any;
  pt?: any;
  pb?: any;
  [key: string]: any;
}

// ─── FullCalendar CSS overrides ────────────────────────────────────────────────
// Replaces the MUI `styled(Box)` approach with hardcoded equivalent values.

const buildStyles = (darkMode: boolean) => `
  .fc-calendar-root {
    height: 100%;
    padding: 0;
  }

  .fc-calendar-root .fc-media-screen {
    height: 100%;
    color: ${darkMode ? "#ffffff" : "#1e293b"};
  }

  /* ── Toolbar ── */

  .fc-calendar-root .fc-toolbar {
    padding: 0.875rem 1.25rem !important;
    margin-bottom: 0 !important;
    background-color: ${darkMode ? "#1e293b" : "#f8fafc"};
    border-bottom: 1px solid #e2e8f0;
    gap: 0.5rem;
  }

  .fc-calendar-root .fc-toolbar-title {
    font-size: 1.0625rem !important;
    font-weight: 700 !important;
    letter-spacing: -0.01em;
    color: ${darkMode ? "#f1f5f9" : "#0f172a"};
  }

  /* ── Toolbar buttons: prev / next ── */

  .fc-calendar-root .fc-prev-button,
  .fc-calendar-root .fc-next-button {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    color: #475569 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
    border-radius: 0.5rem !important;
    width: 2rem !important;
    height: 2rem !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 150ms ease !important;
    opacity: 1 !important;
  }

  .fc-calendar-root .fc-prev-button:hover,
  .fc-calendar-root .fc-next-button:hover {
    background-color: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #1e293b !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08) !important;
  }

  .fc-calendar-root .fc-prev-button:focus,
  .fc-calendar-root .fc-next-button:focus,
  .fc-calendar-root .fc-prev-button:active,
  .fc-calendar-root .fc-next-button:active {
    background-color: #e0e7ff !important;
    border-color: #a5b4fc !important;
    color: #4f46e5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
    outline: none !important;
  }

  .fc-calendar-root .fc-prev-button .fc-icon,
  .fc-calendar-root .fc-next-button .fc-icon {
    font-size: 0.8rem !important;
    color: inherit !important;
  }

  /* ── Toolbar button: today ── */

  .fc-calendar-root .fc-today-button {
    background-color: #4f46e5 !important;
    border-color: #4f46e5 !important;
    color: #ffffff !important;
    font-size: 0.8125rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.01em;
    border-radius: 0.5rem !important;
    padding: 0.3125rem 0.875rem !important;
    height: 2rem !important;
    box-shadow: 0 1px 3px rgba(79, 70, 229, 0.4), 0 1px 2px rgba(79, 70, 229, 0.24) !important;
    transition: all 150ms ease !important;
    opacity: 1 !important;
  }

  .fc-calendar-root .fc-today-button:hover {
    background-color: #4338ca !important;
    border-color: #4338ca !important;
    box-shadow: 0 4px 8px rgba(79, 70, 229, 0.35), 0 1px 3px rgba(79, 70, 229, 0.2) !important;
  }

  .fc-calendar-root .fc-today-button:disabled {
    background-color: #4f46e5 !important;
    border-color: #4f46e5 !important;
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }

  .fc-calendar-root .fc-today-button:focus,
  .fc-calendar-root .fc-today-button:active {
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3) !important;
    outline: none !important;
  }

  /* Button group: remove gap between grouped buttons */
  .fc-calendar-root .fc-button-group {
    gap: 0.25rem !important;
  }

  /* ── Column headers (day names) ── */

  .fc-calendar-root .fc-theme-standard thead tr th {
    border-left: none;
    border-right: none;
    background-color: ${darkMode ? "#0f172a" : "#f8fafc"};
  }

  .fc-calendar-root .fc .fc-col-header-cell-cushion {
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${darkMode ? "#94a3b8" : "#94a3b8"};
    padding: 0.625rem 0 !important;
    text-decoration: none !important;
  }

  /* ── Week number ── */

  .fc-calendar-root .fc-daygrid-week-number {
    font-size: 0.65rem !important;
    font-weight: 600 !important;
    color: #a5b4fc !important;
    background: transparent !important;
    padding: 0.25rem 0.375rem !important;
    text-decoration: none !important;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .fc-calendar-root .fc-daygrid-week-number:hover {
    color: #4f46e5 !important;
  }

  /* ── Day number ── */

  .fc-calendar-root .fc .fc-daygrid-day-number {
    color: ${darkMode ? "#cbd5e1" : "#64748b"};
    font-size: 0.8125rem;
    font-weight: 400;
    width: 100%;
    text-align: center;
    text-decoration: none !important;
    padding: 0.3rem 0.5rem !important;
  }

  /* Today highlight */
  .fc-calendar-root .fc .fc-day-today {
    background-color: ${darkMode ? "rgba(79,70,229,0.12)" : "rgba(238, 242, 255, 0.7)"} !important;
  }

  .fc-calendar-root .fc .fc-day-today .fc-daygrid-day-number {
    color: #4f46e5 !important;
    font-weight: 700 !important;
  }

  /* ── Scrollgrid ── */

  .fc-calendar-root .fc-theme-standard .fc-scrollgrid {
    border: none;
  }

  .fc-calendar-root .fc-theme-standard td,
  .fc-calendar-root .fc-theme-standard th {
    border-color: #e2e8f0;
  }

  .fc-calendar-root .fc th {
    text-align: center;
  }

  .fc-calendar-root .fc-scrollgrid-section.fc-scrollgrid-section-header > td {
    border: none;
  }

  .fc-calendar-root
    .fc-scrollgrid-section.fc-scrollgrid-section-body.fc-scrollgrid-section-liquid
    > td {
    border: none;
  }

  .fc-calendar-root .fc-scrollgrid-sync-table {
    height: auto !important;
  }

  .fc-calendar-root .fc .fc-view-harness-active > .fc-view {
    position: static;
    height: 100%;
  }

  .fc-calendar-root .fc .fc-scroller-liquid-absolute {
    position: static;
  }

  /* ── Events ── */

  .fc-calendar-root .fc-daygrid-event {
    margin: 0.03rem 0.125rem;
    border: none;
    border-radius: 0.35rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .fc-calendar-root .fc .fc-daygrid-body-unbalanced .fc-daygrid-day-events {
    min-height: 2rem;
  }

  .fc-calendar-root .fc-event-title {
    font-size: 0.75rem !important;
    font-weight: 400 !important;
    padding: 0.125rem 0.3rem 0.09rem !important;
  }

  /* ── Event color classes ── */

  .fc-calendar-root .event-primary {
    background-image: linear-gradient(195deg, #ec407a, #d81b60);
  }
  .fc-calendar-root .event-primary * { color: #ffffff; }

  .fc-calendar-root .event-secondary {
    background-image: linear-gradient(195deg, #747b8a, #495361);
  }
  .fc-calendar-root .event-secondary * { color: #ffffff; }

  .fc-calendar-root .event-info {
    background-image: linear-gradient(195deg, #49a3f1, #1a73e8);
  }
  .fc-calendar-root .event-info * { color: #ffffff; }

  .fc-calendar-root .event-success {
    background-image: linear-gradient(195deg, #66bb6a, #43a047);
  }
  .fc-calendar-root .event-success * { color: #ffffff; }

  .fc-calendar-root .event-warning {
    background-image: linear-gradient(195deg, #ffa726, #fb8c00);
  }
  .fc-calendar-root .event-warning * { color: #ffffff; }

  .fc-calendar-root .event-error {
    background-image: linear-gradient(195deg, #ef5350, #e53935);
  }
  .fc-calendar-root .event-error * { color: #ffffff; }

  .fc-calendar-root .event-light {
    background-image: linear-gradient(195deg, #ced4da, #ebeff4);
  }
  .fc-calendar-root .event-light * { color: #344767; }

  .fc-calendar-root .event-dark {
    background-image: linear-gradient(195deg, #42424a, #191919);
  }
  .fc-calendar-root .event-dark * { color: #ffffff; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarRoot({
  children,
  ownerState,
  className,
  // Strip MUI Box spacing props so they don't land on the DOM element
  p, px, py, pt, pb,
  ...rest
}: CalendarRootProps) {
  const darkMode = ownerState?.darkMode ?? false;

  return (
    <div className={cn("fc-calendar-root h-full", className)} {...rest}>
      <style>{buildStyles(darkMode)}</style>
      {children}
    </div>
  );
}
