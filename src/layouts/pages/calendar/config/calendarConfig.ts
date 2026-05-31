/**
 * FullCalendar Configuration
 * 
 * This file contains the configuration options for the FullCalendar component.
 * For more options, see: https://fullcalendar.io/docs
 */

export const calendarOptions = {
    // Interaction Options
    selectable: true,
    selectMirror: true,
    unselectAuto: true,
    eventStartEditable: true,
    eventDurationEditable: true,
   

    // Display Options
    displayEventTime: true,
    displayEventEnd: true,
    dayMaxEventRows: true,
    showNonCurrentDates: true,
    fixedWeekCount: false,

    // Formatting
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false
    },

    // Week options
    firstDay: 1, // Monday
    weekNumbers: true,
    weekNumberCalculation: 'ISO',

    // Localization
    locale: 'tr',
    lang: 'tr',

    // Mobile responsiveness
    themeSystem: 'standard',
    handleWindowResize: true,
    windowResizeDelay: 100,

    // Additional features
    progressiveEventRendering: true,

    // Accessibility
    weekText: 'W',
    nextDayThreshold: '00:00:00',

    // Advanced options
    lazyFetching: true,

    // View-specific options
    views: {
        dayGridMonth: {
            titleFormat: { year: 'numeric', month: 'long' },
            displayEventEnd: false,
        },
        timeGridWeek: {
            titleFormat: { year: 'numeric', month: 'short', day: '2-digit' },
            displayEventEnd: false,
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit'
            }
        },
        timeGridDay: {
            titleFormat: { year: 'numeric', month: 'long', day: '2-digit' },
            displayEventEnd: true,
            dayHeaderFormat: { weekday: 'long' }
        },
        listWeek: {
            titleFormat: { year: 'numeric', month: 'long' },
            displayEventTime: true,
            displayEventEnd: true,
        }
    }
}; 