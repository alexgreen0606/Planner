import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
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
import ThinLine from '../../../components/ThinLine';
import ButtonText from '../../../components/text/ButtonText';
import useDimensions from '../../../hooks/useDimensions';
import { TIME_MODAL_INPUT_HEIGHT } from '../../constants';

type FormData = {
    allDay: boolean;
    startDate: Date;
    endDate: Date;
    isCalendarEvent: boolean;
};

export interface TimeModalProps extends ListItemUpdateComponentProps<PlannerEvent> {
    toggleModalOpen: (event: PlannerEvent) => void;
    open: boolean;
    onSave: (event: PlannerEvent) => void;
}

const TimeModal = ({
    toggleModalOpen,
    open,
    onSave,
    item: planEvent
}: TimeModalProps) => {

    // Form Data Tracker
    const [formData, setFormData] = useState<FormData>({
        startDate: new Date(),
        endDate: new Date(),
        allDay: false,
        isCalendarEvent: false
    });

    const {
        screenWidth,
    } = useDimensions();

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
            }
        };
        if (formData.isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedItem.calendarId = 'NEW';
        }
        if (formData.allDay && updatedItem.calendarId === 'NEW') {
            // All day events end at the start of the next day
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

    // Sync the form data every time the planEvent changes
    useEffect(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const defaultStartTime = datestampToMidnightDate(planEvent.listId);
        defaultStartTime.setHours(currentHour);
        const defaultEndTime = datestampToMidnightDate(planEvent.listId);
        defaultEndTime.setHours(currentHour + 1);

        setFormData(planEvent.timeConfig ? {
            startDate: new Date(planEvent.timeConfig.startTime),
            endDate: new Date(planEvent.timeConfig.endTime),
            allDay: planEvent.timeConfig.allDay,
            isCalendarEvent: !!planEvent.calendarId
        } : {
            allDay: false,
            isCalendarEvent: false,
            startDate: defaultStartTime,
            endDate: defaultEndTime,
        });
    }, [planEvent]);

    return (
        <Modal
            title={planEvent.value}
            open={open}
            toggleModalOpen={() => toggleModalOpen(planEvent)}
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSave,
            }}
            width={screenWidth}
            height={600}
            style={{ gap: 4 }}
        >

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
            <View style={{ ...globalStyles.spacedApart, height: TIME_MODAL_INPUT_HEIGHT }}>
                <CustomText type='standard' style={{ color: PlatformColor(!formData.isCalendarEvent ? 'tertiaryLabel' : 'label') }}>All Day</CustomText>
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
            <View style={{ ...globalStyles.spacedApart, height: TIME_MODAL_INPUT_HEIGHT }}>
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

            <View style={{ flex: 1 }} />

            {/* Delete Button */}
            <View style={{ alignItems: 'center', width: '100%' }}>
                <ButtonText
                    label='Unschedule'
                    platformColor='systemRed'
                    onClick={handleDelete}
                />
            </View>
        </Modal>
    );
};

export default TimeModal;