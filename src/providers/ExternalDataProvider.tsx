import { loadedDatestampsAtom, trackLoadedDatestampAtom } from '@/atoms/loadedDatestampsAtom';
import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { TUserAccess, userAccessAtom } from '@/atoms/userAccess';
import useAppInitialization from '@/hooks/useAppInitialization';
import { EAccess } from '@/lib/enums/EAccess';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { loadAllDayEventsToStore, loadExternalCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { loadCurrentWeatherToStore } from '@/utils/weatherUtils';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// ✅ 

type ExternalDataContextType = {
    loadingPathnames: Set<string>;
    onReloadPage: () => Promise<void>;
};

const ExternalDataContext = createContext<ExternalDataContextType | undefined>(undefined);

export function ExternalDataProvider({ children }: { children: ReactNode }) {
    const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();
    const pathname = usePathname();

    const appReady = useAppInitialization();

    const trackLoadedDatestamp = useSetAtom(trackLoadedDatestampAtom);
    const loadedDatestamps = useAtomValue(loadedDatestampsAtom);
    const [userAccess, setUserAccess] = useAtom(userAccessAtom);
    const setTodayDatestamp = useSetAtom(todayDatestampAtom);

    const [loadingPathnames, setLoadingPathnames] = useState<Set<string>>(new Set<string>());

    // Handle initial loading of calendar data for newly-mounted planners.
    useEffect(() => {
        // Exit if app isn't ready or the current page is not a planner.
        if (!appReady || !pathname.includes('planners')) return;

        // Exit if the current datestamp has already been loaded.
        if (datestamp && loadedDatestamps.has(datestamp)) return;

        handleLoadPage();
    }, [pathname, appReady, loadedDatestamps]);

    // Load in the calendar data for the Upcoming Dates page when calendar access is granted.
    useEffect(() => {
        if (userAccess.get(EAccess.CALENDAR)) loadAllDayEventsToStore();
    }, [userAccess]);

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
        setLoadingPathnames((prev) => {
            prev.add(pathname);
            return prev;
        })
        await updateCalendarAndContactPermissions();

        if (pathname.includes('planners') && datestamp) {
            // TODO: pass datestamp to weather getter
            loadCurrentWeatherToStore();
            await loadExternalCalendarData([datestamp]);
            trackLoadedDatestamp(datestamp);
        } else if (pathname.includes('upcomingDates')) {
            await loadAllDayEventsToStore();
        }

        setLoadingPathnames((prev) => {
            prev.delete(pathname);
            return prev;
        })
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
        setTodayDatestamp(todayDatestamp);
    }

    if (!appReady) return null;

    return (
        <ExternalDataContext.Provider value={{ onReloadPage: handleLoadPage, loadingPathnames }}>
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