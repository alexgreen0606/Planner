import { PLANNER_SET_MODAL_PATHNAME } from "app/(modals)/plannerSetModal/[plannerSetKey]"
import { TIME_MODAL_PATHNAME } from "app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]"
import { Stack } from "expo-router"
import { useEffect } from "react";
import * as Calendar from 'expo-calendar';
import { useAtom } from "jotai";
import { hasCalendarAccessAtom } from "@/atoms/calendarEvents";

const CalendarPermissionsWrapper = () => {
    const [status, requestPermissions] = Calendar.useCalendarPermissions();
    const [hasCalendarAccess, setHasCalendarAccess] = useAtom(hasCalendarAccessAtom);

    useEffect(() => {
        const newStatus = (!status || status.status === 'undetermined') ? null : status?.status === 'granted';
        setHasCalendarAccess(newStatus);
        if (status?.status === 'undetermined') {
            requestPermissions();
        }
    }, [status]);

    return hasCalendarAccess !== null && (
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
    )
};

export default CalendarPermissionsWrapper;