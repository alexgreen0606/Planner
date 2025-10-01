import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import Modal from "@/components/Modal";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { EAccess } from "@/lib/enums/EAccess";
import { EDateFieldType } from "@/lib/enums/EDateFieldType";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { ECarryoverEventType, EEventType } from "@/lib/enums/plannerEventModalEnums";
import { TCarryoverEventMetadata, TInitialEventMetadata } from "@/lib/types/form/plannerEventMetadata";
import { TFormField } from "@/lib/types/form/TFormField";
import { IPlannerEvent, TDateRange } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { getDoesPlannerEventExist, getDoesPlannerExist, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from "@/storage/plannerStorage";
import { getPrimaryCalendarId, loadExternalCalendarData } from "@/utils/calendarUtils";
import { getIsoFromNowTimeRoundedDown5Minutes, getTodayDatestamp, isoToDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { transitionToAllDayCalendarEvent, transitionToMultiDayCalendarEvent, transitionToNonCalendarEvent, transitionToSingleDayCalendarEvent } from "@/utils/plannerEventTransitionUtils";
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
    triggerDatestamp: string; // Planner key that triggered the modal open.
};

type TFormData = {
    test: string;
    title: string;
    start: DateTime;
    end: DateTime;
    isCalendarEvent: boolean;
    allDay: boolean;
};

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
            test: 'Folder',
            title: '',
            start: DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
            end: DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
            isCalendarEvent: false,
            allDay: false
        }
    });

    const mountedDatestamps = useAtomValue(mountedDatestampsAtom);
    const userAccess = useAtomValue(userAccessAtom);

    const [loading, setLoading] = useState(true);
    const [initialEventState, setInitialEventState] = useState<TInitialEventMetadata | null>(null);

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
    const start = watch('start');
    const end = watch('end');

    const formFields: TFormField[][] = [
        [{
            name: "test",
            floating: true,
            type: EFormFieldType.PICKER,
            options: ['Folder', 'Checklist']
        }],
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            label: 'Title',
            rules: { required: true },
            focusTrigger: loading ? false : title.length === 0
        }],
        [{
            name: 'start',
            label: 'Start',
            type: EFormFieldType.DATE,
            showTime: !isAllDay,
            onHandleSideEffects: (newStart: DateTime) =>
                enforceEndLaterThanStart(newStart, EDateFieldType.START_DATE)
        },
        {
            name: 'end',
            label: 'End',
            type: EFormFieldType.DATE,
            showTime: !isAllDay,
            invisible: !isCalendarEvent,
            onHandleSideEffects: (newEnd: DateTime) =>
                enforceEndLaterThanStart(newEnd, EDateFieldType.END_DATE)
        }],
        [{
            name: 'isCalendarEvent',
            type: EFormFieldType.CHECKBOX,
            label: 'Add to Calendar',
            invisible: !userAccess.get(EAccess.CALENDAR),
            onHandleSideEffects: enforceNonCalendarEventsArentAllDay
        },
        {
            name: 'allDay',
            type: EFormFieldType.CHECKBOX,
            label: 'All Day',
            invisible: !isCalendarEvent,
            onHandleSideEffects: enforceAllDayDatesAtMidnight
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
                    start: DateTime.fromISO(calendarEvent.startDate as string)!,
                    end: DateTime.fromISO(calendarEvent.endDate as string)!,
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
                start: DateTime.fromISO(storageEvent.timeConfig?.startIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
                end: DateTime.fromISO(storageEvent.timeConfig?.endIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
                isCalendarEvent: !!storageEvent.calendarId,
                allDay: false
            });

            setLoading(false);
        }

        onCloseTextfield();
        buildFormData();
    }, []);

    // ================
    //  Event Handlers
    // ================

    async function handleSaveFormData(data: TFormData) {
        if (!initialEventState) return;

        setLoading(true);

        const { allDay, isCalendarEvent, start, end } = data;
        if (allDay) {
            await saveAllDayCalendarEvent(data);
        } else if (isCalendarEvent) {
            if (getIsRangeMultiDay(getDateRangeFromValues(start, end))) {
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

        const { start, end, title } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const targetPlanner = getPlannerFromStorageByDatestamp(triggerDatestamp);

        // Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await transitionToNonCalendarEvent(initialEventState, timeRange);

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

    // =======================
    //  Side Effect Functions
    // =======================

    function enforceEndLaterThanStart(date: DateTime, selectorMode: EDateFieldType) {
        if (selectorMode === EDateFieldType.START_DATE) {
            if (end.toMillis() < date.toMillis()) {
                setValue('end', date);
            }

        } else {
            if (date.toMillis() < start.toMillis()) {
                setValue('start', date);
            }
        }
    }

    function enforceAllDayDatesAtMidnight(newAllDay: boolean) {
        if (!newAllDay) return;

        setValue("start", start.startOf("day"));
        setValue("end", end.startOf("day"));
    }

    function enforceNonCalendarEventsArentAllDay(newIsCalendarEvent: boolean) {
        if (newIsCalendarEvent) return;

        setValue("allDay", false);
    }

    // ==================
    //  Helper Functions
    // ==================

    async function saveAllDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const { endIso } = timeRange;

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const calendarEventDetails = buildCalendarEventDetails(data);
        const { calendarId, wasAllDayEvent, affectedDateRanges } =
            transitionToAllDayCalendarEvent(initialEventState, timeRange);

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

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
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
        } = transitionToSingleDayCalendarEvent(initialEventState, timeRange);

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

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const targetDatestamp = isoToDatestamp(timeRange.startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);

        // Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await transitionToNonCalendarEvent(initialEventState, timeRange);

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

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
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
        } = transitionToMultiDayCalendarEvent(initialEventState, timeRange);

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

    function buildCalendarEventDetails(data: TFormData): Partial<Calendar.Event> {
        const { title, allDay, start, end } = data;
        const { startIso, endIso } = getDateRangeFromValues(start, end);
        return {
            title,
            startDate: startIso,
            endDate: endIso,
            allDay
        };
    }

    function upsertFormDataToPlannerEvent(formData: TFormData, existingId?: string): IPlannerEvent {
        const { title, start, end, allDay } = formData;
        const { startIso, endIso } = getDateRangeFromValues(start, end);
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

    function getDateRangeFromValues(startDate: DateTime, endDate: DateTime) {
        return { startIso: startDate.toUTC().toISO()!, endIso: endDate.toUTC().toISO()! };
    }

    function addEventToPlanner(event: IPlannerEvent, targetPlanner: TPlanner, previousEventMetadata?: TCarryoverEventMetadata): number {
        const targetIndex = previousEventMetadata?.index ?? targetPlanner.eventIds.length;
        const newPlanner = updatePlannerEventIndexWithChronologicalCheck(targetPlanner, targetIndex, event);
        const finalIndex = newPlanner.eventIds.indexOf(event.id);
        savePlannerToStorage(newPlanner);
        return finalIndex;
    }

    // ================
    //  User Interface
    // ================

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
            <Form fieldSets={formFields} control={control} />
        </Modal>
    )
};

export default PlannerEventTimeModal;