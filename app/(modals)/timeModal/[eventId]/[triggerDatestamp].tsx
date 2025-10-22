import { importantCalendarAtom, primaryCalendarAtom } from "@/atoms/calendarAtoms";
import { untrackLoadedDatestampsAtom } from "@/atoms/loadedDatestampsAtom";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import Modal from "@/components/Modal";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { EAccess } from "@/lib/enums/EAccess";
import { EDateFieldType } from "@/lib/enums/EDateFieldType";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EPopupActionType } from "@/lib/enums/EPopupActionType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { ECarryoverEventType, EEventType } from "@/lib/enums/plannerEventModalEnums";
import { TCarryoverEventMetadata, TInitialEventMetadata } from "@/lib/types/form/plannerEventMetadata";
import { TFormField } from "@/lib/types/form/TFormField";
import { IPlannerEvent, TDateRange } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { TPopupAction } from "@/lib/types/TPopupAction";
import { getDoesPlannerEventExist, getDoesPlannerExist, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from "@/storage/plannerStorage";
import { getIsoFromNowTimeRoundedDown5Minutes, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { getCalendarEventTimeRange, transitionToAllDayCalendarEvent, transitionToMultiDayCalendarEvent, transitionToNonCalendarEvent, transitionToSingleDayCalendarEvent } from "@/utils/plannerEventTransitionUtils";
import { deletePlannerEventsFromStorageAndCalendar, getPlannerEventFromStorageByCalendarId, updatePlannerEventIndexWithChronologicalCheck } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMMKV } from "react-native-mmkv";

// ✅ 

type TModalParams = {
    eventId: string;

    // Planner key that triggered the modal open.
    triggerDatestamp: string;
};

type TFormData = {
    test: string;
    title: string;
    start: DateTime;
    end: DateTime;
    isCalendarEvent: boolean;
    isAllDay: boolean;
    isImportant: boolean;
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
            isAllDay: false,
            isImportant: false
        }
    });

    const untrackLoadedDatestamps = useSetAtom(untrackLoadedDatestampsAtom);
    const importantCalendar = useAtomValue(importantCalendarAtom);
    const primaryCalendar = useAtomValue(primaryCalendarAtom);
    const userAccess = useAtomValue(userAccessAtom);

    const { onCloseTextfield } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const [initialEventState, setInitialEventState] = useState<TInitialEventMetadata | null>(null);
    const [loading, setLoading] = useState(true);

    const deleteActions = useMemo(() => {
        const actions: TPopupAction[] = [
            {
                type: EPopupActionType.BUTTON,
                title: 'Delete Event',
                systemImage: 'trash',
                destructive: true,
                onPress: () => handleDelete(true)
            }
        ];

        if (triggerDatestamp === getTodayDatestamp() && getDoesPlannerEventExist(eventId)) {
            actions.push({
                type: EPopupActionType.BUTTON,
                title: 'Mark Event Completed',
                systemImage: 'circle.inset.filled',
                onPress: () => handleDelete(false)
            });
        }

        actions.push({
            type: EPopupActionType.BUTTON,
            title: 'Unschedule Event',
            systemImage: 'clock.badge.xmark',
            onPress: handleSubmit(handleUnschedule)
        });

        return actions;
    }, [initialEventState]);

    const title = watch('title');
    const isAllDay = watch('isAllDay');
    const isCalendarEvent = watch('isCalendarEvent');
    const start = watch('start');
    const end = watch('end');

    const formFields: TFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            label: 'Event Title',
            rules: { required: true },
            focusTrigger: loading ? false : title.length === 0
        }],
        [{
            name: 'start',
            label: 'Start',
            type: EFormFieldType.DATE,
            showTime: !isAllDay,
            onHandleSideEffects: (newStart: DateTime) =>
                handleDateRangeChange(newStart, EDateFieldType.START_DATE)
        },
        {
            name: 'end',
            label: 'End',
            type: EFormFieldType.DATE,
            showTime: !isAllDay,
            invisible: !isCalendarEvent,
            onHandleSideEffects: (newEnd: DateTime) =>
                handleDateRangeChange(newEnd, EDateFieldType.END_DATE)
        }],
        [{
            name: 'isCalendarEvent',
            type: EFormFieldType.CHECKBOX,
            label: 'Add to Calendar',
            invisible: !userAccess.get(EAccess.CALENDAR) || !primaryCalendar,
            onHandleSideEffects: handleCalendarEventChange
        },
        {
            name: 'isAllDay',
            type: EFormFieldType.CHECKBOX,
            label: 'All Day',
            invisible: !isCalendarEvent,
            onHandleSideEffects: handleAllDayChange
        },
        {
            name: 'isImportant',
            type: EFormFieldType.CHECKBOX,
            label: 'Important',
            invisible: !isAllDay || !importantCalendar
        }]
    ];

    // Build metadata of the initial event state.
    useEffect(() => {

        const buildFormData = async () => {
            const isEventInStorage = getDoesPlannerEventExist(eventId);
            const storageEvent = isEventInStorage ? getPlannerEventFromStorageById(eventId) : null;

            if (!storageEvent || storageEvent.timeConfig?.startEventId) { // CALENDAR_ALL_DAY or CALENDAR_MULTI_DAY
                const calendarEventId = storageEvent ? storageEvent.calendarEventId! : eventId;
                const calendarEvent = await Calendar.getEventAsync(calendarEventId);

                if (calendarEvent.allDay) { // CALENDAR_ALL_DAY
                    setInitialEventState({
                        eventType: EEventType.CALENDAR_ALL_DAY,
                        calendarEvent
                    });
                } else { // CALENDAR_MULTI_DAY
                    let startPlannerEvent: IPlannerEvent | null = null;
                    let endPlannerEvent: IPlannerEvent | null = null;
                    let startPlanner: TPlanner | null = null;
                    let endPlanner: TPlanner | null = null;
                    const startDatestamp = isoToDatestamp(calendarEvent.startDate as string);
                    if (getDoesPlannerExist(startDatestamp)) {
                        startPlannerEvent = getPlannerEventFromStorageByCalendarId(startDatestamp, calendarEvent.id);
                        startPlanner = getPlannerFromStorageByDatestamp(startDatestamp);
                    }
                    const endDatestamp = isoToDatestamp(calendarEvent.endDate as string);
                    if (getDoesPlannerExist(endDatestamp)) {
                        endPlannerEvent = getPlannerEventFromStorageByCalendarId(endDatestamp, calendarEvent.id);
                        endPlanner = getPlannerFromStorageByDatestamp(endDatestamp);
                    }
                    setInitialEventState({
                        eventType: EEventType.CALENDAR_MULTI_DAY,
                        startPlannerEvent,
                        startPlanner,
                        endPlannerEvent,
                        endPlanner,
                        calendarEvent
                    });
                }

                reset({
                    title: calendarEvent.title,
                    start: DateTime.fromISO(calendarEvent.startDate as string)!,
                    end: DateTime.fromISO(calendarEvent.endDate as string)!,
                    isCalendarEvent: true,
                    isAllDay: calendarEvent.allDay,
                    isImportant: calendarEvent.calendarId === importantCalendar?.id
                });

                setLoading(false);
                return;
            } else if (!storageEvent) {
                throw new Error(`PlannerEventTimeModal: No event found in storage or the calendar with ID ${eventId}`);
            }

            const planner = getPlannerFromStorageByDatestamp(storageEvent.listId);

            if (storageEvent.calendarEventId) { // CALENDAR_SINGLE_DAY
                setInitialEventState({
                    eventType: EEventType.CALENDAR_SINGLE_DAY,
                    plannerEvent: storageEvent,
                    planner
                });
            } else { // NON_CALENDAR
                setInitialEventState({
                    eventType: EEventType.NON_CALENDAR,
                    plannerEvent: storageEvent,
                    planner
                });
            }

            reset({
                title: storageEvent.value,
                start: DateTime.fromISO(storageEvent.timeConfig?.startIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
                end: DateTime.fromISO(storageEvent.timeConfig?.endIso ?? getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
                isCalendarEvent: !!storageEvent.calendarEventId,
                isAllDay: false
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

        const { isAllDay, isCalendarEvent, start, end } = data;
        if (isAllDay) {
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

        // Phase 1: Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await transitionToNonCalendarEvent(initialEventState, timeRange);

        // Phase 2: Create the unscheduled event in storage.
        const newEvent: IPlannerEvent = {
            id: carryoverEventMetadata?.id ?? uuid.v4(),
            storageId: EStorageId.PLANNER_EVENT,
            value: title,
            listId: triggerDatestamp
        };
        savePlannerEventToStorage(newEvent);
        addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Phase 3: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 4: Close the modal and open the target start planner.
        closeModalOpenPlanner(isoToDatestamp(timeRange.startIso));
    }

    async function handleDelete(deleteTodayEvents: boolean = false) {
        if (!initialEventState) return;

        setLoading(true);

        let plannerEvent: IPlannerEvent | null = null;

        // Grab the planner event to delete, otherwise manually delete the calendar event.
        switch (initialEventState.eventType) {
            case EEventType.CALENDAR_ALL_DAY: {
                const { calendarEvent } = initialEventState;

                await Calendar.deleteEventAsync(calendarEvent.id);
                untrackLoadedDatestamps([getCalendarEventTimeRange(calendarEvent)]);

                break;
            }
            case EEventType.CALENDAR_MULTI_DAY: {
                plannerEvent = initialEventState.endPlannerEvent ?? initialEventState.startPlannerEvent;

                if (!plannerEvent) {
                    // No events exist in storage. Manually delete the calendar event here.
                    const { calendarEvent } = initialEventState;
                    await Calendar.deleteEventAsync(calendarEvent.id);

                    untrackLoadedDatestamps([getCalendarEventTimeRange(calendarEvent)]);
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

        router.back();
    }

    // =======================
    //  Side Effect Functions
    // =======================

    function handleDateRangeChange(date: DateTime, selectorMode: EDateFieldType) {
        if (selectorMode === EDateFieldType.START_DATE) {
            // Enforce end is later than start.
            if (end.toMillis() < date.toMillis()) {
                setValue('end', date);
            }

        } else {
            // Enforce start is earlier than end.
            if (date.toMillis() < start.toMillis()) {
                setValue('start', date);
            }
        }
    }

    function handleAllDayChange(newAllDay: boolean) {
        if (!newAllDay) {
            // No important events that are non-all-day.
            setValue('isImportant', false);
        };

        // Start and end at midnight for all-day events.
        setValue("start", start.startOf("day"));
        setValue("end", end.startOf("day"));
    }

    function handleCalendarEventChange(newIsCalendarEvent: boolean) {
        if (newIsCalendarEvent) return;

        // No all day option for non-calendar events.
        setValue("isAllDay", false);
    }

    // ==================
    //  Helper Functions
    // ==================

    async function saveAllDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const calendarId = getNewCalendarId(data);
        const { endIso } = timeRange;

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const calendarEventDetails = buildCalendarEventDetails(data);
        const { calendarEventId, wasAllDayEvent, affectedDateRanges } =
            await transitionToAllDayCalendarEvent(initialEventState, timeRange, calendarId);

        // Special Case: Ensure correct format for iOS all-day creation.
        if (!wasAllDayEvent) {
            calendarEventDetails.endDate = shiftEndDateToStartOfNextDay(endIso);
        }

        // Phase 2: Update the device calendar and reload the calendar to the jotai store.
        await upsertCalendarEventToDevice(calendarEventId, calendarEventDetails, wasAllDayEvent, calendarId);

        // Phase 3: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 4: Close the modal and open the target start planner.
        closeModalOpenPlanner(isoToDatestamp(timeRange.startIso));
    }

    async function saveSingleDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const calendarId = getNewCalendarId(data);
        const { startIso } = timeRange;

        const targetDatestamp = isoToDatestamp(startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);
        const eventDetails = buildCalendarEventDetails(data);

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const {
            carryoverEventMetadata,
            calendarEventId,
            affectedDateRanges,
            wasAllDayEvent
        } = await transitionToSingleDayCalendarEvent(initialEventState, timeRange, calendarId);

        // Phase 2: Update the device calendar with the new event.
        const finalCalendarId = await upsertCalendarEventToDevice(calendarEventId, eventDetails, wasAllDayEvent, calendarId);

        // Phase 3: Create the event in storage.
        const newEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata?.id);
        newEvent.calendarEventId = finalCalendarId;
        savePlannerEventToStorage(newEvent);
        addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Phase 4: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 5: Close the modal and open the target start planner.
        closeModalOpenPlanner(targetDatestamp);
    }

    async function saveNonCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const targetDatestamp = isoToDatestamp(timeRange.startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);

        // Phase 1: Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await transitionToNonCalendarEvent(initialEventState, timeRange);

        // Phase 2: Create the event in storage.
        const newEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata?.id);
        savePlannerEventToStorage(newEvent);
        addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Phase 3: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 4: Close the modal and open the target start planner.
        closeModalOpenPlanner(targetDatestamp);
    }

    async function saveMultiDayCalendarEvent(data: TFormData) {
        if (!initialEventState) return;

        const { start, end } = data;
        const timeRange = getDateRangeFromValues(start, end);
        const calendarId = getNewCalendarId(data);
        const { startIso, endIso } = timeRange;

        const targetStartDatestamp = isoToDatestamp(startIso);
        const targetStartPlanner = getPlannerFromStorageByDatestamp(targetStartDatestamp);
        const targetEndDatestamp = isoToDatestamp(endIso);
        const targetEndPlanner = getPlannerFromStorageByDatestamp(targetEndDatestamp);

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const {
            carryoverEventMetadata,
            calendarEventId,
            affectedDateRanges,
            wasAllDayEvent
        } = await transitionToMultiDayCalendarEvent(initialEventState, timeRange, calendarId);

        // Phase 2: Update the device calendar with the new event.
        const eventDetails = buildCalendarEventDetails(data);
        const finalCalendarId = await upsertCalendarEventToDevice(calendarEventId, eventDetails, wasAllDayEvent, calendarId);

        // Phase 3: Create the start and end events and link them together.
        const startEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata[ECarryoverEventType.START_EVENT]?.id);
        const endEvent = upsertFormDataToPlannerEvent(data, carryoverEventMetadata[ECarryoverEventType.END_EVENT]?.id);

        startEvent.timeConfig!.startEventId = startEvent.id;
        startEvent.timeConfig!.endEventId = endEvent.id;

        endEvent.timeConfig!.startEventId = startEvent.id;
        endEvent.timeConfig!.endEventId = endEvent.id;

        startEvent.calendarEventId = finalCalendarId;
        endEvent.calendarEventId = finalCalendarId;

        endEvent.listId = targetEndDatestamp;

        savePlannerEventToStorage(startEvent);
        savePlannerEventToStorage(endEvent);
        addEventToPlanner(startEvent, targetStartPlanner, carryoverEventMetadata[ECarryoverEventType.START_EVENT]);
        addEventToPlanner(endEvent, targetEndPlanner, carryoverEventMetadata[ECarryoverEventType.END_EVENT]);

        // Phase 4: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 5: Close the modal and open the target start planner.
        closeModalOpenPlanner(targetStartDatestamp);
    }

    // ---------- Miscellaneous Helpers ----------

    function closeModalOpenPlanner(targetDatestamp: string) {
        router.replace(`/planners/${targetDatestamp}`);
    }

    function buildCalendarEventDetails(data: TFormData): Partial<Calendar.Event> {
        const { title, isAllDay, start, end } = data;
        const { startIso, endIso } = getDateRangeFromValues(start, end);
        return {
            title,
            startDate: startIso,
            endDate: endIso,
            allDay: isAllDay
        };
    }

    function upsertFormDataToPlannerEvent(formData: TFormData, previousStorageId?: string): IPlannerEvent {
        const { title, start, end, isAllDay } = formData;
        const { startIso, endIso } = getDateRangeFromValues(start, end);
        return {
            id: previousStorageId ?? uuid.v4(),
            listId: isoToDatestamp(startIso),
            value: title,
            timeConfig: {
                startIso,
                endIso,
                allDay: isAllDay,
                calendarId: getNewCalendarId(formData)
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
        calendarEventId: string | undefined,
        eventDetails: Partial<Calendar.Event>,
        wasAllDayEvent: boolean,
        calendarId: string
    ): Promise<string> {
        if (calendarEventId) {
            if (wasAllDayEvent && !eventDetails.allDay) {
                // Special Case: Need to delete the all-day event and create a new event.
                await Calendar.deleteEventAsync(calendarEventId);
                return await Calendar.createEventAsync(calendarId, eventDetails);
            }
            await Calendar.updateEventAsync(calendarEventId, eventDetails, { futureEvents: true });
            return calendarEventId;
        } else {
            return await Calendar.createEventAsync(calendarId, eventDetails);
        }
    }

    function getDateRangeFromValues(startDate: DateTime, endDate: DateTime) {
        return { startIso: startDate.toUTC().toISO()!, endIso: endDate.toUTC().toISO()! };
    }

    function addEventToPlanner(event: IPlannerEvent, targetPlanner: TPlanner, previousEventMetadata?: TCarryoverEventMetadata) {
        const targetIndex = previousEventMetadata?.index ?? targetPlanner.eventIds.length;
        const newPlanner = updatePlannerEventIndexWithChronologicalCheck(targetPlanner, targetIndex, event);
        savePlannerToStorage(newPlanner);
    }

    function getNewCalendarId(formData: TFormData) {
        return formData.isImportant ? importantCalendar!.id : primaryCalendar!.id
    }

    // ================
    //  User Interface
    // ================

    return (
        <Modal
            title=''
            primaryButtonConfig={{
                onClick: handleSubmit(handleSaveFormData),
                disabled: !isValid || loading
            }}
            deleteButtonConfig={{ actions: deleteActions }}
            onClose={() => router.back()}
        >
            <Form fieldSets={formFields} control={control} />
        </Modal>
    )
};

export default PlannerEventTimeModal;