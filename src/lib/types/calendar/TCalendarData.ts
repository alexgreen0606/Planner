import { Event as CalendarEvent } from 'expo-calendar';
import { TCalendarEventChip } from "./TCalendarEventChip";

// ✅ 

export type TCalendarData = {
    plannersMap: Record<string, CalendarEvent[]>;
    
    // Chips for each given day are separated by their calendar of origin (2D array)
    chipsMap: Record<string, TCalendarEventChip[][]>;
};