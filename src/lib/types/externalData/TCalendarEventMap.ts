import { Event as CalendarEvent } from 'expo-calendar';

// Maps datestamps to calendar events.
export type TCalendarEventMap = Record<string, CalendarEvent[]>;
