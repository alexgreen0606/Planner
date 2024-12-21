import { ListItem } from "../../foundation/sortedLists/types";

export interface Event extends ListItem {
    startTime?: string;
    apple_id?: string;
};

export interface TimeDialog {
    syncCalendar: boolean;
    allDay: boolean;
    startTime: string;
    endTime: string;
};

type AppleCalendarEvent = {
    id: string; // Unique identifier for the event
    calendarId: string; // ID of the calendar containing the event
    title: string; // Event title
    startDate: string; // Start date in ISO 8601 format
    endDate: string; // End date in ISO 8601 format
    location?: string; // Optional: Event location
    allDay?: boolean; // Optional: Indicates if the event is an all-day event
    notes?: string; // Optional: Notes or description for the event
    attendees?: {
      name?: string; // Attendee's name
      email?: string; // Attendee's email
      status?: string; // e.g., "accepted", "declined", "tentative"
    }[]; // Optional: Array of attendees
  };
  