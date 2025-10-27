import { calendarMapAtom, primaryCalendarAtom } from "@/atoms/calendarAtoms";
import { untrackLoadedDatestampsAtom } from "@/atoms/loadedDatestampsAtom";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import Modal from "@/components/Modal";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { NULL } from "@/lib/constants/generic";
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
import { View } from "react-native";
import { useMMKV } from "react-native-mmkv";

// ✅ 

type TEventModalProps = {
    isViewMode?: boolean;
}

type TEventModalParams = {
    eventId: string;

    // Planner key that triggered the modal open. Not needed for view-mode
    triggerDatestamp: string;
};

type TFormData = {
    title: string;
    start: DateTime;
    end: DateTime;
    isCalendarEvent: boolean;
    isAllDay: boolean;
    calendarType: string;
};

const EventModal = ({ isViewMode }: TEventModalProps) => {
    const { eventId, triggerDatestamp } = useLocalSearchParams<TEventModalParams>();
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
            start: DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
            end: DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp))!,
            isCalendarEvent: false,
            isAllDay: false,
            calendarType: 'Standard'
        }
    });

    const untrackLoadedDatestamps = useSetAtom(untrackLoadedDatestampsAtom);
    const primaryCalendar = useAtomValue(primaryCalendarAtom);
    const calendarMap = useAtomValue(calendarMapAtom);
    const userAccess = useAtomValue(userAccessAtom);

    const { onCloseTextfield } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const [initialEventState, setInitialEventState] = useState<TInitialEventMetadata | null>(null);
    const [isInitializingForm, setIsInitializingForm] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const calendarTypeOptions = useMemo(() => {
        const titles = Array.from(
            new Set(
                Object.values(calendarMap).reduce<string[]>((acc, cal) => {
                    if (cal.allowsModifications) {
                        acc.push(cal.title === "Calendar" ? "Standard" : cal.title);
                    }
                    return acc;
                }, [])
            )
        );

        const standardIndex = titles.indexOf("Standard");
        if (standardIndex > 0) {
            titles.splice(standardIndex, 1);
            titles.unshift("Standard");
        }

        return titles;
    }, [calendarMap]);

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
    const calendarType = watch('calendarType');
    const start = watch('start');
    const end = watch('end');

    const modalColor = calendarMap[calendarType]?.color ?? 'systemBlue';
    const modalIcon = calendarIconMap[calendarType] ?? 'calendar';
    const hideEndDateField = isViewMode && isAllDay && start.toISODate() === end.toISODate();

    const formFields: TFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            label: 'Event Title',
            disabled: isViewMode,
            iconName: modalIcon,
            iconColor: modalColor,
            rules: { required: true },
            focusTrigger: isLoading ? false : title.length === 0
        }],
        [{
            name: 'start',
            label: 'Start',
            type: EFormFieldType.DATE,
            showTime: !isAllDay,
            color: modalColor,
            onHandleSideEffects: (newStart: DateTime) =>
                handleDateRangeChange(newStart, EDateFieldType.START_DATE),
            disabled: isViewMode
        },
        {
            name: 'end',
            label: 'End',
            type: EFormFieldType.DATE,
            showTime: !isAllDay,
            color: modalColor,
            invisible: !isCalendarEvent || hideEndDateField,
            onHandleSideEffects: (newEnd: DateTime) =>
                handleDateRangeChange(newEnd, EDateFieldType.END_DATE),
            disabled: isViewMode
        }],
        [{
            name: 'isCalendarEvent',
            type: EFormFieldType.CHECKBOX,
            label: 'Calendar',
            color: modalColor,
            invisible: !userAccess.get(EAccess.CALENDAR) || !primaryCalendar || isViewMode,
            onHandleSideEffects: handleCalendarEventChange,
            iconName: 'calendar'
        },
        {
            name: 'isAllDay',
            type: EFormFieldType.CHECKBOX,
            label: 'All Day',
            color: modalColor,
            invisible: !isCalendarEvent || isViewMode,
            onHandleSideEffects: handleAllDayChange,
            iconName: 'note'
        }],
        [{
            name: 'calendarType',
            label: 'Type',
            type: EFormFieldType.PICKER,
            options: calendarTypeOptions,
            color: modalColor,
            invisible: isViewMode || !isCalendarEvent,
            floating: calendarTypeOptions.length <= 3,
            width: 360
        }]
    ];

    // Get the initial event state.
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
                    calendarType: calendarEvent.calendarId === primaryCalendar?.id ? 'Standard' : calendarMap[calendarEvent.calendarId]?.title ?? 'Standard'
                });

                setIsLoading(false);
                setIsInitializingForm(false);
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

            setIsLoading(false);
            setIsInitializingForm(false);
        }

        onCloseTextfield();
        buildFormData();
    }, []);

    // ================
    //  Event Handlers
    // ================

    async function handleSaveFormData(formData: TFormData) {
        if (!initialEventState) return;

        setIsLoading(true);

        const { isAllDay, isCalendarEvent } = formData;
        if (isAllDay) {
            await saveAllDayCalendarEvent(formData);
        } else if (isCalendarEvent) {
            if (getIsRangeMultiDay(getDateRangeFormData(formData))) {
                await saveMultiDayCalendarEvent(formData);
            } else {
                await saveSingleDayCalendarEvent(formData);
            }
        } else {
            await saveNonCalendarEvent(formData);
        }
    }

    async function handleUnschedule(formData: TFormData) {
        if (!initialEventState || triggerDatestamp === NULL) return;

        const { title } = formData;
        const timeRange = getDateRangeFormData(formData);
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

        setIsLoading(true);

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
        if (!newAllDay) return;

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

    async function saveAllDayCalendarEvent(formData: TFormData) {
        if (!initialEventState) return;

        const timeRange = getDateRangeFormData(formData);
        const calendarId = getCalendarIdFromFormData(formData);
        const { endIso } = timeRange;

        // Phase 1: Handle the initial event, extracting carryover data and deleting stale data.
        const calendarEventDetails = getCalendarEventDetailsFromFormData(formData);
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

    async function saveSingleDayCalendarEvent(formData: TFormData) {
        if (!initialEventState) return;

        const timeRange = getDateRangeFormData(formData);
        const calendarId = getCalendarIdFromFormData(formData);
        const { startIso } = timeRange;

        const targetDatestamp = isoToDatestamp(startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);
        const eventDetails = getCalendarEventDetailsFromFormData(formData);

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
        const newEvent = upsertFormDataToPlannerEvent(formData, carryoverEventMetadata?.id);
        newEvent.calendarEventId = finalCalendarId;
        savePlannerEventToStorage(newEvent);
        addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Phase 4: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 5: Close the modal and open the target start planner.
        closeModalOpenPlanner(targetDatestamp);
    }

    async function saveNonCalendarEvent(formData: TFormData) {
        if (!initialEventState) return;

        const timeRange = getDateRangeFormData(formData);
        const targetDatestamp = isoToDatestamp(timeRange.startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);

        // Phase 1: Extract carryover data and clean up any stale data.
        const { affectedDateRanges, carryoverEventMetadata } =
            await transitionToNonCalendarEvent(initialEventState, timeRange);

        // Phase 2: Create the event in storage.
        const newEvent = upsertFormDataToPlannerEvent(formData, carryoverEventMetadata?.id);
        savePlannerEventToStorage(newEvent);
        addEventToPlanner(newEvent, targetPlanner, carryoverEventMetadata);

        // Phase 3: Untrack the affected datestamps to allow for re-loads on mount.
        untrackLoadedDatestamps(affectedDateRanges);

        // Phase 4: Close the modal and open the target start planner.
        closeModalOpenPlanner(targetDatestamp);
    }

    async function saveMultiDayCalendarEvent(formData: TFormData) {
        if (!initialEventState) return;

        const timeRange = getDateRangeFormData(formData);
        const calendarId = getCalendarIdFromFormData(formData);
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
        const eventDetails = getCalendarEventDetailsFromFormData(formData);
        const finalCalendarId = await upsertCalendarEventToDevice(calendarEventId, eventDetails, wasAllDayEvent, calendarId);

        // Phase 3: Create the start and end events and link them together.
        const startEvent = upsertFormDataToPlannerEvent(formData, carryoverEventMetadata[ECarryoverEventType.START_EVENT]?.id);
        const endEvent = upsertFormDataToPlannerEvent(formData, carryoverEventMetadata[ECarryoverEventType.END_EVENT]?.id);

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

    // ----------Form Data Getters ----------

    function getCalendarEventDetailsFromFormData(formData: TFormData): Partial<Calendar.Event> {
        const { title, isAllDay } = formData;
        const { startIso, endIso } = getDateRangeFormData(formData);
        return {
            title,
            startDate: startIso,
            endDate: endIso,
            allDay: isAllDay
        };
    }

    function getDateRangeFormData(formData: TFormData) {
        return { startIso: formData.start.toUTC().toISO()!, endIso: formData.end.toUTC().toISO()! };
    }

    function getCalendarIdFromFormData(formData: TFormData): string {
        return calendarMap[formData.calendarType].id ?? primaryCalendar!.id
    }

    // ---------- Miscellaneous Helpers ----------

    function closeModalOpenPlanner(targetDatestamp: string) {
        router.replace(`/planners/${targetDatestamp}`);
    }

    function upsertFormDataToPlannerEvent(formData: TFormData, previousStorageId?: string): IPlannerEvent {
        const { title, isAllDay } = formData;
        const { startIso, endIso } = getDateRangeFormData(formData);
        return {
            id: previousStorageId ?? uuid.v4(),
            listId: isoToDatestamp(startIso),
            value: title,
            timeConfig: {
                startIso,
                endIso,
                allDay: isAllDay,
                calendarId: getCalendarIdFromFormData(formData)
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

    function addEventToPlanner(event: IPlannerEvent, targetPlanner: TPlanner, previousEventMetadata?: TCarryoverEventMetadata) {
        const targetIndex = previousEventMetadata?.index ?? targetPlanner.eventIds.length;
        const newPlanner = updatePlannerEventIndexWithChronologicalCheck(targetPlanner, targetIndex, event);
        savePlannerToStorage(newPlanner);
    }

    // ================
    //  User Interface
    // ================

    return (
        <Modal
            primaryButtonConfig={{
                onClick: handleSubmit(handleSaveFormData),
                disabled: !isValid || isLoading,
                color: modalColor
            }}
            deleteButtonConfig={{ actions: deleteActions }}
            onClose={() => router.back()}
            isViewMode={isViewMode}
        >
            <View style={{ minHeight: isViewMode ? undefined : 400 }}>
                {!isInitializingForm && (
                    <Form fieldSets={formFields} control={control} />
                )}

            </View>
        </Modal>
    )
};

export default EventModal;