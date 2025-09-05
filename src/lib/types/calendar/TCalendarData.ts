import { Event as CalendarEvent } from 'expo-calendar';
import { TPlannerChip } from "./TPlannerChip";

// ✅ 

export type TCalendarData = {
    plannersMap: Record<string, CalendarEvent[]>;
    currentWeatherChip: TPlannerChip | null;

    // Chips for each given day are separated by their calendar of origin (2D array)
    eventChipsMap: Record<string, TPlannerChip[][]>;
};