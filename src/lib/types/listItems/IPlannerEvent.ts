import { IListItem } from "./core/TListItem";

export interface IDateRange {
    startIso: string;
    endIso: string;
}

export interface ITimeConfig extends IDateRange {
    allDay: boolean;
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
}

export interface IPlannerEvent extends IListItem {
    color?: string;
    timeConfig?: ITimeConfig;
    calendarId?: string;
    recurringId?: string;
    recurringCloneId?: string;
}