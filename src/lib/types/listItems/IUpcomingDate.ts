import { TListItem } from "./core/TListItem";

// ✅ 

export interface IUpcomingDate extends TListItem {
    startIso: string;
    calendarId: string;
    calendarEventId?: string;
    isRecurring: boolean;
    color: string;
    editable: boolean;
}