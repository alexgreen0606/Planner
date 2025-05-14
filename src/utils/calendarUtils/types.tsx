import { IconType } from "@/components/GenericIcon";
import { EventChipProps } from "../../components/EventChip";
import { ListItem } from "../../feature/sortedList/types";

export enum Weekdays {
    Monday = 'Monday',
    Tuesday = 'Tuesday',
    Wednesday = 'Wednesday',
    Thursday = 'Thursday',
    Friday = 'Friday',
}

export const PLANNER_STORAGE_ID = 'PLANNER_STORAGE';

export type CalendarDetails = {
    id: string;
    color: string;
    iconType: IconType;
    isPrimary: boolean;
    isBirthday: boolean;
}

export interface Planner {
    datestamp: string;
    title: string;
    events: PlannerEvent[];
    excludeRecurring: boolean;
}

export type TimeConfig = {
    allDay: boolean;
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
}

export interface PlannerEvent extends ListItem {
    color?: string;
    timeConfig?: TimeConfig;
    calendarId?: string;
    recurringId?: string;
}

export interface RecurringEvent extends ListItem {
    startTime?: string; // HH:MM
    isWeekdayEvent?: boolean;
}

export interface CalendarData {
    chipsMap: Record<string, EventChipProps[]>;
    plannersMap: Record<string, PlannerEvent[]>;
}