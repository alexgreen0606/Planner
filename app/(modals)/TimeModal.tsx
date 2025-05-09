import { usePathname } from "expo-router";
import Modal from "../../src/modals";
import { useEffect, useMemo } from "react";
import { useTimeModal } from "../../src/modals/services/TimeModalProvider";
import { EFieldType } from "../../src/modals/components/form/types";
import { DateTime } from 'luxon';
import { useForm } from "react-hook-form";
import Form from "../../src/modals/components/form";

export const TIME_MODAL_PATHNAME = '(modals)/TimeModal';

type FormData = {
    title: string;
    timeRange: {
        startTime: string;
        endTime: string;
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

    // Set up react-hook-form
    const { control, watch, setValue, formState: { isValid } } = useForm<FormData>();
    const formValues = watch();

    // Sync the form data every time the planEvent changes
    useEffect(() => {
        if (!planEvent) return;
        const now = DateTime.now();
        const defaultStartTime = DateTime.fromISO(planEvent.listId || now.toISOString())
            .set({ hour: now.hour, minute: 0, second: 0, millisecond: 0 })
            .toISO();
        const defaultEndTime = DateTime.fromISO(planEvent.listId || now.toISOString())
            .set({ hour: now.hour + 1, minute: 0, second: 0, millisecond: 0 })
            .toISO();

        if (planEvent.timeConfig) {
            setValue('title', planEvent.value);
            setValue('timeRange', {
                startTime: planEvent.timeConfig.startTime,
                endTime: planEvent.timeConfig.endTime
            });
            setValue('allDay', planEvent.timeConfig.allDay);
            setValue('isCalendarEvent', !!planEvent.calendarId);
        } else {
            setValue('title', planEvent.value);
            setValue('timeRange', {
                startTime: defaultStartTime,
                endTime: defaultEndTime
            });
            setValue('allDay', false);
            setValue('isCalendarEvent', false);
        }
    }, [planEvent, setValue]);

    // Watch allDay to apply date-only timestamps when toggled on
    const isAllDay = watch('allDay');
    const isCalendarEvent = watch('isCalendarEvent');

    useEffect(() => {
        if (isAllDay) {
            // If all day is toggled on, set times to start of day
            const timeRange = watch('timeRange');
            if (timeRange) {
                const startOfDayStart = DateTime.fromISO(timeRange.startTime)
                    .startOf('day')
                    .toISO();
                const startOfDayEnd = DateTime.fromISO(timeRange.endTime)
                    .startOf('day')
                    .toISO();

                setValue('timeRange', {
                    startTime: startOfDayStart,
                    endTime: startOfDayEnd
                });
            }
        }
    }, [isAllDay, setValue, watch]);

    // ------------- Utility Functions -------------

    function handleSave() {
        if (!planEvent) return;

        const { title, timeRange, isCalendarEvent, allDay } = formValues;

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
            updatedItem.timeConfig.endTime = startOfNextDay;
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

    const formOptions = [
        {
            name: 'title',
            type: EFieldType.TEXT,
            label: 'Title',
            rules: { required: true },
            focusTrigger: pathname === TIME_MODAL_PATHNAME && planEvent?.value?.length === 0
        },
        {
            name: 'timeRange',
            type: EFieldType.TIME_RANGE,
            defaultValue: {
                startTime: DateTime.now().toISO(),
                endTime: DateTime.now().plus({ hours: 1 }).toISO()
            },
            hide: false
        },
        {
            name: 'isCalendarEvent',
            type: EFieldType.CHECKBOX,
            label: 'Add to Device Calendar',
            defaultValue: false
        },
        {
            name: 'allDay',
            type: EFieldType.CHECKBOX,
            label: 'All Day',
            defaultValue: false,
            disabled: !isCalendarEvent,
            hide: !isCalendarEvent
        }
    ];

    return (
        <Modal
            title='Schedule Event Time'
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSave,
                disabled: !isValid
            }}
            deleteButtonConfig={{
                label: 'Unschedule',
                onClick: handleDelete
            }}
            onClose={onClose}
        >
            <Form options={formOptions} control={control} />
        </Modal>
    );
}

export default TimeModal;