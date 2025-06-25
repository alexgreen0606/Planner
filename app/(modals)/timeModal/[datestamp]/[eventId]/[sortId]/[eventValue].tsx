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
import { EListType } from "@/lib/enums/EListType";
import { IFormField } from "@/lib/types/form/IFormField";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { deletePlannerEvents, getPlannerFromStorage, savePlannerEvent, unschedulePlannerEvent } from "@/storage/plannerStorage";
import { getIsoRoundedDown5Minutes, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { generateSortId } from "@/utils/listUtils";
import { sanitizePlanner } from "@/utils/plannerUtils";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { DateTime } from 'luxon';
import { useEffect, useState } from "react";
import { Event as CalendarEvent } from 'expo-calendar';
import { useForm } from "react-hook-form";
import { calendarEventToPlannerEvent } from "@/utils/calendarUtils";

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

export const TIME_MODAL_PATHNAME = '(modals)/timeModal/';

const TimeModal = () => {
    const { eventId, eventValue, datestamp, sortId } = useLocalSearchParams<ModalParams>();
    const [_, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const mountedDatestamps = useAtomValue(mountedDatestampsAtom);
    const calendarData = useAtomValue(calendarEventDataAtom);
    const userAccess = useAtomValue(userAccessAtom);
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
    const isChipModal = sortId === NULL;

    // Load in the event from storage. Fallback to a calendar search if storage search fails.
    useEffect(() => {
        const formatCalendarEvent = async (currentList: IPlannerEvent[]) => {
            const calEvent = calendarData.chipsMap[datestamp].flat().find(chip => chip.event.id === eventId)!.event;
            if (!calEvent) return;

            // Convert the calendar event into a planner event to streamline the modal logic.
            const upperSortId = generateSortId(-1, currentList);
            const newEvent = calendarEventToPlannerEvent(calEvent, datestamp, upperSortId);
            setPlanEvent({
                ...newEvent,
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
                value: newValue,
                listType: EListType.PLANNER
            });
            return;
        }

        const planner = getPlannerFromStorage(datestamp);

        // The event is a chip. Fallback to a calendar search.
        if (sortId === NULL) {
            formatCalendarEvent(planner.events);
            return;
        }

        const event = planner.events.find(e => e.id === eventId);
        setPlanEvent({ ...event!, value: newValue, status: EItemStatus.EDIT });
    }, []);

    // Sync the form data every time the planEvent changes.
    useEffect(() => {
        if (!planEvent) return;

        const nowTimePlannerDateIso = getIsoRoundedDown5Minutes(planEvent.listId);
        const timeRange = {
            startIso: planEvent.timeConfig?.startIso ?? nowTimePlannerDateIso,
            endIso: planEvent.timeConfig?.endIso ?? nowTimePlannerDateIso,
        };

        reset({
            title: planEvent.value,
            timeRange,
            allDay: Boolean(planEvent.timeConfig?.allDay),
            isCalendarEvent: Boolean(planEvent.calendarId)
        });

    }, [planEvent, reset]);

    // ------------- Utility Functions -------------

    async function handleSave(data: FormData) {
        const { title, timeRange, isCalendarEvent, allDay } = data;
        const { startIso, endIso } = timeRange;
        if (!planEvent || !startIso || !endIso) return;

        const targetDatestamp = isoToDatestamp(startIso);
        const isTargetDatestampMounted = mountedDatestamps.all.includes(targetDatestamp);

        const updatedEvent: IPlannerEvent = {
            ...planEvent,
            listId: targetDatestamp,
            value: title,
            timeConfig: {
                allDay,
                startIso: startIso,
                endIso: endIso
            }
        };

        // Phase 1: Mark new calendar events for creation.
        if (isCalendarEvent && !planEvent.calendarId) {
            updatedEvent.calendarId = 'NEW';
        }

        // Phase 2: (Special Case) During all-day creation, the end date must shift to the start of the next day.
        if (allDay && !planEvent.timeConfig?.allDay) {
            const endDate = DateTime.fromISO(endIso);
            const startOfNextDay = endDate
                .plus({ days: 1 })
                .startOf('day')
                .toUTC()
                .toISO();
            updatedEvent.timeConfig!.endIso = startOfNextDay!;
        }

        // Phase 3: Save the event in both storage and the calendar (if needed).
        await savePlannerEvent(updatedEvent, planEvent);

        // Phase 4: Create a new textfield if possible.
        if (!isChipModal && isTargetDatestampMounted) {
            const targetPlanner = getPlannerFromStorage(targetDatestamp);

            // Replace ID is not needed here. Any matching event with a different ID was already removed
            // in the savePlannerEvent function.
            const plannerWithEvent = sanitizePlanner(targetPlanner.events, updatedEvent);

            // Place a new textfield below the saved event.
            const newTextfieldSortId = generateSortId(updatedEvent.sortId, plannerWithEvent);
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