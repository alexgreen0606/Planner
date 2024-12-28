import { ListItem } from "../../foundation/sortedLists/types";

export interface Event extends ListItem {
  plannerId: string;
  timeConfig?: TimeConfig;
  recurringConfig?: RecurringConfig;
};

export interface RecurringConfig {
  recurringId?: string; // links this event to one within the recurring weekday planner
  deleted?: boolean;
}

export interface TimeConfig {
  calendarEventId?: string; // links this event to one within the device calendar
  allDay: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isCalendarEvent: boolean;
};
