import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { visibleDatestampsAtom } from "@/atoms/visibleDatestamps";
import { loadCalendarData } from "@/utils/calendarUtils";
import { usePathname } from "expo-router";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReloadScheduler } from "./useReloadScheduler";
import { useTodayDatestamp } from "./useTodayDatestamp";

export const useLoadCalendarData = (pathname: string) => {
    const plannerDatestamps = useAtomValue(visibleDatestampsAtom);
    const { plannersMap } = useAtomValue(calendarEventDataAtom);
    const { registerReloadFunction } = useReloadScheduler();
    const todayDatestamp = useTodayDatestamp();
    const currPathname = usePathname();

    const todayDatestamps = useMemo(
        () => [todayDatestamp],
        [todayDatestamp]
    );

    const datestamps = pathname === "/" ? todayDatestamps : plannerDatestamps;

    const isLoading = useMemo(
        () => datestamps.some(datestamp =>
            plannersMap[datestamp] === undefined
        ),
        [plannersMap, datestamps]
    );

    // Track the page linked to this hook. This ensures the calendar data is not
    // reloaded when the page is not focused.
    const anchoredPathname = useRef(pathname);

    // Executes the loading of calendar data into the global state for this set of datestamps.
    const handleLoadCalendarData = useCallback(async () => {
        await loadCalendarData(datestamps);
    }, [datestamps]);

    // Reload the calendar data whenever the page is focused and the visible datestamps change.
    useEffect(() => {
        if (currPathname === anchoredPathname.current) {
            registerReloadFunction('calendar-reload-trigger', handleLoadCalendarData, anchoredPathname.current);
            
            handleLoadCalendarData();
        }
    }, [handleLoadCalendarData]);

    return isLoading;
};