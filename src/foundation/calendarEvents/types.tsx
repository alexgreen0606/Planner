import { IconType } from "../components/GenericIcon";
import { ListItem } from "../sortedLists/types";

export enum DaysOfWeek {
    Sunday = "Sunday",
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
};

export enum Weekdays {
    Monday = DaysOfWeek.Monday,
    Tuesday = DaysOfWeek.Tuesday,
    Wednesday = DaysOfWeek.Wednesday,
    Thursday = DaysOfWeek.Thursday,
    Friday = DaysOfWeek.Friday,
};

export const PLANNER_STORAGE_ID = 'PLANNER_STORAGE';

export type CalendarDetails = {
    id: string;
    color: string;
    iconType: IconType;
    isPrimary: boolean;
    isBirthday: boolean;
};

export type TimeConfig = {
    allDay: boolean;
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    multiDayEnd?: boolean;
    multiDayStart?: boolean;
};

export interface PlannerEvent extends ListItem {
    color?: string;
    timeConfig?: TimeConfig;
    calendarId?: string;
    recurringId?: string;
};

export interface RecurringEvent extends ListItem {
    startTime?: string; // HH:MM
    isWeekdayEvent?: boolean;
};

export interface Deadline extends ListItem {
    startTime: Date;
};