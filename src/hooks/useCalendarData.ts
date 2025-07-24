import { calendarChipsByDate, calendarPlannerByDate } from "@/atoms/calendarEvents";
import { useAtom } from "jotai";
import { useMemo } from "react";

// ✅ 

export const useCalendarData = (datestamp: string) => {
    const [calendarChips] = useAtom(calendarChipsByDate(datestamp));
    const [calendarEvents] = useAtom(calendarPlannerByDate(datestamp));

    const emptyData = useMemo(() => [], []);

    const memoizedCalendarChips = calendarChips || emptyData;
    const memoizedCalendarEvents = calendarEvents || emptyData;

    return {
        calendarChips: memoizedCalendarChips,
        calendarEvents: memoizedCalendarEvents
    };
};