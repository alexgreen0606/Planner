import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { loadCalendarData } from "@/utils/calendarUtils";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { useReloadScheduler } from "./useReloadScheduler";
import { usePathname } from "expo-router";

export const useLoadCalendarData = (range: string[], pathname: string) => {
    const { registerReloadFunction } = useReloadScheduler();
    const { plannersMap } = useAtomValue(calendarEventDataAtom);
    const currPathname = usePathname();

    // Ensures the pathname stays fixed, even if this page is unfocused
    const anchoredPathname = useRef(pathname);

    useEffect(() => {
        if (currPathname === anchoredPathname.current) {
            const reloadPageData = async () => await loadCalendarData(range);
            registerReloadFunction('calendar-reload-trigger', reloadPageData, anchoredPathname.current);
            reloadPageData();
        }
    }, [range, currPathname]);

    const isLoadingData = useMemo(
        () => range.some(datestamp =>
            plannersMap[datestamp] === undefined
        ),
        [plannersMap, range]
    );

    return { isLoading: isLoadingData }
};