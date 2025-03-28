import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../components/Modal';
import {
    datestampToMidnightDate,
    isoToDatestamp,
} from '../../timestampUtils';
import CustomText from '../../../components/text/CustomText';
import { ListItemUpdateComponentProps } from '../../../sortedLists/types';
import { PlannerEvent } from '../../types';
import Toggle from './Toggle';
import DateSelector from './DateSelector';
import ThinLine from '../../../components/ThinLine';
import ButtonText from '../../../components/text/ButtonText';
import useDimensions from '../../../hooks/useDimensions';

type FormData = {
    allDay: boolean;
    startTime: Date;
    endTime: Date;
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

    // Default start date
    const todayStart = useMemo(() => {
        return datestampToMidnightDate(planEvent.listId);
    }, [planEvent.listId]);

    // Default end date
    // const endOfDayDate = useMemo(() => {
    //     const todayStart = datestampToMidnightDate(planEvent.listId);
    //     todayStart.setHours(23, 55, 0, 0);
    //     return todayStart;
    // }, [planEvent.listId]);

    // Default end date
    const tomorrowStart = useMemo(() => {
        return datestampToMidnightDate(planEvent.listId, 1);
    }, [planEvent.listId]);

    const getStartOfDay = (date: Date) => {
        return datestampToMidnightDate(isoToDatestamp(date.toISOString()));
    }

    const getHourInFuture = () => {
        const date = new Date();
        date.setHours(date.getHours() + 1);
        return date;
    };

    // Form Data Tracker
    const [timeModalData, setTimeModalData] = useState<FormData>(planEvent.timeConfig ? {
        startTime: new Date(planEvent.timeConfig.startTime),
        endTime: new Date(planEvent.timeConfig.endTime),
        allDay: planEvent.timeConfig.allDay,
        isCalendarEvent: !!planEvent.calendarId
    } : {
        allDay: false,
        isCalendarEvent: false,
        startTime: todayStart,
        endTime: tomorrowStart,
    });

    const {
        screenWidth,
    } = useDimensions();

    // Sync the form data every time the planEvent changes
    useEffect(() => {
        setTimeModalData(planEvent.timeConfig ? {
            startTime: new Date(planEvent.timeConfig.startTime),
            endTime: new Date(planEvent.timeConfig.endTime),
            allDay: planEvent.timeConfig.allDay,
            isCalendarEvent: !!planEvent.calendarId
        } : {
            allDay: false,
            isCalendarEvent: false,
            startTime: todayStart,
            endTime: tomorrowStart,
        });
    }, [planEvent]);

    function handleSave() {
        const updatedItem = {
            ...planEvent,
            timeConfig: {
                allDay: timeModalData.allDay,
                startTime: timeModalData.startTime.toISOString(),
                endTime: timeModalData.endTime.toISOString()
            }
        };
        if (timeModalData.isCalendarEvent && !planEvent.calendarId) {
            // Triggers creation of a new calendar event
            updatedItem.calendarId = 'NEW';
        }
        onSave(updatedItem);
    };

    function handleDelete() {
        const updatedItem = { ...planEvent };
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;
        onSave(updatedItem);
    }

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
            height={500}
            style={{
                gap: 4,
            }}
        >

            {/* Start Time */}
            <DateSelector
                label='Start Time'
                allDay={timeModalData.allDay}
                date={timeModalData.startTime}
                onDateChange={(date) => {
                    setTimeModalData({
                        ...timeModalData,
                        startTime: date
                    })
                }}
            />

            <ThinLine />

            {/* End Time */}
            <DateSelector
                label='End Time'
                allDay={timeModalData.allDay}
                date={new Date(timeModalData?.endTime || tomorrowStart)}
                onDateChange={(date) => {
                    setTimeModalData({
                        ...timeModalData,
                        endTime: date
                    })
                }}
            />

            <ThinLine />

            {/* All Day Toggle */}
            <View style={globalStyles.spacedApart}>
                <CustomText type='standard'>All Day</CustomText>
                <Toggle
                    value={timeModalData.allDay}
                    onValueChange={() => {
                        const isAllDay = !timeModalData.allDay;
                        setTimeModalData({
                            ...timeModalData,
                            allDay: isAllDay,
                            startTime: getStartOfDay(timeModalData.startTime),
                            endTime: getStartOfDay(timeModalData.endTime)
                        });
                    }}
                />
            </View>

            <ThinLine />

            {/* Calendar Toggle */}
            <View style={globalStyles.spacedApart}>
                <CustomText type='standard'>Calendar Event</CustomText>
                <Toggle
                    value={timeModalData.isCalendarEvent}
                    onValueChange={() => {
                        const newIsCalendarEvent = !timeModalData.isCalendarEvent;
                        setTimeModalData({
                            ...timeModalData,
                            isCalendarEvent: newIsCalendarEvent,
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