import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import Modal from "@/components/modal";
import { useTextfieldItemAs } from "@/hooks/useTextfieldItemAs";
import { EAccess } from "@/lib/enums/EAccess";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IFormField } from "@/lib/types/form/IFormField";
import { IPlannerEvent, TDateRange } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from "@/storage/plannerStorage";
import { getPrimaryCalendarId, loadCalendarDataToStore } from "@/utils/calendarUtils";
import { getIsoFromNowTimeRoundedDown5Minutes, getTodayDatestamp, getYesterdayDatestamp, isoToDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { createPlannerEventInStorageAndFocusTextfield, deletePlannerEventsFromStorageAndCalendar, getAllMountedDatestampsLinkedToDateRanges, getPlannerEventFromStorageByCalendarId, updatePlannerEventIndexWithChronologicalCheck } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
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
    | { eventType: EEventType.CALENDAR_MULTI_DAY; startPlannerEvent: IPlannerEvent | null, endPlannerEvent: IPlannerEvent };

type TCarryoverEventMetadata = {
    id: string,
    index: number | null // null means the event has moved to a new planner
};

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

    useEffect(() => {

        const buildFormData = async () => {
            let plannerEvent: IPlannerEvent | undefined;

            const plannerEventString = eventStorage.getString(eventId);
            if (plannerEventString) {
                plannerEvent = JSON.parse(plannerEventString);
            }

            if (!plannerEventString || !!plannerEvent?.timeConfig?.startEventId) { // CALENDAR_ALL_DAY or CALENDAR_MULTI_DAY
                const calendarId = plannerEvent ? plannerEvent.calendarId! : eventId;
                const calendarEvent = await Calendar.getEventAsync(calendarId);

                if (calendarEvent.allDay) { // CALENDAR_ALL_DAY
                    setInitialEventState({
                        eventType: EEventType.CALENDAR_ALL_DAY,
                        calendarEvent
                    });
                } else { // CALENDAR_MULTI_DAY
                    let startPlannerEvent: IPlannerEvent | null = null;
                    const startDatestamp = isoToDatestamp(calendarEvent.startDate as string);
                    if (getDoesPlannerStillExistInStorage(startDatestamp)) {
                        startPlannerEvent = getPlannerEventFromStorageByCalendarId(startDatestamp, calendarEvent.id);
                    }
                    const endPlannerEvent = getPlannerEventFromStorageByCalendarId(isoToDatestamp(calendarEvent.endDate as string), calendarEvent.id);
                    setInitialEventState({
                        eventType: EEventType.CALENDAR_MULTI_DAY,
                        startPlannerEvent,
                        endPlannerEvent
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
            } else if (!plannerEvent) {
                throw new Error(`PlannerEventTimeModal: No event found in storage or the calendar with ID ${eventId}`);
            }

            if (plannerEvent.calendarId) { // CALENDAR_SINGLE_DAY
                setInitialEventState({
                    eventType: EEventType.CALENDAR_SINGLE_DAY,
                    plannerEvent
                });
            } else { // NON_CALENDAR
                setInitialEventState({
                    eventType: EEventType.NON_CALENDAR,
                    plannerEvent
                });
            }

            reset({
                title: plannerEvent.value,
                timeRange: {
                    startIso: plannerEvent.timeConfig?.startIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp),
                    endIso: plannerEvent.timeConfig?.endIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp)
                },
                isCalendarEvent: !!plannerEvent.calendarId,
                allDay: false
            });

            setLoading(false);
        }

        buildFormData();
    }, []);

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
        const targetDatestamp = isoToDatestamp(timeRange.startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);

        // Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await extractNonCalendarEventContext(initialEventState, timeRange);

        // Create the unscheduled event in storage.
        const newEvent: IPlannerEvent = {
            id: carryoverEventMetadata?.id ?? uuid.v4(),
            storageId: EStorageId.PLANNER_EVENT,
            value: title,
            listId: targetDatestamp
        };
        savePlannerEventToStorage(newEvent);

        // Add the event to its planner.
        const finalEventIndex = addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Reload the calendar data to retrieve the up-to-date events.
        await reloadCalendarFromRanges(affectedDateRanges);

        // Close the modal with a new textfield below the saved event.
        closeModalNewTextfield(targetDatestamp, finalEventIndex + 1);
    }

    async function handleDelete() {
        if (!initialEventState) return;

        setLoading(true);

        let plannerEvent: IPlannerEvent;

        switch (initialEventState.eventType) {
            case EEventType.CALENDAR_ALL_DAY: {
                const { calendarEvent } = initialEventState;
                plannerEvent = getPlannerEventFromStorageByCalendarId(
                    isoToDatestamp(calendarEvent.endDate as string),
                    calendarEvent.id
                );
                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: {
                plannerEvent = initialEventState.endPlannerEvent;
                break;
            }
            case EEventType.NON_CALENDAR:
            case EEventType.CALENDAR_SINGLE_DAY: {
                plannerEvent = initialEventState.plannerEvent;
                break;
            }
        }

        if (plannerEvent) {
            await deletePlannerEventsFromStorageAndCalendar([plannerEvent]);
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
            await extractAllDayCalendarEventContext(initialEventState, timeRange);

        // Edge Case: Ensure correct format for iOS all-day creation.
        if (!wasAllDayEvent) {
            calendarEventDetails.endDate = shiftEndDateToStartOfNextDay(endIso);
        }

        // Phase 2: Update the device calendar and reload the calendar to the jotai store.
        await upsertCalendarEventToDevice(calendarId, calendarEventDetails);
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
            affectedDateRanges
        } = extractSingleDayCalendarEventContext(initialEventState, timeRange);

        // Phase 2: Update the device calendar with the new event.
        const finalCalendarId = await upsertCalendarEventToDevice(calendarId, eventDetails);

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
            previousEventMetadata,
            calendarId,
            affectedDateRanges
        } = extractMultiDayEventContext(initialEventState, timeRange);

        // Phase 2: Update the device calendar with the new event.
        const eventDetails = buildCalendarEventDetails(data);
        const finalCalendarId = await upsertCalendarEventToDevice(calendarId, eventDetails);

        // Phase 3: Create the start and end events and link them together.
        const startEvent = upsertFormDataToPlannerEvent(data, previousEventMetadata[0]?.id);
        const endEvent = upsertFormDataToPlannerEvent(data, previousEventMetadata[1]?.id);

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
        addEventToPlanner(startEvent, targetStartPlanner, previousEventMetadata[0]);
        addEventToPlanner(endEvent, targetEndPlanner, previousEventMetadata[1]);

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

                // Delete the planner event from storage.
                deletePlannerEventsFromStorageAndCalendar([plannerEvent]);

                break;
            }
            case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_ALL_DAY
                const { calendarEvent } = initialState;

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
                const { endPlannerEvent } = initialState;

                calendarId = endPlannerEvent.calendarId;

                // // Add the range of the previous event to the calendar update ranges.
                affectedDateRanges.push(endPlannerEvent.timeConfig!);

                // Delete the planner events from storage. 
                // Exclude calendar refresh (will be handled within this modal).
                // Exclude calendar delete (ID will be reused).
                const eventsToDelete = [endPlannerEvent];
                deletePlannerEventsFromStorageAndCalendar(eventsToDelete, {
                    excludeCalendarDelete: true,
                    excludeCalendarRefresh: true
                });

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_ALL_DAY
                const { plannerEvent } = initialState;

                calendarId = plannerEvent.calendarId;

                // Add the range of the previous event to the calendar update ranges.
                affectedDateRanges.push(plannerEvent.timeConfig!);

                // Delete the planner event from storage.
                // Exclude calendar refresh (will be handled within this modal).
                // Exclude calendar delete (ID will be reused if it exists).
                deletePlannerEventsFromStorageAndCalendar([plannerEvent], {
                    excludeCalendarDelete: true,
                    excludeCalendarRefresh: true
                });

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

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_SINGLE_DAY
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, id } = plannerEvent;

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

                calendarId = calendarEvent.id;

                // Mark the previous event ranges to reload the calendar.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_SINGLE_DAY
                const { startPlannerEvent, endPlannerEvent } = initialState;
                const { timeConfig } = endPlannerEvent;
                const { startEventId, endEventId } = timeConfig!;

                calendarId = endPlannerEvent.calendarId;

                // Mark the previous time range of the calendar event to reload the calendar.
                affectedDateRanges.push(timeConfig!);

                // Delete the end event from storage and remove from its planner.
                removeEventIdFromPlannerInStorage(endEventId!);
                deletePlannerEventFromStorageById(endEventId!);

                if (!startPlannerEvent || !getDoesPlannerStillExistInStorage(startPlannerEvent.listId)) break;

                // Re-use the position and ID of the existing start event.
                const hasMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(startEventId!, hasMovedPlanners);

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_SINGLE_DAY
                const { plannerEvent } = initialState;
                const { timeConfig, listId: startDatestamp, id } = plannerEvent;

                calendarId = plannerEvent.calendarId;

                // Mark the previous time range to reload the calendar.
                affectedDateRanges.push(timeConfig!);

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

                break;
            }
        }

        return { carryoverEventMetadata, calendarId, affectedDateRanges };
    }

    async function extractNonCalendarEventContext(initialState: TEventState, newRange: TDateRange) {
        const { startIso } = newRange;

        const affectedDateRanges: TDateRange[] = [];
        let carryoverEventMetadata: TCarryoverEventMetadata | undefined;

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → NON_CALENDAR
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, id } = plannerEvent;

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

                // Delete the existing event in the calendar.
                await Calendar.deleteEventAsync(calendarEvent.id, { futureEvents: false });

                // Mark the range of the calendar event to reload the calendar data.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → NON_CALENDAR
                const { startPlannerEvent, endPlannerEvent } = initialState;
                const { timeConfig } = endPlannerEvent;
                const { startEventId, endEventId, startIso: prevStartIso } = timeConfig!;

                // Delete the event in the calendar.
                await Calendar.deleteEventAsync(endPlannerEvent.calendarId!, { futureEvents: false });

                // Mark the range of the calendar event to reload the calendar data.
                affectedDateRanges.push(endPlannerEvent.timeConfig!);

                // Delete the end event from storage.
                // Start event may stay in storage to be updated.
                deletePlannerEventFromStorageById(endEventId!);

                // Exit early if the start event's planner no longer exists.
                // Storage has no useful data to carry over.
                if (!startPlannerEvent || !getDoesPlannerStillExistInStorage(startPlannerEvent.listId)) break;

                // Carryover the start event's ID and index to reuse with the new event.
                const hasMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(startEventId!, hasMovedPlanners);

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → NON_CALENDAR
                const { plannerEvent } = initialState;
                const { timeConfig, id, listId: startDatestamp, calendarId } = plannerEvent;

                // Event was in calendar. Delete it.
                await Calendar.deleteEventAsync(calendarId!, { futureEvents: false });

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
        const previousEventMetadata: TCarryoverEventMetadata[] = [];
        let calendarId: string | undefined;

        switch (initialState.eventType) {
            case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_MULTI_DAY
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, id } = plannerEvent;

                // If the event is recurring, mark it hidden in its planner so it is not overwritten.
                if (plannerEvent.recurringId) {
                    removeRecurringEventFromPlannerInStorage(id);
                }

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                previousEventMetadata.push(getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners));

                break;
            }
            case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_MULTI_DAY
                const { calendarEvent } = initialState;

                calendarId = calendarEvent.id;

                // Mark the previous event ranges to reload the calendar.
                affectedDateRanges.push({
                    startIso: calendarEvent.startDate as string,
                    endIso: calendarEvent.endDate as string,
                });

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_MULTI_DAY
                const { startPlannerEvent, endPlannerEvent } = initialState;
                const { listId: endDatestamp } = endPlannerEvent;
                const { timeConfig } = endPlannerEvent;

                calendarId = endPlannerEvent.calendarId;

                // Mark the previous time range of the calendar event to reload the calendar.
                affectedDateRanges.push(timeConfig!);

                // Re-use the position and ID of the existing end event.
                const hasEndMovedPlanners = getHasEventMovedPlanners(endDatestamp, endIso);
                previousEventMetadata.push(getEventMetadataAndCleanPreviousPlanner(endPlannerEvent.id, hasEndMovedPlanners));

                // Exit early if the start event's planner no longer exists.
                // Storage has no more useful data to carry over.
                if (!startPlannerEvent || !getDoesPlannerStillExistInStorage(startPlannerEvent.listId)) break;

                // Re-use the position and ID of the existing start event.
                const hasStartMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                previousEventMetadata.push(getEventMetadataAndCleanPreviousPlanner(startPlannerEvent!.id, hasStartMovedPlanners));

                break;
            }
            case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_MULTI_DAY
                const { plannerEvent } = initialState;
                const { listId: startDatestamp, timeConfig, id } = plannerEvent;

                calendarId = plannerEvent.calendarId;

                // Mark the previous time range of the calendar event to reload the calendar.
                affectedDateRanges.push(timeConfig!);

                // Re-use the position and ID of the existing event.
                const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
                previousEventMetadata.push(getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners));

                break;
            }
        }

        return { previousEventMetadata, calendarId, affectedDateRanges };
    }

    // ---------- Builders ----------

    function buildCalendarEventDetails(data: TFormData): Partial<Calendar.Event> {
        const { title, allDay, timeRange: { startIso, endIso } } = data;
        return {
            title,
            startDate: startIso,
            endDate: endIso,
            allDay,
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
            onCloseTextfield();
            router.replace(startDatestamp === getTodayDatestamp() ? '/' : '/planners');
            return;
        }

        if (mountedDatestamps.all.includes(endDatestamp)) {
            // End of range is mounted.
            onCloseTextfield();
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
        onCloseTextfield();
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
        eventDetails: Partial<Calendar.Event>
    ): Promise<string> {
        if (calendarId) {
            await Calendar.updateEventAsync(calendarId, eventDetails, {
                futureEvents: false,
            });
            return calendarId;
        } else {
            const primaryCalendarId = await getPrimaryCalendarId();
            return await Calendar.createEventAsync(primaryCalendarId, eventDetails);
        }
    }

    async function reloadCalendarFromRanges(ranges: TDateRange[]) {
        const affectedDates = getAllMountedDatestampsLinkedToDateRanges(ranges);
        await loadCalendarDataToStore(affectedDates);
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

    function getDoesPlannerStillExistInStorage(datestamp: string): boolean {
        return datestamp > getYesterdayDatestamp();
    }

    function addEventToPlanner(event: IPlannerEvent, targetPlanner: TPlanner, previousEventMetadata?: TCarryoverEventMetadata): number {
        const targetIndex = previousEventMetadata?.index ?? targetPlanner.eventIds.length;
        const newPlanner = updatePlannerEventIndexWithChronologicalCheck(targetPlanner, targetIndex, event);
        const finalIndex = newPlanner.eventIds.indexOf(event.id);
        savePlannerToStorage(newPlanner);
        return finalIndex;
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
            deleteButtonConfig={{
                label: 'Unschedule',
                optionLabels: ['Delete Event', 'Unschedule Event'],
                optionHandlers: [handleDelete, handleSubmit(handleUnschedule)]
            }}
            onClose={() => router.back()}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    )
};

export default PlannerEventTimeModal;