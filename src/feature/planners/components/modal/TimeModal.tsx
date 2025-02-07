import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import globalStyles from '../../../../foundation/theme/globalStyles';
import Modal from '../../../../foundation/ui/modal/Modal';
import {
    genericTimestampToMidnightDate,
    timestampToDayOfWeek
} from '../../../../foundation/calendar/dateUtils';
import CustomText from '../../../../foundation/ui/text/CustomText';
import { ListItemUpdateComponentProps } from '../../../../foundation/sortedLists/sortedListUtils';
import { Color } from '../../../../foundation/theme/colors';
import DatePicker from 'react-native-date-picker';
import { PlannerEvent, RECURRING_WEEKDAY_PLANNER_KEY } from '../../../../foundation/calendar/calendarUtils';

type FormData = {
    allDay: boolean;
    startTime: Date;
    endTime: Date;
    isCalendarEvent: boolean;
};

export interface PlannerEventTimeModalProps extends ListItemUpdateComponentProps<PlannerEvent> {
    toggleModalOpen: (event: PlannerEvent) => void;
    open: boolean;
}

const PlannerEventTimeModal = ({
    toggleModalOpen,
    open,
    onSave,
    item
}: PlannerEventTimeModalProps) => {
    const startOfDayDate = genericTimestampToMidnightDate(item.listId);
    const endOfDayDate = genericTimestampToMidnightDate(item.listId);
    endOfDayDate.setHours(23, 55, 0, 0);
    const [timeModalData, setTimeModalData] = useState<FormData>(item.timeConfig ? {
        ...item.timeConfig,
        startTime: new Date(item.timeConfig.startTime),
        endTime: new Date(item.timeConfig.endTime)
    } : {
        isCalendarEvent: false,
        allDay: false,
        startTime: startOfDayDate,
        endTime: endOfDayDate,
    });

    useEffect(() => {
        setTimeModalData(item.timeConfig ? {
            ...item.timeConfig,
            startTime: new Date(item.timeConfig.startTime),
            endTime: new Date(item.timeConfig.endTime)
        } : {
            isCalendarEvent: false,
            allDay: false,
            startTime: startOfDayDate,
            endTime: endOfDayDate,
        });
    }, [item]);

    const handleSave = () => {
        onSave({
            ...item,
            timeConfig: {
                ...timeModalData,
                startTime: timeModalData.startTime.toISOString(),
                endTime: timeModalData.endTime.toISOString()
            }
        });
    };

    return (
        <Modal
            title='Schedule event time'
            toggleModalOpen={() => toggleModalOpen(item)}
            open={open}
            primaryButtonConfig={{
                label: 'Save',
                onClick: handleSave,
            }}
            iconConfig={{
                type: 'clock',
                color: Color.BLUE,
            }}
        >

            {/* Event Details */}
            <CustomText type='standard'>
                {item.value}
            </CustomText>
            {item.listId !== RECURRING_WEEKDAY_PLANNER_KEY && (
                <CustomText type='soft' style={{ marginBottom: 16 }}>
                    on {timestampToDayOfWeek(item.listId)}
                </CustomText>
            )}

            <View style={styles.container}>

                {/* Calendar Controls */}
                <View style={globalStyles.spacedApart}>

                    {/* Calendar Toggle */}
                    <View style={styles.halfWidth}>
                        <CustomText type='label'>Calendar Event</CustomText>
                        <Checkbox.Android
                            status={timeModalData.isCalendarEvent ? 'checked' : 'unchecked'}
                            onPress={() => {
                                const newIsCalendarEvent = !timeModalData.isCalendarEvent;
                                setTimeModalData({
                                    ...timeModalData,
                                    isCalendarEvent: newIsCalendarEvent,
                                    endTime: newIsCalendarEvent
                                        ? new Date(timeModalData.startTime.getTime() + 60 * 60 * 1000)
                                        : endOfDayDate
                                });
                            }}
                            color={Color.BLUE}
                            uncheckedColor={Color.DIM}

                        />
                    </View>

                    {/* All Day Toggle */}
                    <View style={styles.halfWidth}>
                        {timeModalData.isCalendarEvent && (
                            <>
                                <CustomText type='label'>All Day</CustomText>
                                <Checkbox.Android
                                    status={timeModalData.allDay ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        const newAllDay = !timeModalData.allDay;
                                       setTimeModalData({
                                            ...timeModalData,
                                            allDay: newAllDay,
                                            startTime: startOfDayDate,
                                            endTime: newAllDay ? startOfDayDate : endOfDayDate
                                        });
                                    }}
                                    color={Color.BLUE}
                                    uncheckedColor={Color.DIM}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Start Time */}
                {!timeModalData.allDay && (
                    <View style={globalStyles.fullWidth}>
                        <CustomText type='label'>Start Time</CustomText>
                        <View style={{ transform: [{ scale: .8, }], alignItems: 'center' }}>
                            <DatePicker
                                mode='time'
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
                {!timeModalData.allDay && timeModalData.isCalendarEvent && (
                    <View style={globalStyles.fullWidth}>
                        <CustomText type='label'>End Time</CustomText>
                        <View style={{ transform: [{ scale: .8, }], alignItems: 'center' }}>
                            <DatePicker
                                mode='time'
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

export default PlannerEventTimeModal;