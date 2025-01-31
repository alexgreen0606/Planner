import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import globalStyles from '../../../../foundation/theme/globalStyles';
import Modal from '../../../../foundation/components/modal/Modal';
import { Event, getTimeSelectorOptions, isTimestampValid, timestampToDayOfWeek } from '../../../../foundation/planners/timeUtils';
import CustomText from '../../../../foundation/components/text/CustomText';
import TimeSelector from './TimeSelector';
import { ListItemUpdateComponentProps } from '../../../../foundation/sortedLists/utils';
import { Color } from '../../../../foundation/theme/colors';

export interface TimeModalProps extends ListItemUpdateComponentProps<Event> {
    toggleModalOpen: (event: Event) => void;
    open: boolean;
    timestamp: string;
}

type TimeModalSelection = {
    allDay: boolean;
    startTime: string;
    endTime: string;
    isCalendarEvent: boolean;
};

const TimeModal = ({ 
    toggleModalOpen, 
    open, 
    timestamp, 
    onSave, 
    item 
}: TimeModalProps) => {
    const newTimeOptions = useMemo(() => getTimeSelectorOptions(), [timestamp]);
    const defaultStartTime = '00:00';
    const defaultEndTime = '23:55';
    const [timeModalData, setTimeModalData] = useState<TimeModalSelection>(item.timeConfig ?? {
        isCalendarEvent: false,
        allDay: false,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
    });

    useEffect(() => {
        setTimeModalData(item.timeConfig ?? {
            isCalendarEvent: false,
            allDay: false,
            startTime: defaultStartTime,
            endTime: defaultEndTime,
        });
    }, [item]);

    const handleSave = () => {
        const newEvent = {
            ...item,
            timeConfig: timeModalData
        };
        onSave(newEvent);
    }

    // Determines if the user input is savable or not.
    const validData =
        (!timeModalData.isCalendarEvent && !!timeModalData.startTime) ||
        (timeModalData.isCalendarEvent && timeModalData.allDay) ||
        (timeModalData.isCalendarEvent && !!timeModalData.startTime && !!timeModalData.endTime);

    return (
        <Modal
            title={item.value}
            toggleModalOpen={() => toggleModalOpen(item)}
            subTitle={timestampToDayOfWeek(timestamp)}
            open={open}
            primaryButtonConfig={{
                label: 'Save',
                onClick: handleSave,
                disabled: !validData
            }}
            iconConfig={{
                type: 'clock',
                color: Color.BLUE
            }}
        >
            <View style={styles.container}>

                {/* Calendar Controls */}
                <View style={globalStyles.spacedApart}>

                    {/* Calendar Toggle */}
                    <View style={styles.halfWidth}>
                        {isTimestampValid(timestamp) && (
                            <>
                                <CustomText type='label'>Calendar Event</CustomText>
                                <Checkbox.Android
                                    status={timeModalData.isCalendarEvent ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        const [currentStartHour, currentStartMinute] = timeModalData.startTime.split(':');
                                        let newEndTime = Number(currentStartHour) < 23 ?
                                            String(Number(currentStartHour) + 1) + ':' + currentStartMinute :
                                            null;
                                        if (!newEndTime) newEndTime = '23:55';
                                        setTimeModalData({ ...timeModalData, isCalendarEvent: !timeModalData.isCalendarEvent, endTime: newEndTime });

                                    }}
                                    color={Color.BLUE}
                                    uncheckedColor={Color.DIM}

                                />
                            </>
                        )}
                    </View>

                    {/* All Day Toggle */}
                    <View style={styles.halfWidth}>
                        {timeModalData.isCalendarEvent && (
                            <>
                                <CustomText type='label'>All Day</CustomText>
                                <Checkbox.Android
                                    status={timeModalData.allDay ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setTimeModalData({
                                            ...timeModalData,
                                            allDay: !timeModalData.allDay,
                                            startTime: defaultStartTime,
                                            endTime: defaultEndTime
                                        })
                                    }}
                                    color={Color.BLUE}
                                    uncheckedColor={Color.DIM}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Time Controls */}
                <View>

                    {/* Start Time */}
                    {!timeModalData.allDay && (
                        <View style={globalStyles.fullWidth}>
                            <CustomText type='label'>Start Time</CustomText>
                            <TimeSelector
                                onChange={(newVal: string) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        startTime: newVal
                                    })
                                }}
                                options={newTimeOptions}
                                initialTimeValue={timeModalData.startTime}
                            />
                        </View>
                    )}

                    {/* End Time */}
                    {!timeModalData.allDay && timeModalData.isCalendarEvent && (
                        <View style={globalStyles.fullWidth}>
                            <CustomText type='label'>End Time</CustomText>
                            <TimeSelector
                                onChange={(newVal: string) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        endTime: newVal
                                    })
                                }}
                                options={newTimeOptions}
                                initialTimeValue={timeModalData.endTime}
                            />
                        </View>
                    )}
                </View>
                <View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        gap: 40,
        height: 600
    },
    halfWidth: {
        width: '50%'
    }
});

export default TimeModal;