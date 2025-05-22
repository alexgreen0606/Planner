import Modal from "@/components/modal";
import Form from "@/components/form";
import { useTimeModal } from "@/services/TimeModalProvider";
import { EFormFieldType } from "@/enums/EFormFieldType";
import { EItemStatus } from "@/enums/EItemStatus";
import { usePathname } from "expo-router";
import { DateTime } from 'luxon';
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { IFormField } from "@/types/form/IFormField";

export const TIME_MODAL_PATHNAME = '(modals)/TimeModal';

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
    const pathname = usePathname();
    const { initialEvent, onSave, onClose } = useTimeModal();

    const planEvent = useMemo(() => {
        return initialEvent.current;
    }, [pathname]);

    const isEditMode = planEvent?.status === EItemStatus.EDIT;

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

    function handleSave(data: FormData) {
        if (!planEvent) return;

        const { title, timeRange, isCalendarEvent, allDay } = data;

        if (!timeRange.startTime || !timeRange.endTime) return;

        const updatedItem = {
            ...planEvent,
            timeConfig: {
                allDay,
                startTime: timeRange.startTime,
                endTime: timeRange.endTime
            },
            value: title
        };

        if (isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedItem.calendarId = 'NEW';
        }

        if (allDay && updatedItem.calendarId === 'NEW') {
            // All-day events end at the start of the next day
            const endDate = DateTime.fromISO(timeRange.endTime);
            const startOfNextDay = endDate.plus({ days: 1 }).startOf('day').toISO();
            updatedItem.timeConfig.endTime = startOfNextDay!;
        }

        onSave(updatedItem);
    }

    function handleDelete() {
        if (!planEvent) return;
        const updatedItem = { ...planEvent };
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;
        onSave(updatedItem);
    }

    const formFields: IFormField[][] = [
        [{
            name: 'title',
            type: EFormFieldType.TEXT,
            placeholder: 'Title',
            rules: { required: true },
            focusTrigger: pathname === TIME_MODAL_PATHNAME && planEvent?.value?.length === 0
        }],
        [{
            name: 'timeRange',
            type: EFormFieldType.TIME_RANGE,
            defaultValue: {
                startTime: DateTime.now().toISO(),
                endTime: DateTime.now().toISO()
            },
            hide: false,
            multiDay: isCalendarEvent,
            allDay: isAllDay
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
            disabled: !isCalendarEvent,
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
                onClick: handleDelete
            }}
            onClose={onClose}
        >
            <Form fields={formFields} control={control} />
        </Modal>
    );
}

export default TimeModal;