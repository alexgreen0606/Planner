import { EStorageId } from "@/lib/enums/EStorageId";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorage, getPlannerEventFromStorageById, savePlannerEventToStorage } from "@/storage/plannerStorage";
import { getDayOfWeekFromDatestamp } from "@/utils/dateUtils";
import { generateEmptyPlanner, syncPlannerWithCalendar } from "@/utils/plannerUtils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";
import { useCalendarData } from "./useCalendarData";
import { upsertRecurringEventsIntoPlanner } from "@/utils/recurringPlannerUtils";
import { getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";

const usePlanner = (datestamp: string) => {

    const initialLoadComplete = useRef(false);

    const { calendarEvents } = useCalendarData(datestamp);

    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
    const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
    const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // TODO: separate into 2 functions so hideRecurring doesnt keep running (incorporate collapsed into this as well)
    const visibleEventIds = useMemo(() => {
        if (!planner) return [];

        if (!planner.hideRecurring) return planner.eventIds;

        return planner.eventIds.filter((id) => {
            const event = getPlannerEventFromStorageById(id);
            return !event.recurringId;
        });
    }, [planner?.eventIds, planner?.hideRecurring]);

    // Build the initial planner out of the recurring planner and calendar.
    useEffect(() => {
        setPlanner((prev) => {
            let newPlanner = prev ?? generateEmptyPlanner(datestamp);

            newPlanner = upsertRecurringEventsIntoPlanner(newPlanner);
            // plannerEvents = syncPlannerWithCalendar(datestamp, plannerEvents, calendarEvents);

            // TODO: clean yesterday events

            // TODO: remove calendar records

            return planner;
        });
    }, [datestamp]);

    // Update the planner every time the date's calendar events change.
    useEffect(() => {
        if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
            return;
        }

        setPlanner((prev) => {
            if (!prev) return prev;

            let plannerEvents = prev.eventIds.map(getPlannerEventFromStorageById);
            plannerEvents = syncPlannerWithCalendar(datestamp, plannerEvents, calendarEvents);
            const eventIds = plannerEvents.map(e => e.id);

            return { ...prev, eventIds };
        });
    }, [calendarEvents]);

    // Update the planner every time the day of week's recurring events change.
    useMMKVListener((key) => {
        if (key === getDayOfWeekFromDatestamp(datestamp)) {
            setPlanner((prev) => {
                let newPlanner = prev ?? generateEmptyPlanner(datestamp);
                return upsertRecurringEventsIntoPlanner(newPlanner);
            });
        }
    }, recurringPlannerStorage);

    function handleEditTitle(title: string) {
        setPlanner((prev) => prev ? ({
            ...prev,
            title
        }) : prev);
    }

    function handleToggleEditTitle() {
        setIsEditingTitle(prev => !prev);
    }

    function handleToggleHideAllRecurring() {
        setPlanner((prev) => prev ? ({
            ...prev,
            hideRecurring: !prev.hideRecurring
        }) : prev);
    }

    function handleResetRecurringEvents() {
        setPlanner((prev) => prev ? upsertRecurringEventsIntoPlanner({
            ...prev,
            deletedRecurringEventIds: [],
            hideRecurring: false
        }) : prev);
    }

    function handleDeleteAllRecurringEvents() {
        setPlanner((prev) => {
            if (!prev) return prev;

            const newPlanner = { ...prev };

            const recurringPlannerId = getDayOfWeekFromDatestamp(datestamp);
            const recurringPlanner = getRecurringPlannerFromStorageById(recurringPlannerId);

            // Delete all recurring event records and remove their IDs from the planner.
            newPlanner.eventIds.filter((id) => {
                const event = getPlannerEventFromStorageById(id);
                if (event.recurringId) {
                    deletePlannerEventFromStorage(event.id);
                    return false;
                }
                return true;
            });

            // Mark all the recurring event IDs as deleted.
            newPlanner.deletedRecurringEventIds = recurringPlanner.eventIds;

            return newPlanner;
        });
    }

    return {
        planner: planner ?? generateEmptyPlanner(datestamp),
        visibleEventIds,
        isLoading,
        isEditingTitle,
        hasTitle: planner?.title,
        isRecurringHidden: planner?.hideRecurring,
        onEditTitle: handleEditTitle,
        onToggleEditTitle: handleToggleEditTitle,
        onToggleHideAllRecurring: handleToggleHideAllRecurring,
        onResetRecurringEvents: handleResetRecurringEvents,
        onDeleteAllRecurringEvents: handleDeleteAllRecurringEvents
    }
};

export default usePlanner;