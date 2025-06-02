import Form from "@/components/form";
import Modal from "@/components/modal";
import { NULL } from "@/constants/generic";
import { EFormFieldType } from "@/enums/EFormFieldType";
import { EItemStatus } from "@/enums/EItemStatus";
import { useTextfieldData } from "@/hooks/useTextfieldData";
import { getPlannerFromStorage } from "@/storage/plannerStorage";
import { IFormField } from "@/types/form/IFormField";
import { IListItem } from "@/types/listItems/core/TListItem";
import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import { getNowISORoundDown5Minutes } from "@/utils/dateUtils";
import { generateSortId } from "@/utils/listUtils";
import { saveEventReloadData } from "@/utils/plannerUtils";
import { uuid } from "expo-modules-core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DateTime } from 'luxon';
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

export const TIME_MODAL_PATHNAME = '(modals)/timeModal/';

type FormData = {
    title: string;
    timeRange: {
        startTime: string | null;
        endTime: string | null;
    };
    isCalendarEvent: boolean;
    allDay: boolean;
}

const TimeModal = () => {
    const { eventId, eventValue, datestamp, sortId } = useLocalSearchParams<{
        eventId: string, // NULL if this is a new event
        eventValue: string, // More up-to-date than from storage
        datestamp: string,
        sortId: string
    }>();

    const router = useRouter();

    const { setCurrentTextfield } = useTextfieldData<IListItem>();

    const planEvent = useMemo(() => {
        const newValue = eventValue === NULL ? '' : eventValue;
        if (eventId === NULL) {
            return {
                id: uuid.v4(),
                sortId: Number(sortId),
                status: EItemStatus.NEW,
                listId: datestamp,
                value: newValue
            }
        }

        const planner = getPlannerFromStorage(datestamp);
        const event = planner.events.find(e => e.id === eventId);
        if (!event) router.back();

        return { ...event, value: newValue, status: EItemStatus.EDIT };
    }, [eventId]);

    const isEditMode = planEvent.status === EItemStatus.EDIT;

    const {
        control,
        watch,
        reset,
        formState: { isValid },
        handleSubmit,
        setValue
    } = useForm<FormData>();

    // Sync the form data every time the planEvent changes
    useEffect(() => {
        if (!planEvent) return;
        const now = DateTime.now();

        const defaultStartTime = DateTime.fromISO(planEvent.listId || now.toISO())
            .set({ hour: now.hour, minute: 0, second: 0, millisecond: 0 })
            .toISO();
        const defaultEndTime = DateTime.fromISO(planEvent.listId || now.toISO())
            .set({ hour: now.hour + 1, minute: 0, second: 0, millisecond: 0 })
            .toISO();

        reset({
            title: planEvent.value,
            timeRange: planEvent.timeConfig
                ? {
                    startTime: planEvent.timeConfig.startTime,
                    endTime: planEvent.timeConfig.endTime
                }
                : {
                    startTime: defaultStartTime,
                    endTime: defaultEndTime
                },
            allDay: planEvent.timeConfig?.allDay ?? false,
            isCalendarEvent: !!planEvent.calendarId
        });
    }, [planEvent, reset]);

    // Watch allDay to apply date-only timestamps when toggled on
    const isAllDay = watch('allDay');
    const isCalendarEvent = watch('isCalendarEvent');

    useEffect(() => {
        if (isAllDay) {
            // If all day is toggled on, set times to start of day
            const timeRange = watch('timeRange');
            if (timeRange && timeRange.startTime) {
                const startOfDayStart = DateTime.fromISO(timeRange.startTime)
                    .startOf('day')
                    .toISO();
                if (timeRange.endTime) {
                    const startOfDayEnd = DateTime.fromISO(timeRange.endTime)
                        .startOf('day')
                        .toISO();

                    setValue('timeRange', {
                        startTime: startOfDayStart,
                        endTime: startOfDayEnd
                    });
                }
            }
        }
    }, [isAllDay, setValue, watch]);

    // ------------- Utility Functions -------------

    function handleSavedEvent(event?: IPlannerEvent) {
        const savedPlanner = getPlannerFromStorage(datestamp);

        // Place the new textfield directly below the new item. If the item was removed from the planner, 
        // place the new textfield directly where the item was.
        const newTextfieldSortId = event ?
            generateSortId(event.sortId, savedPlanner.events) : planEvent.sortId!;

        const newTextfield: IListItem = {
            id: uuid.v4(),
            sortId: newTextfieldSortId,
            status: EItemStatus.NEW,
            listId: datestamp,
            value: ''
        };

        setCurrentTextfield(newTextfield);
        router.back();
    }

    async function handleSave(data: FormData) {
        if (!planEvent) return;

        const { title, timeRange, isCalendarEvent, allDay } = data;

        if (!timeRange.startTime || !timeRange.endTime) return;

        const startTimeUtc = DateTime.fromISO(timeRange.startTime).toUTC().toISO();
    let endTimeUtc = DateTime.fromISO(timeRange.endTime).toUTC().toISO();

        const updatedItem = {
            ...planEvent,
            timeConfig: {
                allDay,
                startTime: startTimeUtc,
                endTime: endTimeUtc
            },
            value: title
        } as IPlannerEvent;

        if (isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedItem.calendarId = 'NEW';
        }

        if (allDay && updatedItem.calendarId === 'NEW') {
            // All-day events end at the start of the next day
            const endDate = DateTime.fromISO(timeRange.endTime);
            const startOfNextDay = endDate.plus({ days: 1 }).startOf('day').toISO();
            updatedItem.timeConfig!.endTime = startOfNextDay!;
        }

        await saveEventReloadData(updatedItem, handleSavedEvent);
    }

    function handleDelete() {
        if (!planEvent) return;
        const updatedItem = { ...planEvent };
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;

        // TODO: save the updated item

        router.back();
    }

    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            placeholder: 'Title',
            rules: { required: true },
            trigger: !isEditMode
        }],
        [{
            name: 'timeRange',
            type: EFormFieldType.TIME_RANGE,
            defaultValue: {
                startTime: getNowISORoundDown5Minutes(),
                endTime: getNowISORoundDown5Minutes()
            },
            hide: false,
            multiDay: isCalendarEvent,
            allDay: isAllDay,
            trigger: !isEditMode,
            rules: {
                required: true,
                validate: (val) => Boolean(val.startTime) && Boolean(val.endTime)
            }
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
                onClick: handleDelete,
                hidden: !isEditMode
            }}
            onClose={() => router.back()}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    );
}

export default TimeModal;