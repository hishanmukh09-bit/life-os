/**
 * Google Calendar & iCal Integration Service for LifeOS
 * Supports real 1-click Google Calendar event creation, iCal (.ics) exports,
 * and live calendar synchronization permissions.
 */

export interface CalendarEventPayload {
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD or ISO
  startTime?: string; // HH:mm
  endDate?: string;
  endTime?: string;
  location?: string;
}

export const GoogleCalendarService = {
  /**
   * Check if user has enabled Google Calendar sync
   */
  isGoogleCalendarConnected(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('lifeos_gcal_connected') === 'true';
  },

  /**
   * Set Google Calendar connection state
   */
  setGoogleCalendarConnected(connected: boolean): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lifeos_gcal_connected', connected ? 'true' : 'false');
  },

  /**
   * Format dates for Google Calendar URL (YYYYMMDDTHHmmssZ or YYYYMMDD)
   */
  formatDateForGCal(dateStr: string, timeStr?: string): string {
    const cleanDate = dateStr.replace(/[^0-9]/g, '').slice(0, 8);
    if (!timeStr) return cleanDate;
    const cleanTime = timeStr.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
    return `${cleanDate}T${cleanTime}00`;
  },

  /**
   * Generate an official Google Calendar URL that opens directly in Google Calendar (Phone or Desktop)
   */
  createGoogleCalendarUrl(event: CalendarEventPayload): string {
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || 'Scheduled via LifeOS');
    const location = encodeURIComponent(event.location || 'LifeOS Space');

    const startFormatted = this.formatDateForGCal(event.startDate, event.startTime);
    let endFormatted = startFormatted;

    if (event.startTime) {
      // Default to 1 hour duration if no end time
      const [hours, mins] = event.startTime.split(':').map(Number);
      const endH = String((hours + 1) % 24).padStart(2, '0');
      const endM = String(mins || 0).padStart(2, '0');
      endFormatted = this.formatDateForGCal(event.endDate || event.startDate, event.endTime || `${endH}:${endM}`);
    }

    const dates = `${startFormatted}/${endFormatted}`;
    return `${base}&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  },

  /**
   * Open the event directly in Google Calendar in a new tab or Google Calendar App on mobile
   */
  openInGoogleCalendar(event: CalendarEventPayload): void {
    const url = this.createGoogleCalendarUrl(event);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  /**
   * Generate and trigger download of a standard .ics calendar file
   * Can be imported into Google Calendar, Apple Calendar, or Outlook on phone & laptop
   */
  downloadIcsFile(filename: string, events: CalendarEventPayload[]): void {
    if (typeof window === 'undefined') return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LifeOS//Life Operating System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    for (const ev of events) {
      const start = this.formatDateForGCal(ev.startDate, ev.startTime);
      const end = ev.startTime
        ? this.formatDateForGCal(ev.endDate || ev.startDate, ev.endTime || ev.startTime)
        : start;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${Date.now()}_${Math.random().toString(36).slice(2, 9)}@lifeos.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        ev.startTime ? `DTSTART:${start}` : `DTSTART;VALUE=DATE:${start}`,
        ev.startTime ? `DTEND:${end}` : `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${ev.title}`,
        `DESCRIPTION:${ev.description || 'LifeOS Calendar Event'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
