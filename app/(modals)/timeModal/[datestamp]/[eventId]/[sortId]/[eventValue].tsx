import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import Modal from "@/components/modal";
import { useTextfieldItemAs } from "@/hooks/useTextfieldItemAs";
import { NULL } from "@/lib/constants/generic";
import { EAccess } from "@/lib/enums/EAccess";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListItemType } from "@/lib/enums/EListType";
import { ETimeSelectorMode } from "@/lib/enums/ETimeSelectorMode";
import { TCalendarEventChip } from "@/lib/types/calendar/TCalendarEventChip";
import { IFormField } from "@/lib/types/form/IFormField";
import { TDateRange, IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventsFromStorageAndCalendar, getPlannerFromStorageByDatestamp, hideAndCloneRecurringEventInPlanner, upsertEventToStorage, savePlannerToStorage } from "@/storage/plannerStorage";
import { hasCalendarAccess } from "@/utils/accessUtils";
import { getPrimaryCalendarId, loadCalendarDataToStore } from "@/utils/calendarUtils";
import { getIsoFromNowTimeRoundedDown5Minutes, getTodayDatestamp, isoToDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { generateSortId, sortListWithUpsertItem } from "@/utils/listUtils";
import { mapCalendarEventToPlannerEvent } from "@/utils/map/mapCalenderEventToPlannerEvent";
import { getAllMountedDatestampsLinkedToDateRanges } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// ✅ 

type ModalParams = {
    eventId: string; // NULL for new events
    eventValue: string; // More up-to-date than from storage
    datestamp: string; // Planner key that triggered the modal open
    sortId: string;
};

// The type of component that triggered the modal open.
enum TriggerSource {
    ALL_DAY_CHIP = 'ALL_DAY_CHIP',
    MULTI_DAY_CHIP = 'MULTI_DAY_CHIP',
    PLANNER_EDIT = 'PLANNER_EDIT',
    PLANNER_NEW = 'PLANNER_NEW'
}

// The state of the event at time of modal open.
type TriggerState =
    | { sourceType: TriggerSource.ALL_DAY_CHIP; event: TCalendarEventChip }
    | { sourceType: TriggerSource.MULTI_DAY_CHIP; event: IPlannerEvent }
    | { sourceType: TriggerSource.PLANNER_EDIT; event: IPlannerEvent }
    | { sourceType: TriggerSource.PLANNER_NEW; event?: never, landingSortId: number };

type FormData = {
    title: string;
    timeRange: {
        startIso: string;
        endIso: string;
    };
    isCalendarEvent: boolean;
    allDay: boolean;
};

const TimeModal = () => {
    const mountedDatestamps = useAtomValue(mountedDatestampsAtom);
    const calendarData = useAtomValue(calendarEventDataAtom);
    const userAccess = useAtomValue(userAccessAtom);

    const { eventId, eventValue, datestamp: triggerDatestamp, sortId } = useLocalSearchParams<ModalParams>();
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const router = useRouter();

    const {
        control,
        watch,
        reset,
        formState: { isValid },
        handleSubmit,
        setValue
    } = useForm<FormData>();

    const [loading, setLoading] = useState(false);
    const [initialEventState, setInitialEventState] = useState<TriggerState | null>(null);

    const isAllDay = watch('allDay');
    const isCalendarEvent = watch('isCalendarEvent');
    const isEditMode = eventId !== NULL;

    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            rules: { required: true },
            trigger: eventValue === NULL
        }],
        [{
            name: 'timeRange',
            type: EFormFieldType.TIME_RANGE,
            defaultValue: {
                startIso: getIsoFromNowTimeRoundedDown5Minutes(),
                endIso: getIsoFromNowTimeRoundedDown5Minutes()
            },
            multiDay: isCalendarEvent,
            allDay: isAllDay,
            trigger: !isEditMode ? ETimeSelectorMode.START_TIME : undefined
        }],
        [{
            name: 'isCalendarEvent',
            type: EFormFieldType.CHECKBOX,
            label: 'Add to Calendar',
            defaultValue: false,
            hide: !userAccess.get(EAccess.CALENDAR)
        },
        {
            name: 'allDay',
            type: EFormFieldType.CHECKBOX,
            label: 'All Day',
            defaultValue: false,
            hide: !isCalendarEvent
        }]
    ];

    // Build the initial form data.
    useEffect(() => {
        let modalTriggerSourceType = TriggerSource.PLANNER_EDIT;
        let eventDatestampOrigin = triggerDatestamp;

        // Calendar Chip.
        if (sortId === NULL) {
            const chip = calendarData.chipsMap[triggerDatestamp].flat().find(chip => chip.event.id === eventId)!;
            const calEvent = chip.event;

            // If the chip isn't all day (multi-day chips), continue on to load the event from storage
            if (calEvent.allDay) {
                setInitialEventState({
                    sourceType: TriggerSource.ALL_DAY_CHIP,
                    event: chip
                });
                reset({
                    title: calEvent.title,
                    timeRange: {
                        startIso: calEvent.startDate as string,
                        endIso: calEvent.endDate as string
                    },
                    isCalendarEvent: true,
                    allDay: calEvent.allDay
                })
                return;
            } else {
                eventDatestampOrigin = isoToDatestamp(calEvent.startDate as string);
                modalTriggerSourceType = TriggerSource.MULTI_DAY_CHIP;
            }
        }

        const newValue = eventValue === NULL ? '' : eventValue;
        const nowTimePlannerDateIso = getIsoFromNowTimeRoundedDown5Minutes(triggerDatestamp);

        // New Event.
        if (eventId === NULL) {
            setInitialEventState({
                sourceType: TriggerSource.PLANNER_NEW,
                landingSortId: Number(sortId)
            });
            reset({
                title: newValue,
                timeRange: {
                    startIso: nowTimePlannerDateIso,
                    endIso: nowTimePlannerDateIso
                },
                isCalendarEvent: false,
                allDay: false
            });
            return;
        }

        const planner = getPlannerFromStorageByDatestamp(eventDatestampOrigin);
        const event = planner.events.find(e => e.id === eventId)!;

        // Existing event.
        setInitialEventState({
            sourceType: modalTriggerSourceType,
            event: event
        });
        reset({
            title: newValue,
            timeRange: {
                startIso: event.timeConfig?.startIso ?? nowTimePlannerDateIso,
                endIso: event.timeConfig?.endIso ?? nowTimePlannerDateIso
            },
            isCalendarEvent: Boolean(event.calendarId),
            allDay: Boolean(event.timeConfig?.allDay)
        });

    }, []);

    useEffect(() => {
        if (!isCalendarEvent) {
            setValue('allDay', false);
        }
    }, [isCalendarEvent]);

    // =======================
    // 1. Event Handlers
    // =======================

    async function handleSave(data: FormData) {
        if (!initialEventState) return;
        setLoading(true);

        const { allDay, isCalendarEvent } = data;

        if (allDay) {
            await saveAllDay(data);
        } else if (isCalendarEvent) {
            await saveCalendarEvent(data);
        } else {
            await saveGenericEvent(data);
        }
    }

    async function handleUnschedule(data: FormData) {
        if (!initialEventState) return;
        setLoading(true);

        const planner = getPlannerFromStorageByDatestamp(triggerDatestamp);
        const updatingDateRanges: TDateRange[] = [];

        let unscheduledEvent = buildUnscheduledEventFromInitialState(data, planner, updatingDateRanges);
        removeCalendarTimeLinkage(unscheduledEvent);

        planner.events = sortListWithUpsertItem(planner.events, unscheduledEvent);
        savePlannerToStorage(triggerDatestamp, planner);

        if (updatingDateRanges.length > 0) {
            const datestampsToReload = getAllMountedDatestampsLinkedToDateRanges(updatingDateRanges);
            await loadCalendarDataToStore(datestampsToReload);
        }

        closeModalNewTextfield(unscheduledEvent, planner.events);
    }

    async function handleDelete() {
        if (!initialEventState) return;
        setLoading(true);

        const { sourceType, event } = initialEventState;

        if (sourceType === TriggerSource.ALL_DAY_CHIP) {
            const calendarId = event.event.id;
            if (calendarId && hasCalendarAccess()) {
                await Calendar.deleteEventAsync(calendarId, { futureEvents: false });
                const datestamps = getAllMountedDatestampsLinkedToDateRanges([{
                    startIso: event.event.startDate as string,
                    endIso: event.event.endDate as string
                }]);
                await loadCalendarDataToStore(datestamps);
            }
        } else if (sourceType === TriggerSource.PLANNER_NEW) {
            closeModalBackNoTextfield();
        } else {
            await deletePlannerEventsFromStorageAndCalendar([event]);
        }

        closeModalBackNoTextfield();
    }

    // =======================
    // 2. Helper Functions
    // =======================

    async function saveAllDay(data: FormData) {
        const { endIso } = data.timeRange;

        const eventDetails = buildCalendarEventDetails(data);
        const { prevCalendarId, prevAllDay, updatingDateRanges } =
            await extractAllDayEventContext(initialEventState!, data.timeRange);

        if (!prevAllDay) {
            eventDetails.endDate = shiftEndDateToStartOfNextDay(endIso);
        }

        await upsertCalendarEvent(prevCalendarId, eventDetails);
        await reloadCalendarFromRanges(updatingDateRanges);

        closeModalMountedDateOrBack(eventDetails.startDate as string, eventDetails.endDate as string);
    }

    async function saveCalendarEvent(data: FormData) {
        const { timeRange } = data;
        const { startIso } = timeRange;

        const targetDatestamp = isoToDatestamp(startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);
        const eventDetails = buildCalendarEventDetails(data);

        const {
            savedEvent,
            prevCalendarId,
            updatingDateRanges,
        } = await extractCalendarEventContext(initialEventState!, data, targetPlanner);

        await upsertCalendarEvent(prevCalendarId, eventDetails);

        const updatedEvent = upsertEventToStorage(savedEvent, targetPlanner);
        await reloadCalendarFromRanges(updatingDateRanges);

        if (isMultiDay(timeRange)) {
            closeModalMountedDateOrBack(timeRange.startIso, timeRange.endIso);
        } else {
            closeModalNewTextfield(updatedEvent, targetPlanner.events);
        }
    }

    async function saveGenericEvent(data: FormData) {
        const { timeRange } = data;
        const targetDatestamp = isoToDatestamp(timeRange.startIso);
        const targetPlanner = getPlannerFromStorageByDatestamp(targetDatestamp);

        const {
            savedEvent,
            updatingDateRanges,
        } = await extractGenericEventContext(initialEventState!, data, targetPlanner);

        const updatedEvent = upsertEventToStorage(savedEvent, targetPlanner);
        await reloadCalendarFromRanges(updatingDateRanges);

        if (isMultiDay(timeRange)) {
            closeModalMountedDateOrBack(timeRange.startIso, timeRange.endIso);
        } else {
            closeModalNewTextfield(updatedEvent, targetPlanner.events);
        }
    }

    // ---------- Extractors ----------

    async function extractAllDayEventContext(
        initialState: TriggerState,
        currentRange: TDateRange
    ) {
        const updatingDateRanges: TDateRange[] = [currentRange];
        let prevCalendarId: string | undefined;
        let prevAllDay: boolean | undefined;

        switch (initialState.sourceType) {
            case TriggerSource.ALL_DAY_CHIP: {
                const event = initialState.event.event;
                prevCalendarId = event.id;
                prevAllDay = event.allDay;
                updatingDateRanges.push({
                    startIso: event.startDate as string,
                    endIso: event.endDate as string,
                });
                break;
            }
            case TriggerSource.MULTI_DAY_CHIP:
            case TriggerSource.PLANNER_EDIT: {
                const { calendarId, timeConfig } = initialState.event;
                prevCalendarId = calendarId;
                prevAllDay = timeConfig?.allDay;
                if (calendarId && timeConfig) {
                    updatingDateRanges.push({
                        startIso: timeConfig.startIso,
                        endIso: timeConfig.endIso,
                    });
                }
                await deletePlannerEventsFromStorageAndCalendar([initialState.event], true);
                break;
            }
        }

        return { prevCalendarId, prevAllDay, updatingDateRanges };
    }

    async function extractCalendarEventContext(
        initialState: TriggerState,
        data: FormData,
        planner: TPlanner
    ) {
        const { timeRange, title, allDay } = data;
        const { startIso, endIso } = timeRange;
        const updatingDateRanges: TDateRange[] = [timeRange];
        let savedEvent: IPlannerEvent;
        let prevCalendarId: string | undefined;

        switch (initialState.sourceType) {
            case TriggerSource.ALL_DAY_CHIP: {
                const { event } = initialState.event;
                savedEvent = {
                    id: event.id,
                    calendarId: event.id,
                    sortId: generateSortId(planner.eventIds, -1),
                    listType: EListItemType.PLANNER,
                    listId: isoToDatestamp(startIso),
                    value: title,
                    timeConfig: { allDay, startIso, endIso },
                    status: EItemStatus.STATIC,
                };
                updatingDateRanges.push({
                    startIso: event.startDate as string,
                    endIso: event.endDate as string,
                });
                prevCalendarId = event.id;
                break;
            }

            case TriggerSource.MULTI_DAY_CHIP:
            case TriggerSource.PLANNER_EDIT: {
                savedEvent = mergeFormDataToExistingEvent(data, initialState.event);
                const prevTimeConfig = initialState.event.timeConfig!;
                updatingDateRanges.push({
                    startIso: prevTimeConfig.startIso,
                    endIso: prevTimeConfig.endIso,
                });
                savedEvent = hideAndCloneRecurringEventInPlanner(savedEvent, planner, initialState.event);
                prevCalendarId = initialState.event.calendarId;
                break;
            }

            case TriggerSource.PLANNER_NEW: {
                savedEvent = {
                    id: "PLACEHOLDER",
                    sortId: initialState.landingSortId,
                    listType: EListItemType.PLANNER,
                    listId: isoToDatestamp(startIso),
                    value: title,
                    timeConfig: { allDay, startIso, endIso },
                    status: EItemStatus.STATIC,
                };
                break;
            }

            default:
                throw new Error("Unknown sourceType in extractCalendarEventContext");
        }

        return { savedEvent, prevCalendarId, updatingDateRanges };
    }

    async function extractGenericEventContext(
        initialState: TriggerState,
        data: FormData,
        planner: TPlanner
    ) {
        const { timeRange, title, allDay } = data;
        const { startIso, endIso } = timeRange;
        const updatingDateRanges: TDateRange[] = [timeRange];
        let savedEvent: IPlannerEvent;

        switch (initialState.sourceType) {
            case TriggerSource.ALL_DAY_CHIP: {
                const event = initialState.event.event;
                updatingDateRanges.push({
                    startIso: event.startDate as string,
                    endIso: event.endDate as string,
                });
                await Calendar.deleteEventAsync(event.id, { futureEvents: false });
                savedEvent = buildGenericPlannerEvent(
                    event.id,
                    generateSortId(planner.eventIds, -1),
                    title,
                    allDay,
                    startIso,
                    endIso,
                    isoToDatestamp(startIso)
                );
                break;
            }

            case TriggerSource.MULTI_DAY_CHIP:
            case TriggerSource.PLANNER_EDIT: {
                savedEvent = mergeFormDataToExistingEvent(data, initialState.event);
                const prevCalendarId = initialState.event.calendarId;
                const prevTimeConfig = initialState.event.timeConfig!;
                if (prevCalendarId) {
                    await Calendar.deleteEventAsync(prevCalendarId, { futureEvents: false });
                    updatingDateRanges.push({
                        startIso: prevTimeConfig.startIso,
                        endIso: prevTimeConfig.endIso,
                    });
                }
                delete savedEvent.calendarId;
                savedEvent = hideAndCloneRecurringEventInPlanner(savedEvent, planner, initialState.event);
                break;
            }

            case TriggerSource.PLANNER_NEW: {
                savedEvent = buildGenericPlannerEvent(
                    uuid.v4(),
                    initialState.landingSortId,
                    title,
                    allDay,
                    startIso,
                    endIso,
                    isoToDatestamp(startIso)
                );
                break;
            }

            default:
                throw new Error("Unknown sourceType in extractGenericEventContext");
        }

        return { savedEvent, updatingDateRanges };
    }

    // ---------- Builders ----------

    function buildCalendarEventDetails(data: FormData): Partial<Calendar.Event> {
        const { title, allDay, timeRange: { startIso, endIso } } = data;
        return {
            title,
            startDate: startIso,
            endDate: endIso,
            allDay,
        };
    }

    function buildGenericPlannerEvent(
        id: string,
        sortId: number,
        title: string,
        allDay: boolean,
        startIso: string,
        endIso: string,
        listId: string
    ): IPlannerEvent {
        return {
            id,
            sortId,
            listType: EListItemType.PLANNER,
            listId,
            value: title,
            timeConfig: { allDay, startIso, endIso },
            status: EItemStatus.STATIC,
        };
    }

    function buildUnscheduledEventFromInitialState(
        data: FormData,
        planner: TPlanner,
        updatingDateRanges: TDateRange[]
    ): IPlannerEvent {
        switch (initialEventState!.sourceType) {
            case TriggerSource.ALL_DAY_CHIP:
                return buildUnscheduledFromAllDayChip(data, planner, updatingDateRanges);
            case TriggerSource.PLANNER_EDIT:
            case TriggerSource.MULTI_DAY_CHIP:
                return buildUnscheduledFromPlannerEvent(data, planner, updatingDateRanges);
            default:
                throw new Error(`Invalid event source type in unschedulePlannerEvent.`);
        }
    }

    function buildUnscheduledFromAllDayChip(
        data: FormData,
        planner: TPlanner,
        updatingDateRanges: TDateRange[]
    ): IPlannerEvent {
        if (initialEventState?.sourceType !== TriggerSource.ALL_DAY_CHIP) {
            throw new Error('buildUnscheduledFromAllDayChip called but initial trigger was not all-day chip.')
        }

        const upperSortId = generateSortId(planner.eventIds, -1);

        let unscheduledEvent = mapCalendarEventToPlannerEvent(
            initialEventState.event.event,
            triggerDatestamp,
            planner.eventIds,
            undefined,
            upperSortId
        );
        unscheduledEvent = mergeFormDataToExistingEvent(data, unscheduledEvent);

        if (hasCalendarAccess()) {
            updatingDateRanges.push({
                startIso: initialEventState.event.event.startDate as string,
                endIso: initialEventState.event.event.endDate as string
            });
            void Calendar.deleteEventAsync(initialEventState!.event.event.id, { futureEvents: false });
        }

        return unscheduledEvent;
    }

    function buildUnscheduledFromPlannerEvent(
        data: FormData,
        planner: TPlanner,
        updatingDateRanges: TDateRange[]
    ): IPlannerEvent {
        if (
            !initialEventState ||
            ![TriggerSource.PLANNER_EDIT, TriggerSource.MULTI_DAY_CHIP].includes(initialEventState.sourceType)
        ) {
            throw new Error('buildUnscheduledFromPlannerEdit called but initial trigger was not a planner event.')
        }

        const initialEvent = initialEventState.event as IPlannerEvent;

        let unscheduledEvent: IPlannerEvent = {
            ...initialEvent,
            value: data.title
        };

        unscheduledEvent = hideAndCloneRecurringEventInPlanner(
            unscheduledEvent,
            planner,
            initialEvent
        );

        const prevCalendarId = initialEvent.calendarId;
        if (prevCalendarId && hasCalendarAccess()) {
            const prevTimeConfig = initialEvent.timeConfig!;
            updatingDateRanges.push({
                startIso: prevTimeConfig.startIso,
                endIso: prevTimeConfig.endIso
            });
            void Calendar.deleteEventAsync(prevCalendarId, { futureEvents: false });
        }

        return unscheduledEvent;
    }

    // ---------- Modal Close Handlers ----------

    function closeModalMountedDateOrBack(startIso: string, endIso: string) {
        if (!canUpdateTextfield()) return;

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
            setTextfieldItem(null);
            router.replace(startDatestamp === getTodayDatestamp() ? '/' : '/planners');
            return;
        }

        if (mountedDatestamps.all.includes(endDatestamp)) {
            // End of range is mounted.
            setTextfieldItem(null);
            router.replace(endDatestamp === getTodayDatestamp() ? '/' : '/planners');
            return;
        }

        closeModalBackNoTextfield();
    }

    function closeModalNewTextfield(event: IPlannerEvent, plannerEvents: IPlannerEvent[]) {
        if (!canUpdateTextfield()) return;

        if (mountedDatestamps.all.includes(event.listId)) {
            const newTextfieldSortId = generateSortId(plannerEvents, event.sortId);
            setTextfieldItem({
                id: uuid.v4(),
                listId: event.listId,
                sortId: newTextfieldSortId,
                status: EItemStatus.NEW,
                value: '',
            });

            router.replace(event.listId === getTodayDatestamp() ? '/' : '/planners');
        } else {
            closeModalBackNoTextfield();
        }
    }

    function closeModalBackNoTextfield() {
        if (!canUpdateTextfield()) return;

        setTextfieldItem(null);
        router.back();
    }

    function closeModalBackKeepTextfield() {
        router.back();
    }

    // ---------- Miscellaneous Helpers ----------

    function mergeFormDataToExistingEvent(formData: FormData, event: IPlannerEvent) {
        const { title, timeRange: { startIso, endIso }, allDay } = formData;
        return {
            ...event,
            listId: isoToDatestamp(startIso),
            value: title,
            timeConfig: {
                startIso,
                endIso,
                allDay
            }
        }
    }

    function shiftEndDateToStartOfNextDay(endIso: string): string {
        return DateTime.fromISO(endIso)
            .plus({ days: 1 })
            .startOf("day")
            .toUTC()
            .toISO()!;
    }

    function removeCalendarTimeLinkage(event: IPlannerEvent) {
        delete event.timeConfig;
        delete event.calendarId;
    }

    function isMultiDay(range: TDateRange): boolean {
        return isoToDatestamp(range.startIso) !== isoToDatestamp(range.endIso);
    }

    async function upsertCalendarEvent(
        calendarId: string | undefined,
        eventDetails: Partial<Calendar.Event>
    ) {
        if (calendarId) {
            await Calendar.updateEventAsync(calendarId, eventDetails, {
                futureEvents: false,
            });
        } else {
            const primaryCalendarId = await getPrimaryCalendarId();
            await Calendar.createEventAsync(primaryCalendarId, eventDetails);
        }
    }

    async function reloadCalendarFromRanges(ranges: TDateRange[]) {
        const affectedDates = getAllMountedDatestampsLinkedToDateRanges(ranges);
        await loadCalendarDataToStore(affectedDates);
    }

    function canUpdateTextfield() {
        if (
            initialEventState?.sourceType !== TriggerSource.PLANNER_NEW &&
            textfieldItem?.id !== eventId
        ) {
            closeModalBackKeepTextfield();
            return false;
        }

        return true;
    }

    // =======================
    // 3. UI
    // =======================

    return (
        <Modal
            title={isEditMode ? 'Edit Event' : 'Create Event'}
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSubmit(handleSave),
                disabled: !isValid || loading
            }}
            deleteButtonConfig={{
                label: 'Unschedule',
                optionLabels: ['Delete Event', 'Unschedule Event'],
                optionHandlers: [handleDelete, handleSubmit(handleUnschedule)],
                hidden: !isEditMode
            }}
            onClose={() => router.back()}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    );
}

export default TimeModal;