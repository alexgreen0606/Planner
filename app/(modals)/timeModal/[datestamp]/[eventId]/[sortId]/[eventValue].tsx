import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { userAccessAtom } from "@/atoms/userAccess";
import Form from "@/components/form";
import { SelectorMode } from "@/components/form/fields/TimeRangeSelector";
import Modal from "@/components/modal";
import { useTextfieldItemAs } from "@/hooks/useTextfieldItemAs";
import { NULL } from "@/lib/constants/generic";
import { EAccess } from "@/lib/enums/EAccess";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { TCalendarEventChip } from "@/lib/types/calendar/TCalendarEventChip";
import { IFormField } from "@/lib/types/form/IFormField";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { deletePlannerEvents, getPlannerFromStorage, saveEventToPlanner, savePlannerEvent, unschedulePlannerEvent } from "@/storage/plannerStorage";
import { getIsoRoundedDown5Minutes, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { generateSortId } from "@/utils/listUtils";
import { sanitizePlanner } from "@/utils/plannerUtils";
import { saveCalendarChip, saveCalendarEventToPlanner, saveTimedEventToPlanner } from "@/utils/timeModalUtils";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { DateTime } from 'luxon';
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export enum EventSourceType {
    CALENDAR_CHIP = 'CALENDAR_CHIP',
    PLANNER_EVENT = 'PLANNER_EVENT',
    NEW = 'NEW'
}

type ModalParams = {
    eventId: string; // NULL for new events
    eventValue: string; // More up-to-date than from storage
    datestamp: string; // Planner key that triggered the modal open
    sortId: string;
};

export type FormData = {
    title: string;
    timeRange: {
        startIso: string;
        endIso: string;
    };
    isCalendarEvent: boolean;
    allDay: boolean;
};

export type InitialEventState =
    | { type: EventSourceType.CALENDAR_CHIP; event: TCalendarEventChip }
    | { type: EventSourceType.PLANNER_EVENT; event: IPlannerEvent }
    | { type: EventSourceType.NEW; event?: never, landingSortId: number };

export const TIME_MODAL_PATHNAME = '(modals)/timeModal/';

const TimeModal = () => {
    const { eventId, eventValue, datestamp, sortId } = useLocalSearchParams<ModalParams>();
    const [_, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const mountedDatestamps = useAtomValue(mountedDatestampsAtom);
    const calendarData = useAtomValue(calendarEventDataAtom);
    const userAccess = useAtomValue(userAccessAtom);
    const router = useRouter();

    const [initialEventData, setInitialEventData] = useState<InitialEventState | null>(null);

    const {
        control,
        watch,
        reset,
        formState: { isValid },
        handleSubmit
    } = useForm<FormData>();

    const isAllDay = watch('allDay');
    const isCalendarEvent = watch('isCalendarEvent');

    const isEditMode = eventId !== NULL;
    const isChipModal = sortId === NULL;

    // Build the initial form data.
    useEffect(() => {
        let eventDatestampOrigin = datestamp;

        // Calendar Chip.
        if (sortId === NULL) {
            const chip = calendarData.chipsMap[datestamp].flat().find(chip => chip.event.id === eventId)!;
            const calEvent = chip.event;

            // If the chip isn't all day (multi-day chips), continue on to load the 
            if (calEvent.allDay) {
                setInitialEventData({
                    type: EventSourceType.CALENDAR_CHIP,
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
            }
        }

        const newValue = eventValue === NULL ? '' : eventValue;
        const nowTimePlannerDateIso = getIsoRoundedDown5Minutes(datestamp);

        // New Event.
        if (eventId === NULL) {
            setInitialEventData({
                type: EventSourceType.NEW,
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

        const planner = getPlannerFromStorage(eventDatestampOrigin);
        const event = planner.events.find(e => e.id === eventId)!;

        // Existing event.
        setInitialEventData({
            type: EventSourceType.PLANNER_EVENT,
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

    // ------------- Utility Functions -------------

    async function handleSave(data: FormData) {
        if (!initialEventData) return;

        const { timeRange: { startIso }, isCalendarEvent, allDay } = data;

        // Save event chips.
        if (allDay) {
            await saveCalendarChip(data, initialEventData);
            setTextfieldItem(null);
            router.back();
            return;
        }

        let finalSortId;

        if (isCalendarEvent) {
            finalSortId = await saveCalendarEventToPlanner(data, initialEventData);
        } else {
            finalSortId = await saveTimedEventToPlanner(data, initialEventData);
        }

        const targetDatestamp = isoToDatestamp(startIso);
        const isTargetDatestampMounted = mountedDatestamps.all.includes(targetDatestamp);

        // Phase 4: Create a new textfield below the saved item.
        if (!isChipModal && isTargetDatestampMounted && finalSortId) {
            const targetPlanner = getPlannerFromStorage(targetDatestamp);
            const newTextfieldSortId = generateSortId(finalSortId, targetPlanner.events);
            setTextfieldItem({
                id: uuid.v4(),
                listId: targetDatestamp,
                sortId: newTextfieldSortId,
                status: EItemStatus.NEW,
                value: ''
            });

            router.replace(targetDatestamp === getTodayDatestamp() ? '/' : '/planners');
            return;
        }

        setTextfieldItem(null);
        router.back();
    }

    async function handleUnschedule() {
        if (!planEvent) return;

        await unschedulePlannerEvent(planEvent);

        setTextfieldItem(null);
        router.back();
    }

    async function handleDelete() {
        if (!planEvent) return;

        await deletePlannerEvents([planEvent]);

        setTextfieldItem(null);
        router.back();
    }

    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            placeholder: 'Title',
            rules: { required: true },
            trigger: eventValue === NULL
        }],
        [{
            name: 'timeRange',
            type: EFormFieldType.TIME_RANGE,
            defaultValue: {
                startIso: getIsoRoundedDown5Minutes(),
                endIso: getIsoRoundedDown5Minutes()
            },
            multiDay: isCalendarEvent,
            allDay: isAllDay,
            trigger: !isEditMode ? SelectorMode.START_TIME : undefined
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

    return (
        <Modal
            title={isEditMode ? 'Edit Event' : 'Create Event'}
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSubmit(handleSave),
                disabled: !isValid
            }}
            deleteButtonConfig={{
                label: 'Unschedule',
                optionLabels: ['Delete Event', 'Unschedule Event'],
                optionHandlers: [handleDelete, handleUnschedule],
                hidden: !isEditMode
            }}
            onClose={() => router.back()}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    );
}

export default TimeModal;