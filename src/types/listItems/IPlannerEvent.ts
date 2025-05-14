import { IListItem } from "./core/TListItem";

export type TimeConfig = {
    allDay: boolean;
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
}

export interface IPlannerEvent extends IListItem {
    color?: string;
    timeConfig?: TimeConfig;
    calendarId?: string;
    recurringId?: string;
}