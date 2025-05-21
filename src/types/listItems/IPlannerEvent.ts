import { IListItem } from "./core/TListItem";

export type TTimeConfig = {
    allDay: boolean;
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
}

export interface IPlannerEvent extends IListItem {
    color?: string;
    timeConfig?: TTimeConfig;
    calendarId?: string;
    recurringId?: string;
}