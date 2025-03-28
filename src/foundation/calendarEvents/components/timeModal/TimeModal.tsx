import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../components/Modal';
import {
    datestampToMidnightDate,
    datestampToDayOfWeek,
    datestampToMonthDate,
    isoToDatestamp,
    getTodayDatestamp
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

    const {
        screenWidth,
        screenHeight
    } = useDimensions();

    const isMultidayEvent = () => {
        const eventStartDate = planEvent.timeConfig?.startTime && isoToDatestamp(planEvent.timeConfig?.startTime);
        const eventEndDate = planEvent.timeConfig?.endTime && isoToDatestamp(planEvent.timeConfig?.endTime)
        return eventStartDate !== eventEndDate;
    }

    const startOfDayDate = datestampToMidnightDate(planEvent.listId);
    const endOfDayDate = datestampToMidnightDate(planEvent.listId);
    endOfDayDate.setHours(23, 55, 0, 0);
    const [multiDayEvent, setMultiDayEvent] = useState(isMultidayEvent());
    const [timeModalData, setTimeModalData] = useState<FormData>(planEvent.timeConfig ? {
        startTime: new Date(planEvent.timeConfig.startTime),
        endTime: new Date(planEvent.timeConfig.endTime),
        allDay: planEvent.timeConfig.allDay,
        isCalendarEvent: !!planEvent.calendarId
    } : {
        allDay: false,
        isCalendarEvent: false,
        startTime: startOfDayDate,
        endTime: endOfDayDate,
    });

    useEffect(() => {
        setTimeModalData(planEvent.timeConfig ? {
            startTime: new Date(planEvent.timeConfig.startTime),
            endTime: new Date(planEvent.timeConfig.endTime),
            allDay: planEvent.timeConfig.allDay,
            isCalendarEvent: !!planEvent.calendarId
        } : {
            allDay: false,
            isCalendarEvent: false,
            startTime: startOfDayDate,
            endTime: endOfDayDate,
        });
        setMultiDayEvent(isMultidayEvent());
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
            updatedItem.calendarId = 'NEW';
        }
        onSave(updatedItem);
    };

    function handleDelete() {
        const updatedItem = {...planEvent};
        delete updatedItem.calendarId;
        delete updatedItem.timeConfig;
        onSave(updatedItem);
    }

    function toggleMultiDay() {
        setMultiDayEvent(curr => !curr);
    }

    function getDateLabel() {
        const startMonthDay = datestampToMonthDate(isoToDatestamp(timeModalData.startTime.toISOString()));
        const endMonthDay = datestampToMonthDate(isoToDatestamp(timeModalData.endTime.toISOString()));
        if (startMonthDay !== endMonthDay) {
            return `${getTodayDatestamp() === isoToDatestamp(timeModalData.startTime.toISOString()) ? 'Today' : `${datestampToDayOfWeek(isoToDatestamp(timeModalData.startTime.toISOString()))} ${startMonthDay}`} to ${datestampToDayOfWeek(isoToDatestamp(timeModalData.endTime.toISOString()))} ${endMonthDay}`
        } else {
            return `on ${datestampToDayOfWeek(isoToDatestamp(timeModalData.startTime.toISOString()))}`
        }
    }

    return (
        <Modal
            title={planEvent.value}
            open={open}
            modalAbsoluteTop={screenHeight - 600}
            toggleModalOpen={() => toggleModalOpen(planEvent)}
            primaryButtonConfig={{
                label: 'Schedule',
                onClick: handleSave,
            }}
            width={screenWidth}
            style={{
                gap: 4,
                height: 600,
            }}
        >

            {/* Event Details */}
            {/* <CustomText type='standard'>
                {planEvent.value}
            </CustomText>
            <CustomText adjustsFontSizeToFit numberOfLines={1} type='soft' style={{ marginBottom: 16 }}>
                {getDateLabel()}
            </CustomText> */}

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
                date={new Date(timeModalData?.endTime || endOfDayDate)}
                onDateChange={(date) => {
                    setTimeModalData({
                        ...timeModalData,
                        endTime: date
                    })
                }}
            />

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
                            endTime: newIsCalendarEvent
                                ? new Date(timeModalData.startTime.getTime() + 60 * 60 * 1000)
                                : endOfDayDate
                        });
                        setMultiDayEvent(false);
                    }}
                />
            </View>

            <ThinLine />

            {/* All Day Toggle */}
            <View style={globalStyles.spacedApart}>
                <CustomText type='standard'>All Day</CustomText>
                <Toggle
                    value={timeModalData.allDay}
                    onValueChange={() => {
                        const newAllDay = !timeModalData.allDay;
                        setTimeModalData({
                            ...timeModalData,
                            allDay: newAllDay,
                            startTime: startOfDayDate,
                            endTime: newAllDay ? startOfDayDate : endOfDayDate
                        });
                    }}
                />
            </View>

            <View style={{ flex: 1 }} />

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