import { EStorageId } from "@/lib/enums/EStorageId";
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
    storageId: EStorageId.PLANNER_EVENT;
}