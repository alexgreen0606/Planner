import { IListItem } from "./core/TListItem";

export type TTimeConfig = {
    allDay: boolean;
    startIso: string;
    endIso: string;
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
}

export interface IPlannerEvent extends IListItem {
    color?: string;
    timeConfig?: TTimeConfig;
    calendarId?: string;
    recurringId?: string;
    recurringCloneId?: string;
}