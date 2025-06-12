import { IListItem } from "./core/TListItem";

export interface IRecurringEvent extends IListItem {
    startTime?: string; // HH:MM
    weekdayEventId?: string;
}