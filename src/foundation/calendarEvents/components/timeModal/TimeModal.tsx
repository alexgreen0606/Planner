import React, { useEffect, useState } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../components/Modal';
import {
    datestampToMidnightDate,
} from '../../timestampUtils';
import CustomText from '../../../components/text/CustomText';
import { ListItemUpdateComponentProps } from '../../../sortedLists/types';
import { PlannerEvent } from '../../types';
import Toggle from './Toggle';
import DateSelector from './DateSelector';
import ThinLine from '../../../sortedLists/components/list/ThinLine';
import { TIME_MODAL_INPUT_HEIGHT } from '../../constants';
import ModalInputField from '../../../components/ModalInputField';
import { ItemStatus } from '../../../sortedLists/constants';

type FormData = {
    value: string;
    allDay: boolean;
    startDate: Date;
    endDate: Date;
    isCalendarEvent: boolean;
}

const initialFormData: FormData = {
    value: '',
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    isCalendarEvent: false
};

export interface TimeModalProps extends ListItemUpdateComponentProps<PlannerEvent> {
    open: boolean;
    toggleModalOpen: (event: PlannerEvent) => void;
    onSave: (event: PlannerEvent) => void;
}

const TimeModal = ({
    open,
    toggleModalOpen,
    onSave,
    item: planEvent
}: TimeModalProps) => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const isEditMode = planEvent.status === ItemStatus.EDIT;
    const formDataFilled = formData.value.length > 0;

    // Sync the form data every time the planEvent changes
    useEffect(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const defaultStartTime = datestampToMidnightDate(planEvent.listId);
        defaultStartTime.setHours(currentHour);
        const defaultEndTime = datestampToMidnightDate(planEvent.listId);
        defaultEndTime.setHours(currentHour + 1);

        setFormData(planEvent.timeConfig ? {
            value: planEvent.value,
            startDate: new Date(planEvent.timeConfig.startTime),
            endDate: new Date(planEvent.timeConfig.endTime),
            allDay: planEvent.timeConfig.allDay,
            isCalendarEvent: !!planEvent.calendarId
        } : {
            value: '',
            allDay: false,
            isCalendarEvent: false,
            startDate: defaultStartTime,
            endDate: defaultEndTime,
        });
    }, [planEvent]);

    // ------------- Utility Functions -------------

    function getStartOfDay(date: Date) {
        const startOfDate = new Date(date);
        startOfDate.setHours(0, 0, 0, 0);
        return startOfDate;
    }

    function handleSave() {
        const updatedItem = {
            ...planEvent,
            timeConfig: {
                allDay: formData.allDay,
                startTime: formData.startDate.toISOString(),
                endTime: formData.endDate.toISOString()
            },
            value: formData.value
        };
        if (formData.isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedItem.calendarId = 'NEW';
        }
        if (formData.allDay && updatedItem.calendarId === 'NEW') {
            // All-day events end at the start of the next day -> TODO: why is this only needed for NEW events?
            const startOfNextDay = new Date(formData.endDate);
            startOfNextDay.setDate(startOfNextDay.getDate() + 1);
            updatedItem.timeConfig.endTime = startOfNextDay.toISOString();
        }
        onSave(updatedItem);
    }

    function handleDelete() {
        const updatedItem = { ...planEvent };
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;
        onSave(updatedItem);
    }

    return (
        <Modal
            open={open}
            toggleModalOpen={() => toggleModalOpen(planEvent)}
            title={isEditMode ? 'Edit Event' : 'Create Event'}
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSave,
                disabled: !formDataFilled
            }}
            deleteButtonConfig={{
                label: 'Unschedule',
                onClick: handleDelete
            }}
            customStyle={{ gap: 4 }}
        >

            {/* Title */}
            <ModalInputField
                label='Title'
                value={formData.value}
                onChange={(newVal) => {
                    setFormData({ ...formData, value: newVal });
                }}
                focusTrigger={open && planEvent.value.length === 0}
            />

            <ThinLine />

            {/* Start Time */}
            <DateSelector
                label='Start'
                allDay={formData.allDay}
                date={formData.startDate}
                onDateChange={(startDate) => {
                    setFormData({
                        ...formData,
                        startDate
                    })
                }}
            />

            <ThinLine />

            {/* End Time */}
            <DateSelector
                label='End'
                allDay={formData.allDay}
                date={formData.endDate}
                hide={!formData.isCalendarEvent}
                onDateChange={(endDate) => {
                    setFormData({
                        ...formData,
                        endDate
                    })
                }}
            />

            <ThinLine />

            {/* All Day Toggle */}
            <View style={styles.inputField}>
                <CustomText
                    type='standard'
                    style={{
                        color: PlatformColor(!formData.isCalendarEvent ? 'tertiaryLabel' : 'label')
                    }}
                >
                    All Day
                </CustomText>
                {formData.isCalendarEvent && (
                    <Toggle
                        value={formData.allDay}
                        onValueChange={(allDay) => {
                            setFormData({
                                ...formData,
                                allDay,
                                startDate: getStartOfDay(formData.startDate),
                                endDate: getStartOfDay(formData.endDate)
                            });
                        }}
                    />
                )}
            </View>

            <ThinLine />

            {/* Calendar Toggle */}
            <View style={styles.inputField}>
                <CustomText type='standard'>Calendar Event</CustomText>
                <Toggle
                    value={formData.isCalendarEvent}
                    onValueChange={(isCalendarEvent) => {
                        setFormData({
                            ...formData,
                            isCalendarEvent
                        });
                    }}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    inputField: {
        ...globalStyles.spacedApart,
        height: TIME_MODAL_INPUT_HEIGHT
    }
})

export default TimeModal;