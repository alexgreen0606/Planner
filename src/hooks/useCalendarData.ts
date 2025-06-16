import { calendarChipsByDate, calendarPlannerByDate } from "@/atoms/calendarEvents";
import { useAtom } from "jotai";
import { useRef } from "react";

export const useCalendarData = (datestamp: string) => {
    const [calendarChips] = useAtom(calendarChipsByDate(datestamp));
    const [calendarEvents] = useAtom(calendarPlannerByDate(datestamp));

    const emptyDataRef = useRef([]);

    const memoizedCalendarChips = calendarChips || emptyDataRef.current;
    const memoizedCalendarEvents = calendarEvents || emptyDataRef.current;

    return {
        calendarChips: memoizedCalendarChips,
        calendarEvents: memoizedCalendarEvents
    }
};