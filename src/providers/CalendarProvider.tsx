import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import { userAccessAtom } from '@/atoms/userAccess';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { EAccess } from '@/lib/enums/EAccess';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TAppMetaData } from '@/lib/types/TAppMetadata';
import { getCountdownPlannerFromStorage, saveCountdownPlannerToStorage } from '@/storage/countdownStorage';
import { getPlannerSetByTitle } from '@/storage/plannerSetsStorage';
import { deletePlannerEventFromStorageById, deletePlannerFromStorageByDatestamp, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { loadCalendarDataToStore } from '@/utils/calendarUtils';
import { getAllCountdownEventsFromCalendar, upsertCalendarEventsIntoCountdownPlanner } from '@/utils/countdownUtils';
import { getDatestampRange, getNextEightDayDatestamps, getTodayDatestamp, getYesterdayDatestamp } from '@/utils/dateUtils';
import { deleteAllPlannersInStorageBeforeYesterday } from '@/utils/plannerUtils';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { usePathname, useRouter } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { createContext, useContext, useEffect } from 'react';
import { useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';

// ✅ 

const CalendarContext = createContext({ onReloadPage: async () => { } });

export function CalendarProvider({ children }: { children: React.ReactNode }) {
    const plannerSetStorage = useMMKV({ id: EStorageId.PLANNER_SETS });
    const plannerEventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });
    const appMetaDataStorage = useMMKV({ id: EStorageId.APP_METADATA_KEY });
    const pathname = usePathname();
    const router = useRouter();

    const [mountedDatestamps, setMountedDatestamps] = useAtom(mountedDatestampsAtom);
    const { plannersMap } = useAtomValue(calendarEventDataAtom);
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);
    const setUserAccess = useSetAtom(userAccessAtom);

    const [appMetaData, setAppMetaData] = useMMKVObject<TAppMetaData>(EStorageKey.APP_META_DATA_KEY, appMetaDataStorage);

    const { textfieldItem, onSetTextfieldItem } = useTextfieldItemAs<IPlannerEvent>(plannerEventStorage);

    // Update the mounted datestamps atom when the planner set data changes.
    useMMKVListener((key) => {
        if (key === plannerSetKey) {
            updateMountedDatestamps()
        }
    }, plannerSetStorage);

    useEffect(() => {
        loadCountdownEventsAndUpdateStorage();
    }, []);

    // Update the mounted datestamps atom when the selected planner set changes.
    useEffect(() => {
        updateMountedDatestamps();
    }, [plannerSetKey]);

    // Load the calendar data when the mounted datestamps changes.
    useEffect(() => {
        loadMountedDatestampsCalendarData();
    }, [mountedDatestamps]);

    // Carryover yesterday's events to today if needed.
    useEffect(() => {
        carryoverYesterdayEvents();
    }, [mountedDatestamps.today]);

    // Update the mounted datestamps atom at midnight.
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime() + 100;

        const timeoutId = setTimeout(() => {
            updateMountedDatestamps();
            const intervalId = setInterval(updateMountedDatestamps, 24 * 60 * 60 * 1000);
            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, [setMountedDatestamps]);

    // ====================
    // 1. Exposed Function
    // ====================

    async function handleReloadPage() {
        try {
            switch (pathname) {
                case '/':
                    // For home page, reload today's calendar data
                    await updateCalendarAndContactPermissions();
                    await loadCountdownEventsAndUpdateStorage();
                    await loadCalendarDataToStore([mountedDatestamps.today]);
                    break;
                case '/planners':
                    // For planners page, reload planner calendar data

                    // TODO: need to wait until atom updates?

                    await updateCalendarAndContactPermissions();
                    await loadCountdownEventsAndUpdateStorage();
                    await loadCalendarDataToStore(mountedDatestamps.planner);
                    break;
                case '/planners/countdowns':
                    await updateCalendarAndContactPermissions();

                    // TODO: need to wait until atom updates?

                    await loadCountdownEventsAndUpdateStorage();
                    break;
            }
        } catch (error) {
            console.error('Error during reload:', error);
        }
    }

    // =====================
    // 2. Utility Functions
    // =====================

    async function updateCalendarAndContactPermissions() {
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

    function updateMountedDatestamps() {
        const today = getTodayDatestamp();
        let planner: string[] = [];

        if (plannerSetKey === 'Next 7 Days') {
            planner = getNextEightDayDatestamps().slice(1);
        } else {
            const plannerSet = getPlannerSetByTitle(plannerSetKey);
            if (plannerSet) {
                planner = getDatestampRange(plannerSet.startDatestamp, plannerSet.endDatestamp);
            }
        }

        // Ensure the textfield remains visible if one exists during the midnight update.
        if (textfieldItem) {
            const yesterdayDatestamp = getYesterdayDatestamp();

            // If textfield item was from yesterday, carry it to today.
            if (textfieldItem.listId === yesterdayDatestamp) {
                const newTextfieldItem = { ...textfieldItem };
                delete textfieldItem.calendarId;
                delete textfieldItem.timeConfig;
                delete textfieldItem.recurringId;
                onSetTextfieldItem(newTextfieldItem);
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

    async function loadMountedDatestampsCalendarData() {
        const todayIsLoading = !plannersMap[mountedDatestamps.today];
        await loadCalendarDataToStore(todayIsLoading ? mountedDatestamps.all : mountedDatestamps.planner);
    }

    async function loadCountdownEventsAndUpdateStorage() {
        const calendarEvents = await getAllCountdownEventsFromCalendar();
        const currentCountdownPlanner = getCountdownPlannerFromStorage();
        saveCountdownPlannerToStorage(
            upsertCalendarEventsIntoCountdownPlanner(currentCountdownPlanner, calendarEvents)
        );

        // Re-build the mounted datestamps so any countdown chips have storage references.
        await loadMountedDatestampsCalendarData();
    }

    function carryoverYesterdayEvents() {
        const todayDatestamp = getTodayDatestamp();
        const lastLoadedTodayDatestamp = appMetaData?.lastLoadedTodayDatestamp ?? todayDatestamp;

        if (lastLoadedTodayDatestamp !== todayDatestamp) {
            const yesterdayDatestamp = getYesterdayDatestamp();

            const yesterdayPlanner = getPlannerFromStorageByDatestamp(yesterdayDatestamp);
            const todayPlanner = getPlannerFromStorageByDatestamp(todayDatestamp);

            deleteAllPlannersInStorageBeforeYesterday();

            yesterdayPlanner.eventIds.reverse().forEach((id) => {
                const event = getPlannerEventFromStorageById(id);

                // Skip recurring and calendar events
                if (event.recurringId || event.calendarId) {
                    deletePlannerEventFromStorageById(event.id);
                    return;
                }

                // Link the event to today.
                event.listId = todayDatestamp;

                // Remove timeConfig.
                delete event.timeConfig;

                savePlannerEventToStorage(event);

                todayPlanner.eventIds.unshift(event.id);
            });

            deletePlannerFromStorageByDatestamp(yesterdayDatestamp);
            savePlannerToStorage(todayPlanner);
        }

        setAppMetaData({
            lastLoadedTodayDatestamp: todayDatestamp
        });
    }

    return (
        <CalendarContext.Provider value={{ onReloadPage: handleReloadPage }}>
            {children}
        </CalendarContext.Provider>
    )
}

export function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendarContext must be used within a CalendarProvider.');
    }
    return context;
}