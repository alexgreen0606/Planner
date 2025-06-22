import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { getPlannerSet } from '@/storage/plannerSetsStorage';
import { loadCalendarData } from '@/utils/calendarUtils';
import { generateDatestampRange, getNextEightDayDatestamps, getTodayDatestamp } from '@/utils/dateUtils';
import { useAtom, useAtomValue } from 'jotai';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';

const CalendarContext = createContext({ isLoading: true });

export function CalendarProvider({ children }: { children: React.ReactNode }) {
    const [mountedDatestamps, setMountedDatestamps] = useAtom(mountedDatestampsAtom);
    const { plannersMap } = useAtomValue(calendarEventDataAtom);
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);

    const plannerSetStorage = useMMKV({ id: EStorageId.PLANNER_SETS });

    // True if any mounted planners are missing calendar data.
    const isLoading = useMemo(
        () => mountedDatestamps.all.some(datestamp =>
            plannersMap[datestamp] === undefined
        ),
        [plannersMap, mountedDatestamps.all]
    );

    // ------------- Utility Functions -------------

    function handleUpdateMountedDatestamps() {
        const today = getTodayDatestamp();
        let planner: string[] = [];

        if (plannerSetKey === 'Next 7 Days') {
            planner = getNextEightDayDatestamps().slice(1);
        } else {
            const plannerSet = getPlannerSet(plannerSetKey);
            if (plannerSet) {
                planner = generateDatestampRange(plannerSet.startDatestamp, plannerSet.endDatestamp);
            }
        }

        setMountedDatestamps({
            today,
            planner,
            all: Array.from(new Set([today, ...planner]))
        });
    }

    async function handleLoadCalendarData() {
        const todayIsLoading = !plannersMap[mountedDatestamps.today];
        await loadCalendarData(todayIsLoading ? mountedDatestamps.all : mountedDatestamps.planner);
    }

    // TODO: reload calendar data handle directly in the scroll provider

    // Datestamps build.
    useEffect(() => {
        handleUpdateMountedDatestamps();
    }, [plannerSetKey]);

    console.log(plannersMap)

    // Calendar load.
    useEffect(() => {
        handleLoadCalendarData();
    }, [mountedDatestamps]);

    // Midnight datestamp update.
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime() + 100;

        const timeoutId = setTimeout(() => {
            handleUpdateMountedDatestamps();
            const intervalId = setInterval(handleUpdateMountedDatestamps, 24 * 60 * 60 * 1000);
            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, [setMountedDatestamps]);

    useMMKVListener((key) => {
        if (key === plannerSetKey) {
            handleUpdateMountedDatestamps()
        }
    }, plannerSetStorage);

    return (
        <CalendarContext.Provider value={{ isLoading }}>
            {children}
        </CalendarContext.Provider>
    );
}

export function useCalendarLoad() {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendarLoad must be used within a CalendarProvider.');
    }
    return context;
}