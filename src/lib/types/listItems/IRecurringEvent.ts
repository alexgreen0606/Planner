import { TListItem } from "./core/TListItem";

// ✅ 

export interface IRecurringEvent extends TListItem {
    startTime?: string; // HH:MM
    weekdayEventId?: string;
}