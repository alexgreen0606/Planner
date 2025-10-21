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
import { useSetAtom } from 'jotai';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

// ✅ 

const ExternalDataContext = createContext({
    onReloadPage: async () => { },
    loading: false
});

export function ExternalDataProvider({ children }: { children: React.ReactNode }) {
    const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();
    const pathname = usePathname();

    const appReady = useAppInitialization();

    const setTodayDatestamp = useSetAtom(todayDatestampAtom);
    const setUserAccess = useSetAtom(userAccessAtom);

    const loadedPathnames = useRef<Set<string>>(new Set());

    const [loading, setLoading] = useState(false);

    // Handle initial loading of data for newly-mounted pathnames.
    useEffect(() => {
        if (!appReady || loadedPathnames.current.has(pathname)) return;
        handleLoadPage();
    }, [pathname, appReady]);

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
        setLoading(true);
        await updateCalendarAndContactPermissions();

        if (pathname.includes('planners')) {
            // TODO: pass datestamp to weather getter
            loadCurrentWeatherToStore();
            await loadExternalCalendarData([datestamp]);
        } else if (pathname.includes('upcomingDates')) {
            await loadAllDayEventsToStore();
        }

        setLoading(false);
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
        <ExternalDataContext.Provider value={{ onReloadPage: handleLoadPage, loading }}>
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