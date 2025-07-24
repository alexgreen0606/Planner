import { TListItem } from "./core/TListItem";

// ✅ 

export type TDateRange = {
    startIso: string;
    endIso: string;
};

export interface ITimeConfig extends TDateRange {
    allDay: boolean;
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
}

export interface IPlannerEvent extends TListItem {
    timeConfig?: ITimeConfig;
    calendarId?: string;
    recurringId?: string;
    recurringCloneId?: string;
}