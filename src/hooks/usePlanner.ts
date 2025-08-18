import { EStorageId } from "@/lib/enums/EStorageId";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { getPlannerEventFromStorageById } from "@/storage/plannerStorage";
import { getDayOfWeekFromDatestamp } from "@/utils/dateUtils";
import { generateEmptyPlanner, syncPlannerWithCalendar, syncPlannerWithRecurring } from "@/utils/plannerUtils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";
import { useCalendarData } from "./useCalendarData";

const usePlanner = (datestamp: string) => {

    const initialLoadComplete = useRef(false);

    const { calendarEvents } = useCalendarData(datestamp);

    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_EVENT });
    const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const visibleEventIds = useMemo(() => {
        if (!planner) return [];

        if (planner.hideRecurring) {
            let plannerEvents = planner.eventIds.map(getPlannerEventFromStorageById);
            plannerEvents = plannerEvents.filter(e => !e.recurringId);
            return plannerEvents.map(e => e.id);
        }

        return planner.eventIds;
    }, [planner?.eventIds, planner?.hideRecurring])

    // Build the initial planner out of the recurring planner and calendar.
    useEffect(() => {
        setIsLoading(true);
        setPlanner((prev) => {
            const initialPlanner = prev ?? generateEmptyPlanner(datestamp);

            let plannerEvents = initialPlanner.eventIds.map(getPlannerEventFromStorageById);
            plannerEvents = syncPlannerWithRecurring(datestamp, plannerEvents);
            plannerEvents = syncPlannerWithCalendar(datestamp, plannerEvents, calendarEvents);
            const eventIds = plannerEvents.map(e => e.id);

            return { ...initialPlanner, eventIds };
        });
        setIsLoading(false);
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
                if (!prev) return prev;

                let plannerEvents = prev.eventIds.map(getPlannerEventFromStorageById);
                plannerEvents = syncPlannerWithRecurring(datestamp, plannerEvents);
                const eventIds = plannerEvents.map(e => e.id);

                return { ...prev, eventIds };
            });
        }
    }, recurringStorage);

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
        }) : undefined);
    }

    return {
        planner: planner ?? generateEmptyPlanner(datestamp),
        visibleEventIds,
        isLoading,
        isEditingTitle,
        hasTitle: planner?.title,
        isRecurringHidden: planner?.hideRecurring,
        handleEditTitle,
        handleToggleEditTitle,
        handleToggleHideAllRecurring
    }
};

export default usePlanner;