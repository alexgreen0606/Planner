import { ListItem } from "../../foundation/sortedLists/types";

export interface Event extends ListItem {
  plannerId: string;
  timeConfig?: TimeConfig;
  recurringConfig?: RecurringConfig;
};

export interface RecurringConfig {
  recurringId?: string; // both can never be true
}

export interface TimeConfig {
  appleId?: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  isAppleEvent: boolean;
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
