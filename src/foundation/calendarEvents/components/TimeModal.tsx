import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import Modal from '../../components/Modal';
import {
    datestampToMidnightDate,
    datestampToDayOfWeek,
    datestampToMonthDate,
    isoToDatestamp,
    getTodayDatestamp
} from '../timestampUtils';
import Checkbox from 'expo-checkbox';
import CustomText from '../../components/text/CustomText';
import DatePicker from 'react-native-date-picker';
import { ListItemUpdateComponentProps } from '../../sortedLists/types';
import { PlannerEvent } from '../types';

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

    const hideStartTimeSelector = !multiDayEvent && timeModalData.allDay;
    const hideEndTimeSelector = !timeModalData.isCalendarEvent;

    return (
        <Modal
            title='Schedule event time'
            open={open}
            toggleModalOpen={() => toggleModalOpen(planEvent)}
            primaryButtonConfig={{
                label: 'Save',
                onClick: handleSave,
            }}
        >

            {/* Event Details */}
            <CustomText type='standard'>
                {planEvent.value}
            </CustomText>
            <CustomText adjustsFontSizeToFit numberOfLines={1} type='soft' style={{ marginBottom: 16 }}>
                {getDateLabel()}
            </CustomText>
            <View style={styles.container}>

                {/* Calendar Controls */}
                <View style={globalStyles.spacedApart}>

                    {/* Calendar Toggle */}
                    <View style={styles.halfWidth}>
                        <CustomText type='label'>Calendar Event</CustomText>
                        <Checkbox
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
                            style={{
                                marginTop: 4,
                            }}
                            color={PlatformColor(timeModalData.isCalendarEvent ? 'systemBlue' : 'secondaryLabel')}
                        />
                    </View>

                    {/* All Day Toggle */}
                    <View style={styles.halfWidth}>
                        {timeModalData.isCalendarEvent && (
                            <>
                                <CustomText type='label'>All Day</CustomText>
                                <Checkbox
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
                                    style={{
                                        marginTop: 4,
                                    }}
                                    color={PlatformColor(timeModalData.allDay ? 'systemBlue' : 'secondaryLabel')}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Multi-Day Toggle */}
                <View style={styles.halfWidth}>
                    {timeModalData.isCalendarEvent && (
                        <>
                            <CustomText type='label'>Multi-Day</CustomText>
                            <Checkbox
                                value={multiDayEvent}
                                onValueChange={toggleMultiDay}
                                style={{
                                    marginTop: 4,
                                }}
                                color={PlatformColor(multiDayEvent ? 'systemBlue' : 'secondaryLabel')}
                            />
                        </>
                    )}
                </View>

                {/* Start Time */}
                {!hideStartTimeSelector && (
                    <View style={globalStyles.fullWidth}>
                        <CustomText type='label'>Start Time</CustomText>
                        <View style={{ transform: [{ scale: .8, }], alignItems: 'center' }}>
                            <DatePicker
                                mode={multiDayEvent && timeModalData.allDay ? 'date' : multiDayEvent ? 'datetime' : 'time'}
                                title='Select deadline date'
                                theme='dark'
                                date={timeModalData.startTime}
                                onDateChange={(date) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        startTime: date
                                    })
                                }}
                                minuteInterval={5}
                            />
                        </View>
                    </View>
                )}

                {/* End Time */}
                {!hideEndTimeSelector && (
                    <View style={globalStyles.fullWidth}>
                        <CustomText type='label'>End Time</CustomText>
                        <View style={{ transform: [{ scale: .8, }], alignItems: 'center' }}>
                            <DatePicker
                                mode={multiDayEvent && timeModalData.allDay ? 'date' : multiDayEvent ? 'datetime' : 'time'}
                                title='Select deadline date'
                                theme='dark'
                                date={new Date(timeModalData?.endTime || endOfDayDate)}
                                onDateChange={(date) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        endTime: date
                                    })
                                }}
                                minuteInterval={5}
                            />
                        </View>
                    </View>
                )}
                <View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 16,
        height: 550
    },
    halfWidth: {
        width: '50%'
    }
});

export default TimeModal;