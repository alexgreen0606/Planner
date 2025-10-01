import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { TUserAccess, userAccessAtom } from '@/atoms/userAccess';
import useAppInitialization from '@/hooks/useAppInitialization';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { EAccess } from '@/lib/enums/EAccess';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TAppMetaData } from '@/lib/types/TAppMetadata';
import { deletePlannerEventFromStorageById, deletePlannerFromStorageByDatestamp, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { loadExternalCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp, getYesterdayDatestamp } from '@/utils/dateUtils';
import { deleteAllPlannersInStorageOlderThan3Years as deleteAllPlannersInStorageOlderThanThreeYears } from '@/utils/plannerUtils';
import { loadCurrentWeatherToStore } from '@/utils/weatherUtils';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { usePathname, useRouter } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { createContext, useContext, useEffect } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

// ✅ 

const ExternalDataContext = createContext({ onReloadPage: async () => { } });

export function ExternalDataProvider({ children }: { children: React.ReactNode }) {
    const plannerEventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });
    const appMetaDataStorage = useMMKV({ id: EStorageId.APP_METADATA_KEY });
    const pathname = usePathname();
    const router = useRouter();

    const [mountedDatestamps, setMountedDatestamps] = useAtom(mountedDatestampsAtom);
    const setTodayDatestamp = useSetAtom(todayDatestampAtom);
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);
    const setUserAccess = useSetAtom(userAccessAtom);

    const [appMetaData, setAppMetaData] = useMMKVObject<TAppMetaData>(EStorageKey.APP_META_DATA_KEY, appMetaDataStorage);

    const appReady = useAppInitialization();
    const { textfieldItem, onSetTextfieldItem } = useTextfieldItemAs<IPlannerEvent>(plannerEventStorage);

    // Load the external data when the mounted datestamps changes.
    useEffect(() => {
        if (!appReady) return;

        if (mountedDatestamps.planner.length === 0) return;
        handleLoadPage();
    }, [mountedDatestamps.all, appReady]);

    // Carryover yesterday's events to today. (Runs once per day).
    useEffect(() => {
        if (!appReady) return;

        carryoverYesterdayEvents();
    }, [mountedDatestamps.today, appReady]);

    // Update the mounted datestamps atom at midnight.
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime() + 100;

        const timeoutId = setTimeout(() => {
            handleMidnightDatestampUpdate();
            const intervalId = setInterval(handleMidnightDatestampUpdate, 24 * 60 * 60 * 1000);
            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, []);

    async function handleLoadPage() {
        await updateCalendarAndContactPermissions();

        switch (pathname) {
            case '/':
                loadCurrentWeatherToStore();
                break;
            case '/planners':

                // TODO: how to handle loading in the weather for these planners?

                break;
        }

        await loadExternalCalendarData(mountedDatestamps.all);
    }

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

    function handleMidnightDatestampUpdate() {
        const todayDatestamp = getTodayDatestamp();

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
                textfieldItem.listId === todayDatestamp &&
                pathname === '/planners' &&
                plannerSetKey === 'Next 7 Days'
            ) {
                router.push('/');
            }
        }

        setTodayDatestamp(todayDatestamp);
    }

    function carryoverYesterdayEvents() {
        const todayDatestamp = getTodayDatestamp();
        const lastLoadedTodayDatestamp = appMetaData?.lastLoadedTodayDatestamp ?? todayDatestamp;

        if (lastLoadedTodayDatestamp !== todayDatestamp) {
            const yesterdayDatestamp = getYesterdayDatestamp();

            const yesterdayPlanner = getPlannerFromStorageByDatestamp(yesterdayDatestamp);
            const todayPlanner = getPlannerFromStorageByDatestamp(todayDatestamp);

            deleteAllPlannersInStorageOlderThanThreeYears();

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

    if (!appReady) return null;

    return (
        <ExternalDataContext.Provider value={{ onReloadPage: handleLoadPage }}>
            {children}
        </ExternalDataContext.Provider>
    )
}

export function useExternalDataContext() {
    const context = useContext(ExternalDataContext);
    if (!context) {
        throw new Error('useExternalDataContext must be used within an ExternalDataProvider.');
    }
    return context;
}