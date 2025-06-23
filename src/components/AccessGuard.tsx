import { PLANNER_SET_MODAL_PATHNAME } from "app/(modals)/plannerSetModal/[plannerSetKey]"
import { TIME_MODAL_PATHNAME } from "app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]"
import { Stack } from "expo-router"
import { useEffect } from "react";
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { useAtom } from "jotai";
import { userAccessAtom } from "@/atoms/userAccess";
import { useFonts } from 'expo-font';
import { CalendarProvider } from "@/providers/CalendarProvider";
import { EAccess } from "@/lib/enums/EAccess";

const AccessGuard = () => {
    const [calendarStatus, requestCalendarPermissions] = Calendar.useCalendarPermissions();
    const [userAccess, setUserAccess] = useAtom(userAccessAtom);

    // Calendar permissions check.
    useEffect(() => {
        if (!calendarStatus || calendarStatus.status === 'undetermined') {
            requestCalendarPermissions();
        } else {
            setUserAccess(prev => {
                const newMap = new Map(prev);
                newMap.set(EAccess.CALENDAR, calendarStatus.status === 'granted');
                return newMap;
            });
        }
    }, [calendarStatus]);

    // Contacts permissions check.
    useEffect(() => {
        const requestContactsPermission = async () => {
            try {
                const { status } = await Contacts.getPermissionsAsync();

                if (status === 'undetermined') {
                    const { status: newStatus } = await Contacts.requestPermissionsAsync();
                    setUserAccess(prev => {
                        const newMap = new Map(prev);
                        newMap.set(EAccess.CONTACTS, newStatus === 'granted');
                        return newMap;
                    });
                } else {
                    setUserAccess(prev => {
                        const newMap = new Map(prev);
                        newMap.set(EAccess.CONTACTS, status === 'granted');
                        return newMap;
                    });
                }
            } catch (error) {
                console.error('Error requesting contacts permission:', error);
                setUserAccess(prev => {
                    const newMap = new Map(prev);
                    newMap.set(EAccess.CONTACTS, false);
                    return newMap;
                });
            }
        };

        if (userAccess.get(EAccess.CONTACTS) === undefined) {
            requestContactsPermission();
        }
    }, []);

    const [fontsLoaded] = useFonts({
        'RoundHeavy': require('../../assets/fonts/SF-Compact-Rounded-Heavy.otf'),
        'RoundMedium': require('../../assets/fonts/SF-Compact-Rounded-Medium.otf'),
        'Round': require('../../assets/fonts/SF-Compact-Rounded-Regular.otf'),
        'Text': require('../../assets/fonts/SF-Pro-Text-Regular.otf'),
    });

    const accessStatusesDetermined =
        userAccess.get(EAccess.CALENDAR) !== undefined &&
        userAccess.get(EAccess.CONTACTS) !== undefined;

    return fontsLoaded && accessStatusesDetermined && (
        <CalendarProvider>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name={`${TIME_MODAL_PATHNAME}[datestamp]/[eventId]/[sortId]/[eventValue]`}
                    options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                    name={`${PLANNER_SET_MODAL_PATHNAME}[plannerSetKey]`}
                    options={{ presentation: 'modal', headerShown: false }}
                />
            </Stack>
        </CalendarProvider>
    );
};

export default AccessGuard;