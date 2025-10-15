import { activeCalendarFiltersAtom, primaryCalendarAtom } from "@/atoms/calendarAtoms";
import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IUpcomingDate } from "@/lib/types/listItems/IUpcomingDate";
import { getUpcomingDateEventFromStorageById, saveUpcomingDateEventToStorage } from "@/storage/upcomingDateStorage";
import { datestampToMidnightJsDate } from "@/utils/dateUtils";
import { uuid } from "expo-modules-core";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { MMKV, useMMKV, useMMKVObject } from "react-native-mmkv";
import useTextfieldItemAs from "./useTextfieldItemAs";

// ✅ 

const useUpcomingEvents = (upcomingDateEventStorage: MMKV) => {
    const upcomingDatePlannerStorage = useMMKV({ id: EStorageId.UPCOMING_DATE_PLANNER });

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
    const primaryCalendar = useAtomValue(primaryCalendarAtom);
    const activeCalendarFilters = useAtomValue(activeCalendarFiltersAtom);

    const [upcomingDatePlanner, setUpcomingDatePlanner] = useMMKVObject<string[]>(EStorageKey.UPCOMING_DATE_LIST_KEY, upcomingDatePlannerStorage);

    const todayMidnight = useMemo(() => datestampToMidnightJsDate(todayDatestamp), [todayDatestamp]);

    // Filter the upcoming events based on active calendar filters
    const filteredUpcomingDateEventIds = useMemo(() => {
        if (!upcomingDatePlanner) return [];

        // If no filters are active, show all events
        if (activeCalendarFilters.size === 0) {
            return upcomingDatePlanner;
        }

        // Filter events based on active calendar filters
        return upcomingDatePlanner.filter(eventId => {
            const event = getUpcomingDateEventFromStorageById(eventId);
            return event && activeCalendarFilters.has(event.calendarId);
        });
    }, [upcomingDatePlanner, activeCalendarFilters]);

    const { onSetTextfieldId: onSetFocusedUpcomingDateId } = useTextfieldItemAs<IUpcomingDate>(upcomingDateEventStorage);

    function handleCreateUpcomingDateEventInStorageAndFocusTextfield(index: number) {
        if (!primaryCalendar || !primaryCalendar.allowsModifications) return;

        let startIso = DateTime.fromJSDate(todayMidnight).toISO()!;

        // Set the item to have the same date as the event above it.
        if (index !== 0) {
            const parentEventId = upcomingDatePlanner![index - 1];
            const parentEvent = getUpcomingDateEventFromStorageById(parentEventId);
            startIso = parentEvent.startIso;
        }

        const newUpcomingDateEvent = {
            id: uuid.v4(),
            value: '',
            listId: EStorageKey.UPCOMING_DATE_LIST_KEY,
            storageId: EStorageId.UPCOMING_DATE_EVENT,
            startIso,
            isRecurring: false,
            calendarId: primaryCalendar.id,
            color: primaryCalendar.color,
            editable: true
        };
        saveUpcomingDateEventToStorage(newUpcomingDateEvent);

        // Add the event to its planner.
        setUpcomingDatePlanner((prev) => {
            const newUpcomingDatePlanner = prev ? [...prev] : [];
            newUpcomingDatePlanner.splice(index, 0, newUpcomingDateEvent.id);
            return newUpcomingDatePlanner;
        });

        onSetFocusedUpcomingDateId(newUpcomingDateEvent.id);
    }

    return {
        upcomingDateEventIds: filteredUpcomingDateEventIds,
        onCreateUpcomingDateEventInStorageAndFocusTextfield: handleCreateUpcomingDateEventInStorageAndFocusTextfield,
    }
};

export default useUpcomingEvents;