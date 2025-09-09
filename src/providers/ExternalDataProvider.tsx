import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import { TUserAccess, userAccessAtom } from '@/atoms/userAccess';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { EAccess } from '@/lib/enums/EAccess';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TAppMetaData } from '@/lib/types/TAppMetadata';
import { getPlannerSetByTitle } from '@/storage/plannerSetsStorage';
import { deletePlannerEventFromStorageById, deletePlannerFromStorageByDatestamp, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { loadExternalCalendarData } from '@/utils/calendarUtils';
import { getDatestampRange, getNextEightDayDatestamps, getTodayDatestamp, getYesterdayDatestamp } from '@/utils/dateUtils';
import { deleteAllPlannersInStorageBeforeYesterday } from '@/utils/plannerUtils';
import { loadCurrentWeatherToStore } from '@/utils/weatherUtils';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { usePathname, useRouter } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { createContext, useContext, useEffect, useRef } from 'react';
import { useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';

// ✅ 

const ExternalDataContext = createContext({ onReloadPage: async () => { } });

export function ExternalDataProvider({ children }: { children: React.ReactNode }) {
    const plannerSetStorage = useMMKV({ id: EStorageId.PLANNER_SETS });
    const plannerEventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });
    const appMetaDataStorage = useMMKV({ id: EStorageId.APP_METADATA_KEY });
    const pathname = usePathname();
    const router = useRouter();

    const [mountedDatestamps, setMountedDatestamps] = useAtom(mountedDatestampsAtom);
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);
    const setUserAccess = useSetAtom(userAccessAtom);

    const buildingDatestamps = useRef(true);

    const [appMetaData, setAppMetaData] = useMMKVObject<TAppMetaData>(EStorageKey.APP_META_DATA_KEY, appMetaDataStorage);

    const { textfieldItem, onSetTextfieldItem } = useTextfieldItemAs<IPlannerEvent>(plannerEventStorage);

    // Update the mounted datestamps atom when the planner set data changes.
    useMMKVListener((key) => {
        if (key === plannerSetKey) {
            updateMountedDatestamps();
        }
    }, plannerSetStorage);

    // Update the mounted datestamps atom when the selected planner set changes.
    useEffect(() => {
        updateMountedDatestamps();
        buildingDatestamps.current = false;
    }, [plannerSetKey]);

    // Load the calendar data when the mounted datestamps changes.
    useEffect(() => {
        if (buildingDatestamps.current) return;
        handleLoadPage();
    }, [mountedDatestamps.all]);

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
    }, []);

    // ====================
    // 1. Exposed Function
    // ====================

    async function handleLoadPage() {
        switch (pathname) {
            case '/':
                await updateCalendarAndContactPermissions();

                // Lazy load in the weather data for today.
                loadCurrentWeatherToStore();

                // Load in the calendar data for today and build the new planner.
                await loadExternalCalendarData([mountedDatestamps.today]);

                break;
            case '/planners':
                await updateCalendarAndContactPermissions();

                // TODO: how to handle loading in the weather?

                // Load in the calendar data for the mounted planners.
                await loadExternalCalendarData(mountedDatestamps.all);

                break;
            case '/planners/countdowns':
                await updateCalendarAndContactPermissions();

                // Load in the calendar data.
                await loadExternalCalendarData([mountedDatestamps.today]);

                break;
        }
    }

    // =====================
    // 2. Utility Functions
    // =====================

    async function updateCalendarAndContactPermissions(): Promise<TUserAccess> {
        let userAccess: TUserAccess;
        try {
            const calendarStatus = await Calendar.getCalendarPermissionsAsync();
            const contactsStatus = await Contacts.getPermissionsAsync();
            userAccess = new Map([
                [EAccess.CALENDAR, calendarStatus.status === 'granted'],
                [EAccess.CONTACTS, contactsStatus.status === 'granted']
            ]);
            setUserAccess(userAccess);
        } catch (error) {
            console.error('Error checking permissions:', error);
            userAccess = new Map([
                [EAccess.CALENDAR, false],
                [EAccess.CONTACTS, false]
            ]);
            setUserAccess(userAccess);
        } finally {
            return userAccess!;
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
        <ExternalDataContext.Provider value={{ onReloadPage: handleLoadPage }}>
            {children}
        </ExternalDataContext.Provider>
    )
}

export function useExternalDataContext() {
    const context = useContext(ExternalDataContext);
    if (!context) {
        throw new Error('useExternalDataContext must be used within a CalendarProvider.');
    }
    return context;
}