import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { EAccess } from '@/lib/enums/EAccess';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { getPlannerSet } from '@/storage/plannerSetsStorage';
import { loadCalendarData } from '@/utils/calendarUtils';
import { generateDatestampRange, getNextEightDayDatestamps, getTodayDatestamp, getYesterdayDatestamp } from '@/utils/dateUtils';
import { cloneItem } from '@/utils/listUtils';
import { uuid } from 'expo-modules-core';
import { usePathname, useRouter } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import { userAccessAtom } from '@/atoms/userAccess';

export const reloadablePaths = [
    '/',
    '/planners',
    '/countdowns'
];

const CalendarContext = createContext({ reloadPage: async () => { } });

export function CalendarProvider({ children }: { children: React.ReactNode }) {
    const [mountedDatestamps, setMountedDatestamps] = useAtom(mountedDatestampsAtom);
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const { plannersMap } = useAtomValue(calendarEventDataAtom);
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);
    const setUserAccess = useSetAtom(userAccessAtom);
    const pathname = usePathname();
    const router = useRouter();

    const plannerSetStorage = useMMKV({ id: EStorageId.PLANNER_SETS });

    // ------------- Utility Functions -------------

    async function checkAndUpdatePermissions() {
        try {
            const calendarStatus = await Calendar.getCalendarPermissionsAsync();
            const contactsStatus = await Contacts.getPermissionsAsync();
            setUserAccess(new Map([
                [EAccess.CALENDAR, calendarStatus.status === 'granted'],
                [EAccess.CONTACTS, contactsStatus.status === 'granted']
            ]));
        } catch (error) {
            console.error('Error checking permissions:', error);
            setUserAccess(new Map([
                [EAccess.CALENDAR, false],
                [EAccess.CONTACTS, false]
            ]));
        }
    }

    // The reloadPage function that handles different paths
    async function reloadPage() {
        try {
            switch (pathname) {
                case '/':
                    // For home page, reload today's calendar data
                    await checkAndUpdatePermissions();
                    await loadCalendarData([mountedDatestamps.today]);
                    break;

                case '/planners':
                    // For planners page, reload planner calendar data


                    // TODO: need to wait until atom updates?



                    await checkAndUpdatePermissions();
                    await loadCalendarData(mountedDatestamps.planner);
                    break;

                case '/countdowns':
                    // TODO: Add countdown reload logic here
                    // await reloadCountdowns();
                    await checkAndUpdatePermissions();
                    break;

                default:
                    // No action for other paths
                    return;
            }
        } catch (error) {
            console.error('Error during reload:', error);
        }
    }

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

        // Ensure the textfield remains visible if one exists during the midnight update.
        if (textfieldItem) {
            const yesterdayDatestamp = getYesterdayDatestamp();

            // If textfield item was from yesterday, carry it to today.
            if (textfieldItem.listId === yesterdayDatestamp) {
                const genericItem = cloneItem<IPlannerEvent>(
                    textfieldItem,
                    ['calendarId', 'timeConfig', 'recurringId', 'recurringCloneId'],
                    { listId: today, id: uuid.v4() }
                )
                setTextfieldItem(genericItem);
            }

            // If textfield item is now for today and we're on planners page with Next 7 Days view,
            // navigate to the today planner.
            else if (
                textfieldItem.listId === today &&
                pathname === '/planners' &&
                plannerSetKey === 'Next 7 Days'
            ) {
                router.push('/');
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

    // Datestamps build.
    useEffect(() => {
        handleUpdateMountedDatestamps();
    }, [plannerSetKey]);

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

    // Planner Set datestamps update.
    useMMKVListener((key) => {
        if (key === plannerSetKey) {
            handleUpdateMountedDatestamps()
        }
    }, plannerSetStorage);

    return (
        <CalendarContext.Provider value={{ reloadPage }}>
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