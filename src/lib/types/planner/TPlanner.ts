// ✅ 

export type TPlanner = {
    datestamp: string;
    title: string;
    hideRecurring: boolean;
    eventIds: string[];
    deletedRecurringEventIds: string[];
    deletedCalendarEventIds: string[];
};