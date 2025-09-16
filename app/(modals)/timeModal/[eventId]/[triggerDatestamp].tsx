import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import Modal from "@/components/modal";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { EAccess } from "@/lib/enums/EAccess";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IFormField } from "@/lib/types/form/IFormField";
import { IPlannerEvent, TDateRange } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, getDoesPlannerEventExist, getDoesPlannerExist, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from "@/storage/plannerStorage";
import { getPrimaryCalendarId, loadExternalCalendarData } from "@/utils/calendarUtils";
import { getIsoFromNowTimeRoundedDown5Minutes, getTodayDatestamp, isoToDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { createPlannerEventInStorageAndFocusTextfield, deletePlannerEventsFromStorageAndCalendar, getAllMountedDatestampsLinkedToDateRanges, getPlannerEventFromStorageByCalendarId, updatePlannerEventIndexWithChronologicalCheck } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMMKV } from "react-native-mmkv";

// ✅ 

type TModalParams = {
    eventId: string;
    triggerDatestamp: string; // Planner key that triggered the modal open
};

// The state of the event at time of modal open.
type TEventState =
    | { eventType: EEventType.NON_CALENDAR; plannerEvent: IPlannerEvent }
    | { eventType: EEventType.CALENDAR_SINGLE_DAY; plannerEvent: IPlannerEvent }
    | { eventType: EEventType.CALENDAR_ALL_DAY; calendarEvent: Calendar.Event }
    | { eventType: EEventType.CALENDAR_MULTI_DAY; startPlannerEvent: IPlannerEvent | null, endPlannerEvent: IPlannerEvent | null, calendarEvent: Calendar.Event };

type TCarryoverEventMetadata = {
    id: string,
    index: number | null // null means the event has moved to a new planner
};

type TCarryoverEventMap = Partial<Record<ECarryoverEventType, TCarryoverEventMetadata>>;

type TFormData = {
    title: string;
    timeRange: {
        startIso: string;
        endIso: string;
    };
    isCalendarEvent: boolean;
    allDay: boolean;
};

enum EEventType {
    NON_CALENDAR = 'NON_CALENDAR_EVENT',
    CALENDAR_SINGLE_DAY = 'CALENDAR_SINGLE_DAY',
    CALENDAR_MULTI_DAY = 'CALENDAR_MULTI_DAY',
    CALENDAR_ALL_DAY = 'CALENDAR_ALL_DAY',
}

enum ECarryoverEventType {
    START_EVENT = 'START_EVENT',
    END_EVENT = 'END_EVENT'
}

const PlannerEventTimeModal = () => {
    const { eventId, triggerDatestamp } = useLocalSearchParams<TModalParams>();
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });
    const router = useRouter();

    const {
        control,
        watch,
        reset,
        formState: { isValid },
        handleSubmit,
        setValue
    } = useForm<TFormData>({
        defaultValues: {
            title: '',
            timeRange: {
                startIso: getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp),
                endIso: getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp)
            },
            isCalendarEvent: false,
            allDay: false
        }
    });

    const mountedDatestamps = useAtomValue(mountedDatestampsAtom);
    const userAccess = useAtomValue(userAccessAtom);

    const [loading, setLoading] = useState(true);
    const [initialEventState, setInitialEventState] = useState<TEventState | null>(null);

    const { onCloseTextfield } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const deleteButtonConfig = useMemo(() => {
        const optionLabels = ['Delete Event', 'Unschedule Event'];
        const optionHandlers = [() => handleDelete(true), handleSubmit(handleUnschedule)];

        if (triggerDatestamp === getTodayDatestamp() && getDoesPlannerEventExist(eventId)) {
            optionLabels.splice(1, 0, 'Mark Event Completed');
            optionHandlers.splice(1, 0, () => handleDelete(false));
        }

        return {
            label: 'Delete Event',
            optionLabels,
            optionHandlers
        }
    }, [initialEventState]);

    const title = watch('title');
    const isAllDay = watch('allDay');
    const isCalendarEvent = watch('isCalendarEvent');

    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            rules: { required: true },
            trigger: loading ? false : title.length === 0
        }],
        [{
            name: 'timeRange',
            type: EFormFieldType.TIME_RANGE,
            multiDay: isCalendarEvent,
            allDay: isAllDay
        }],
        [{
            name: 'isCalendarEvent',
            type: EFormFieldType.CHECKBOX,
            label: 'Add to Calendar',
            hide: !userAccess.get(EAccess.CALENDAR)
        },
        {
            name: 'allDay',
            type: EFormFieldType.CHECKBOX,
            label: 'All Day',
            hide: !isCalendarEvent
        }]
    ];

    // Build metadata of the initial event state.
    useEffect(() => {

        const buildFormData = async () => {
            const isEventInStorage = getDoesPlannerEventExist(eventId);
            const storageEvent = isEventInStorage ? getPlannerEventFromStorageById(eventId) : null;

            if (!storageEvent || storageEvent.timeConfig?.startEventId) { // CALENDAR_ALL_DAY or CALENDAR_MULTI_DAY
                const calendarId = storageEvent ? storageEvent.calendarId! : eventId;
                const calendarEvent = await Calendar.getEventAsync(calendarId);

                if (calendarEvent.allDay) { // CALENDAR_ALL_DAY
                    setInitialEventState({
                        eventType: EEventType.CALENDAR_ALL_DAY,
                        calendarEvent
                    });
                } else { // CALENDAR_MULTI_DAY
                    let startPlannerEvent: IPlannerEvent | null = null;
                    let endPlannerEvent: IPlannerEvent | null = null;
                    const startDatestamp = isoToDatestamp(calendarEvent.startDate as string);
                    if (getDoesPlannerExist(startDatestamp)) {
                        startPlannerEvent = getPlannerEventFromStorageByCalendarId(startDatestamp, calendarEvent.id);
                    }
                    const endDatestamp = isoToDatestamp(calendarEvent.endDate as string);
                    if (getDoesPlannerExist(endDatestamp)) {
                        endPlannerEvent = getPlannerEventFromStorageByCalendarId(endDatestamp, calendarEvent.id);
                    }
                    setInitialEventState({
                        eventType: EEventType.CALENDAR_MULTI_DAY,
                        startPlannerEvent,
                        endPlannerEvent,
                        calendarEvent
                    });
                }

                reset({
                    title: calendarEvent.title,
                    timeRange: {
                        startIso: calendarEvent.startDate as string,
                        endIso: calendarEvent.endDate as string
                    },
                    isCalendarEvent: true,
                    allDay: calendarEvent.allDay
                });

                setLoading(false);
                return;
            } else if (!storageEvent) {
                throw new Error(`PlannerEventTimeModal: No event found in storage or the calendar with ID ${eventId}`);
            }

            if (storageEvent.calendarId) { // CALENDAR_SINGLE_DAY
                setInitialEventState({
                    eventType: EEventType.CALENDAR_SINGLE_DAY,
                    plannerEvent: storageEvent
                });
            } else { // NON_CALENDAR
                setInitialEventState({
                    eventType: EEventType.NON_CALENDAR,
                    plannerEvent: storageEvent
                });
            }

            reset({
                title: storageEvent.value,
                timeRange: {
                    startIso: storageEvent.timeConfig?.startIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp),
                    endIso: storageEvent.timeConfig?.endIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp)
                },
                isCalendarEvent: !!storageEvent.calendarId,
                allDay: false
            });

            setLoading(false);
        }

        onCloseTextfield();
        buildFormData();
    }, []);

    // Set all-day field to false anytime the event is marked as non-calendar.
    useEffect(() => {
        if (!isCalendarEvent) {
            setValue('allDay', false);
        }
    }, [isCalendarEvent]);

    // ==================
    // 1. Event Handlers
    // ==================

    async function handleSaveFormData(data: TFormData) {
        if (!initialEventState) return;

        setLoading(true);

        const { allDay, isCalendarEvent, timeRange } = data;
        if (allDay) {
            await saveAllDayCalendarEvent(data);
        } else if (isCalendarEvent) {
            if (getIsRangeMultiDay(timeRange)) {
                await saveMultiDayCalendarEvent(data);
            } else {
                await saveSingleDayCalendarEvent(data);
            }
        } else {
            await saveNonCalendarEvent(data);
        }
    }

    async function handleUnschedule(data: TFormData) {
        if (!initialEventState) return;

        const { timeRange, title } = data;
        const targetPlanner = getPlannerFromStorageByDatestamp(triggerDatestamp);

        // Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await extractNonCalendarEventContext(initialEventState, timeRange);

        // Create the unscheduled event in storage.
        const newEvent: IPlannerEvent = {
            id: carryoverEventMetadata?.id ?? uuid.v4(),
            storageId: EStorageId.PLANNER_EVENT,
            value: title,
            listId: triggerDatestamp
        };
        savePlannerEventToStorage(newEvent);

        // Add the event to its planner.
        const finalEventIndex = addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Reload the calendar data to retrieve the up-to-date events.
        await reloadCalendarFromRanges(affectedDateRanges);

        // Close the modal with a new textfield below the saved event.
        closeModalNewTextfield(triggerDatestamp, finalEventIndex + 1);
    }

    async function handleDelete(deleteTodayEvents: boolean = false) {
        if (!initialEventState) return;

        setLoading(true);

        let plannerEvent: IPlannerEvent | null = null;

        switch (initialEventState.eventType) {
            case EEventType.CALENDAR_ALL_DAY: {
                const { calendarEvent } = initialEventState;
                await Calendar.deleteEventAsync(calendarEvent.id);
                const datestampsToReload = getAllMountedDatestampsLinkedToDateRanges<TDateRange>([{
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string
                }]);
                await loadExternalCalendarData(datestampsToReload);
                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: {
                plannerEvent = initialEventState.endPlannerEvent ?? initialEventState.startPlannerEvent;

                if (!plannerEvent) {
                    // No events exist in storage. 
                    const { calendarEvent } = initialEventState;
                    await Calendar.deleteEventAsync(calendarEvent.id);

                    const datestampsToReload = getAllMountedDatestampsLinkedToDateRanges([{
                        startIso: calendarEvent.startDate as string,
                        endIso: calendarEvent.endDate as string
                    }]);
                    await loadExternalCalendarData(datestampsToReload);
                }
                break;
            }
            case EEventType.NON_CALENDAR:
            case EEventType.CALENDAR_SINGLE_DAY: {
                plannerEvent = initialEventState.plannerEvent;
                break;
            }
        }

        if (plannerEvent) {
            await deletePlannerEventsFromStorageAndCalendar([plannerEvent], deleteTodayEvents);
        }

        closeModalBackNoTextfield();
    }

    // ====================
    // 2. Helper Functions
    // ====================

    async function saveAllDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { timeRange } = data;
        const { endIso } = timeRange;

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const calendarEventDetails = buildCalendarEventDetails(data);
        const { calendarId, wasAllDayEvent, affectedDateRanges } =
            extractAllDayCalendarEventContext(initialEventState, timeRange);

        // Edge Case: Ensure correct format for iOS all-day creation.
        if (!wasAllDayEvent) {
            calendarEventDetails.endDate = shiftEndDateToStartOfNextDay(endIso);
        }

        // Phase 2: Update the device calendar and reload the calendar to the jotai store.
        await upsertCalendarEventToDevice(calendarId, calendarEventDetails, wasAllDayEvent);
        await reloadCalendarFromRanges(affectedDateRanges);

        // Phase 3: Close the modal and try to navigate to a planner with the new event.
        closeModalMountedDateOrBack(timeRange.startIso, timeRange.endIso);
    }

    async function saveSingleDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { timeRange } = data;
        const { startIso } = timeRange;

        const targetDatestamp = isoToDatestamp(startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);
        const eventDetails = buildCalendarEventDetails(data);

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const {
            carryoverEventMetadata,
            calendarId,
            affectedDateRanges,
            wasAllDayEvent
        } = extractSingleDayCalendarEventContext(initialEventState, timeRange);

        // Phase 2: Update the device calendar with the new event.
        const finalCalendarId = await upsertCalendarEventToDevice(calendarId, eventDetails, wasAllDayEvent);

        // Phase 3: Create the event in storage.
        const newEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata?.id);
        newEvent.calendarId = finalCalendarId;
        savePlannerEventToStorage(newEvent);

        // Phase 4: Add the event to its planner.
        const finalEventIndex = addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Phase 5: Reload the calendar data to retrieve the up-to-date event.
        await reloadCalendarFromRanges(affectedDateRanges);

        // Phase 6: Close modal with a new textfield below the event.
        closeModalNewTextfield(targetDatestamp, finalEventIndex + 1);
    }

    async function saveNonCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { timeRange } = data;
        const targetDatestamp = isoToDatestamp(timeRange.startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);

        // Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await extractNonCalendarEventContext(initialEventState, timeRange);

        // Create the event in storage.
        const newEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata?.id);
        savePlannerEventToStorage(newEvent);

        // Add the event to its planner.
        const finalEventIndex = addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Reload the calendar data to retrieve the up-to-date events.
        await reloadCalendarFromRanges(affectedDateRanges);

        // Close the modal with a new textfield below the saved event.
        closeModalNewTextfield(targetDatestamp, finalEventIndex + 1);
    }

    async function saveMultiDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { timeRange } = data;
        const { startIso, endIso } = timeRange;

        const targetStartDatestamp = isoToDatestamp(startIso);
        const targetStartPlanner = getPlannerFromStorageByDatestamp(targetStartDatestamp);
        const targetEndDatestamp = isoToDatestamp(endIso);
        const targetEndPlanner = getPlannerFromStorageByDatestamp(targetEndDatestamp);

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const {
            carryoverEventMetadata,
            calendarId,
            affectedDateRanges,
            wasAllDayEvent
        } = extractMultiDayEventContext(initialEventState, timeRange);

        // Phase 2: Update the device calendar with the new event.
        const eventDetails = buildCalendarEventDetails(data);
        const finalCalendarId = await upsertCalendarEventToDevice(calendarId, eventDetails, wasAllDayEvent);

        // Phase 3: Create the start and end events and link them together.
        const startEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata[ECarryoverEventType.START_EVENT]?.id);
        const endEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata[ECarryoverEventType.END_EVENT]?.id);

        startEvent.timeConfig!.startEventId = startEvent.id;
        startEvent.timeConfig!.endEventId = endEvent.id;

        endEvent.timeConfig!.startEventId = startEvent.id;
        endEvent.timeConfig!.endEventId = endEvent.id;

        startEvent.calendarId = finalCalendarId;
        endEvent.calendarId = finalCalendarId;

        endEvent.listId = targetEndDatestamp;

        // Save both events to storage.
        savePlannerEventToStorage(startEvent);
        savePlannerEventToStorage(endEvent);

        // Phase 4: Add the events to their planners.
        addEventToPlanner(startEvent, targetStartPlanner, carryoverEventMetadata[ECarryoverEventType.START_EVENT]);
        addEventToPlanner(endEvent, targetEndPlanner, carryoverEventMetadata[ECarryoverEventType.END_EVENT]);

        // Phase 5: Reload the calendar data to retrieve the up-to-date event.
        await reloadCalendarFromRanges(affectedDateRanges);

        // Phase 6: Close the modal and try to open a planner with the event.
        closeModalMountedDateOrBack(timeRange.startIso, timeRange.endIso);
    }

    // ---------- Extractors ----------

    function extractAllDayCalendarEventContext(initialState: TEventState, newRange: TDateRange) {
        const affectedDateRanges: TDateRange[] = [newRange];
        let calendarId: string | undefined;
        let wasAllDayEvent: boolean = false;

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_ALL_DAY
                const { plannerEvent } = initialState;

                // ✅ 

                // Delete the planner event from storage.
                deletePlannerEventsFromStorageAndCalendar([plannerEvent]);

                break;
            }
            case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_ALL_DAY
                const { calendarEvent } = initialState;

                // ✅ 

                wasAllDayEvent = true;
                calendarId = calendarEvent.id;

                // Add the range of the previous event to the calendar update ranges.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_ALL_DAY
                const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

                // ✅ 

                calendarId = calendarEvent.id;

                // // Add the range of the previous event to the calendar update ranges.
                affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

                // Delete the planner events from storage. 
                if (startPlannerEvent) {
                    removeEventIdFromPlannerInStorage(startPlannerEvent.id);
                    deletePlannerEventFromStorageById(startPlannerEvent.id);
                }
                if (endPlannerEvent) {
                    removeEventIdFromPlannerInStorage(endPlannerEvent.id);
                    deletePlannerEventFromStorageById(endPlannerEvent.id);
                }

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_ALL_DAY
                const { plannerEvent } = initialState;

                // ✅ 

                calendarId = plannerEvent.calendarId;

                // Add the range of the previous event to the calendar update ranges.
                affectedDateRanges.push(plannerEvent.timeConfig!);

                // Delete the planner event from storage. 
                if (plannerEvent) {
                    removeEventIdFromPlannerInStorage(plannerEvent.id);
                    deletePlannerEventFromStorageById(plannerEvent.id);
                }

                break;
            }
        }

        return { calendarId, wasAllDayEvent, affectedDateRanges };
    }

    function extractSingleDayCalendarEventContext(initialState: TEventState, newRange: TDateRange) {
        const { startIso } = newRange;

        const affectedDateRanges: TDateRange[] = [newRange];
        let carryoverEventMetadata: TCarryoverEventMetadata | undefined;
        let calendarId: string | undefined;
        let wasAllDayEvent = false;

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_SINGLE_DAY
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, id } = plannerEvent;

                // ✅ 

                // If the event is recurring, mark it hidden in its planner so it is not overwritten.
                if (plannerEvent.recurringId) {
                    removeRecurringEventFromPlannerInStorage(id);
                }

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
            case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_SINGLE_DAY
                const { calendarEvent } = initialState;

                // ✅ 

                wasAllDayEvent = true;
                calendarId = calendarEvent.id;

                // Mark the previous event ranges to reload the calendar.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_SINGLE_DAY
                const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

                // ✅ 

                calendarId = calendarEvent.id;

                // Mark the previous time range of the calendar event to reload the calendar.
                affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

                // Delete the end event from storage and remove from its planner.
                if (endPlannerEvent) {
                    removeEventIdFromPlannerInStorage(endPlannerEvent.id);
                    deletePlannerEventFromStorageById(endPlannerEvent.id);
                }

                // Try to re-use the position and ID of the existing start event.
                if (startPlannerEvent) {
                    const hasMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                    carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(startPlannerEvent.id, hasMovedPlanners);
                }

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_SINGLE_DAY
                const { plannerEvent } = initialState;
                const { timeConfig, listId: startDatestamp, id } = plannerEvent;

                // ✅ 

                calendarId = plannerEvent.calendarId;

                // Mark the previous time range to reload the calendar.
                affectedDateRanges.push(timeConfig!);

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
        }

        return { carryoverEventMetadata, calendarId, affectedDateRanges, wasAllDayEvent };
    }

    async function extractNonCalendarEventContext(initialState: TEventState, newRange: TDateRange) {
        const { startIso } = newRange;

        const affectedDateRanges: TDateRange[] = [];
        let carryoverEventMetadata: TCarryoverEventMetadata | undefined;

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → NON_CALENDAR
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, id } = plannerEvent;

                // ✅ 

                // If the event is recurring, mark it hidden in its planner so it is not overwritten.
                if (plannerEvent.recurringId) {
                    removeRecurringEventFromPlannerInStorage(id);
                }

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
            case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → NON_CALENDAR
                const { calendarEvent } = initialState;

                // ✅ 

                // Delete the existing event in the calendar.
                await Calendar.deleteEventAsync(calendarEvent.id, { futureEvents: true });

                // Mark the range of the calendar event to reload the calendar data.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → NON_CALENDAR
                const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

                // ✅ 

                // Delete the event in the calendar.
                await Calendar.deleteEventAsync(calendarEvent.id, { futureEvents: true });

                // Mark the range of the calendar event to reload the calendar data.
                affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

                // Delete the end event from storage and remove from its planner.
                if (endPlannerEvent) {
                    removeEventIdFromPlannerInStorage(endPlannerEvent.id);
                    deletePlannerEventFromStorageById(endPlannerEvent.id);
                }

                // Try to carryover the start event's ID and index to reuse with the new event.
                if (startPlannerEvent) {
                    const hasMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                    carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(startPlannerEvent.id, hasMovedPlanners);
                }

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → NON_CALENDAR
                const { plannerEvent } = initialState;
                const { timeConfig, id, listId: startDatestamp, calendarId } = plannerEvent;

                // ✅ 

                // Event was in calendar. Delete it.
                await Calendar.deleteEventAsync(calendarId!, { futureEvents: true });

                // Mark the range of the calendar event to reload the calendar data.
                affectedDateRanges.push(timeConfig!);

                // Carryover the event's ID and index to reuse with the new event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
        }

        return { affectedDateRanges, carryoverEventMetadata };
    }

    function extractMultiDayEventContext(initialState: TEventState, newRange: TDateRange) {
        const { startIso, endIso } = newRange;

        const affectedDateRanges: TDateRange[] = [newRange];
        const carryoverEventMetadata: TCarryoverEventMap = {};
        let calendarId: string | undefined;
        let wasAllDayEvent = false;

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_MULTI_DAY
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, id } = plannerEvent;

                // ✅ 

                // If the event is recurring, mark it hidden in its planner so it is not overwritten.
                if (plannerEvent.recurringId) {
                    removeRecurringEventFromPlannerInStorage(id);
                }

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
            case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_MULTI_DAY
                const { calendarEvent } = initialState;

                // ✅ 

                calendarId = calendarEvent.id;
                wasAllDayEvent = true;

                // Mark the previous event ranges to reload the calendar.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_MULTI_DAY
                const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

                // ✅ 

                calendarId = calendarEvent.id;

                // Mark the previous time range of the calendar event to reload the calendar.
                affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

                // Re-use the position and ID of the existing end event.
                if (endPlannerEvent) {
                    const hasEndMovedPlanners = getHasEventMovedPlanners(endPlannerEvent.listId, endIso);
                    carryoverEventMetadata[ECarryoverEventType.END_EVENT] = getEventMetadataAndCleanPreviousPlanner(endPlannerEvent.id, hasEndMovedPlanners);
                }

                // Re-use the position and ID of the existing start event.
                if (startPlannerEvent) {
                    const hasStartMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                    carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getEventMetadataAndCleanPreviousPlanner(startPlannerEvent.id, hasStartMovedPlanners);
                }

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_MULTI_DAY
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, timeConfig, id } = plannerEvent;

                // ✅ 

                calendarId = plannerEvent.calendarId;

                // Mark the previous time range of the calendar event to reload the calendar.
                affectedDateRanges.push(timeConfig!);

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
        }

        return { carryoverEventMetadata, calendarId, affectedDateRanges, wasAllDayEvent };
    }

    // ---------- Builders ----------

    function buildCalendarEventDetails(data: TFormData): Partial<Calendar.Event> {
        const { title, allDay, timeRange: { startIso, endIso } } = data;
        return {
            title,
            startDate: startIso,
            endDate: endIso,
            allDay
        };
    }

    // ---------- Modal Closers ----------

    function closeModalMountedDateOrBack(startIso: string, endIso: string) {
        const startDatestamp = isoToDatestamp(startIso);
        const endDatestamp = isoToDatestamp(endIso);

        if (
            isTimeEarlierOrEqual(startDatestamp, triggerDatestamp) &&
            isTimeEarlierOrEqual(triggerDatestamp, endDatestamp)
        ) { // Trigger datestamp is within range.
            closeModalBackNoTextfield();
            return;
        }

        if (mountedDatestamps.all.includes(startDatestamp)) {
            // Start of range is mounted.
            router.replace(startDatestamp === getTodayDatestamp() ? '/' : '/planners');
            return;
        }

        if (mountedDatestamps.all.includes(endDatestamp)) {
            // End of range is mounted.
            router.replace(endDatestamp === getTodayDatestamp() ? '/' : '/planners');
            return;
        }

        closeModalBackNoTextfield();
    }

    function closeModalNewTextfield(targetDatestamp: string, targetIndex: number) {
        if (mountedDatestamps.all.includes(targetDatestamp)) {
            createPlannerEventInStorageAndFocusTextfield(targetDatestamp, targetIndex);
            router.replace(targetDatestamp === getTodayDatestamp() ? '/' : '/planners');
        } else {
            closeModalBackNoTextfield();
        }
    }

    function closeModalBackNoTextfield() {
        router.back();
    }

    // ---------- Miscellaneous Helpers ----------

    function upsertFormDataToPlannerEvent(formData: TFormData, existingId?: string): IPlannerEvent {
        const { title, timeRange: { startIso, endIso }, allDay } = formData;
        return {
            id: existingId ?? uuid.v4(),
            listId: isoToDatestamp(startIso),
            value: title,
            timeConfig: {
                startIso,
                endIso,
                allDay
            },
            storageId: EStorageId.PLANNER_EVENT
        }
    }

    function shiftEndDateToStartOfNextDay(endIso: string): string {
        return DateTime.fromISO(endIso)
            .plus({ days: 1 })
            .startOf("day")
            .toUTC()
            .toISO()!;
    }

    function getIsRangeMultiDay(range: TDateRange): boolean {
        return isoToDatestamp(range.startIso) !== isoToDatestamp(range.endIso);
    }

    async function upsertCalendarEventToDevice(
        calendarId: string | undefined,
        eventDetails: Partial<Calendar.Event>,
        wasAllDayEvent: boolean
    ): Promise<string> {
        if (calendarId) {
            if (wasAllDayEvent && !eventDetails.allDay) {
                // Edge Case: Need to delete the all-day event and create a new event.
                await Calendar.deleteEventAsync(calendarId);
                const primaryCalendarId = await getPrimaryCalendarId();
                return await Calendar.createEventAsync(primaryCalendarId, eventDetails);
            }
            await Calendar.updateEventAsync(calendarId, eventDetails, { futureEvents: true });
            return calendarId;
        } else {
            const primaryCalendarId = await getPrimaryCalendarId();
            return await Calendar.createEventAsync(primaryCalendarId, eventDetails);
        }
    }

    async function reloadCalendarFromRanges(ranges: TDateRange[]) {
        const affectedDates = getAllMountedDatestampsLinkedToDateRanges(ranges);
        await loadExternalCalendarData(affectedDates);
    }

    function getPlannerEventIndex(eventId: string): number {
        const event = getPlannerEventFromStorageById(eventId);
        const planner = getPlannerFromStorageByDatestamp(event.listId);
        return planner.eventIds.findIndex((id) => id === eventId);
    }

    function removeEventIdFromPlannerInStorage(eventId: string) {
        const event = getPlannerEventFromStorageById(eventId);
        const planner = getPlannerFromStorageByDatestamp(event.listId);
        savePlannerToStorage({
            ...planner,
            eventIds: planner.eventIds.filter((id) => id !== eventId)
        });
    }

    function removeRecurringEventFromPlannerInStorage(eventId: string) {
        const event = getPlannerEventFromStorageById(eventId);
        const planner = getPlannerFromStorageByDatestamp(event.listId);
        planner.deletedRecurringEventIds.push(eventId);
        savePlannerToStorage(planner);
    }

    function getEventMetadataAndCleanPreviousPlanner(eventId: string, hasMovedPlanners: boolean): TCarryoverEventMetadata {
        if (hasMovedPlanners) {
            removeEventIdFromPlannerInStorage(eventId);
        }
        return {
            id: eventId,
            index: hasMovedPlanners ? null : getPlannerEventIndex(eventId)
        }
    }

    function getHasEventMovedPlanners(prevDatestamp: string, newIso: string): boolean {
        return prevDatestamp !== isoToDatestamp(newIso);
    }

    function addEventToPlanner(event: IPlannerEvent, targetPlanner: TPlanner, previousEventMetadata?: TCarryoverEventMetadata): number {
        const targetIndex = previousEventMetadata?.index ?? targetPlanner.eventIds.length;
        const newPlanner = updatePlannerEventIndexWithChronologicalCheck(targetPlanner, targetIndex, event);
        const finalIndex = newPlanner.eventIds.indexOf(event.id);
        savePlannerToStorage(newPlanner);
        return finalIndex;
    }

    function getCalendarEventTimeRange(event: Calendar.Event) {
        return {
            startIso: event.startDate as string,
            endIso: event.endDate as string
        }
    }

    // ======
    // 3. UI
    // ======

    return (
        <Modal
            title='Schedule Event'
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSubmit(handleSaveFormData),
                disabled: !isValid || loading
            }}
            deleteButtonConfig={deleteButtonConfig}
            onClose={() => router.back()}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    )
};

export default PlannerEventTimeModal;