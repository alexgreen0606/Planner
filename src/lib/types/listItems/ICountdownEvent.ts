import { TListItem } from "./core/TListItem";

// ✅ 

export interface ICountdownEvent extends TListItem {
    startIso: string;
    calendarId: string;
    isRecurring: boolean;
    color: string;
}