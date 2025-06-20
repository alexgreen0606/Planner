import Form from "@/components/form";
import Modal from "@/components/modal";
import { useTextfieldItemAs } from "@/hooks/useTextfieldItemAs";
import { NULL } from "@/lib/constants/generic";
import { EFormFieldType } from "@/lib/enums/EFormFieldType";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { IFormField } from "@/lib/types/form/IFormField";
import { IListItem } from "@/lib/types/listItems/core/TListItem";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { deletePlannerEvents, getPlannerFromStorage, savePlannerEvent } from "@/storage/plannerStorage";
import { getCalendarEventById } from "@/utils/calendarUtils";
import { getIsoRoundedDown5Minutes } from "@/utils/dateUtils";
import { generateSortId, sanitizeList } from "@/utils/listUtils";
import { generateSortIdByTime, generateTimeIconConfig, sanitizePlanner } from "@/utils/plannerUtils";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DateTime } from 'luxon';
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export const TIME_MODAL_PATHNAME = '(modals)/timeModal/';

type ModalParams = {
    eventId: string; // NULL for new events
    eventValue: string; // More up-to-date than from storage
    datestamp: string; // Planner key that triggered the modal open
    sortId: string;
};

type FormData = {
    title: string;
    timeRange: {
        startIso: string;
        endIso: string;
    };
    isCalendarEvent: boolean;
    allDay: boolean;
}

const TimeModal = () => {
    const { eventId, eventValue, datestamp, sortId } = useLocalSearchParams<ModalParams>();
    const [_, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const router = useRouter();

    const [planEvent, setPlanEvent] = useState<IPlannerEvent | null>(null);

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

    // Load in the event from storage or the calendar.
    useEffect(() => {
        const loadCalendarEventFallback = async () => {
            const calEvent = await getCalendarEventById(eventId, datestamp);
            if (!calEvent) return;

            setPlanEvent({
                ...calEvent,
                calendarId: calEvent.id,
                status: EItemStatus.EDIT
            });
        }

        const newValue = eventValue === NULL ? '' : eventValue;

        // Handle new events.
        if (eventId === NULL) {
            setPlanEvent({
                id: uuid.v4(),
                sortId: Number(sortId),
                status: EItemStatus.NEW,
                listId: datestamp,
                value: newValue
            });
            return;
        }

        const planner = getPlannerFromStorage(datestamp);
        const event = planner.events.find(e => e.id === eventId);

        // If the event ID was not found in the planner, fallback to a device calendar search.
        if (!event) {
            loadCalendarEventFallback();
            return;
        }

        setPlanEvent({ ...event, value: newValue, status: EItemStatus.EDIT });
    }, [eventId]);

    // Sync the form data every time the planEvent changes.
    useEffect(() => {
        if (!planEvent) return;

        const nowTimeOfDayWithPlannerDate = getIsoRoundedDown5Minutes(planEvent.listId);
        reset({
            title: planEvent.value,
            timeRange: planEvent.timeConfig
                ? {
                    startIso: planEvent.timeConfig.startTime,
                    endIso: planEvent.timeConfig.endTime
                }
                : {
                    startIso: nowTimeOfDayWithPlannerDate,
                    endIso: nowTimeOfDayWithPlannerDate
                },
            allDay: Boolean(planEvent.timeConfig?.allDay),
            isCalendarEvent: Boolean(planEvent.calendarId)
        });

    }, [planEvent, reset]);

    // ------------- Utility Functions -------------

    async function handleSave(data: FormData) {
        if (!planEvent) return;

        const { title, timeRange, isCalendarEvent, allDay } = data;
        const { startIso, endIso } = timeRange;
        if (!startIso || !endIso) return;

        // TODO: update listId accordingly

        const updatedEvent = {
            ...planEvent,
            timeConfig: {
                allDay,
                startTime: startIso,
                endTime: endIso
            },
            value: title
        } as IPlannerEvent;

        if (isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedEvent.calendarId = 'NEW';
        }

        if (allDay && !planEvent.timeConfig?.allDay) {
            // Special Case: During all-day creation, the end date must shift to the start of the next day.
            const endDate = DateTime.fromISO(endIso);
            const startOfNextDay = endDate
                .plus({ days: 1 })
                .startOf('day')
                .toUTC()
                .toISO();
            updatedEvent.timeConfig!.endTime = startOfNextDay!;
        }

        const savedEvent = await savePlannerEvent(updatedEvent);
        const currentPlanner = getPlannerFromStorage(datestamp);

        // Replace ID is not needed here. Any matching event with a different ID was already removed
        // in the savePlannerEvent function.
        const plannerWithEvent = sanitizePlanner(currentPlanner.events, savedEvent);

        // Place a new textfield below the saved event.
        const newTextfieldSortId = generateSortId(savedEvent.sortId, plannerWithEvent);
        const newTextfield: IListItem = {
            id: uuid.v4(),
            sortId: newTextfieldSortId,
            status: EItemStatus.NEW,
            listId: datestamp,
            value: ''
        };

        setTextfieldItem(newTextfield);
        router.back();
    }

    async function handleUnschedule() {
        if (!planEvent) return;

        const updatedItem = { ...planEvent, listId: datestamp };
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;

        // TODO: need a new function for this. It's too complex and different. Need to pass the timeConfig and everything
        // to be analyzed before deleting it.
        
        await savePlannerEvent(updatedItem, planEvent.calendarId);

        setTextfieldItem(updatedItem);
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
            trigger: !isEditMode
        }],
        [{
            name: 'isCalendarEvent',
            type: EFormFieldType.CHECKBOX,
            label: 'Add to Calendar',
            defaultValue: false
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
                hidden: !isEditMode,
                optionLabels: ['Delete Event', 'Unschedule Event'],
                optionHandlers: [handleDelete, handleUnschedule]
            }}
            onClose={() => router.back()}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    );
}

export default TimeModal;