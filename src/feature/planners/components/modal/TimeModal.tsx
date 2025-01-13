import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import globalStyles from '../../../../foundation/theme/globalStyles';
import Modal from '../../../../foundation/ui/modal/Modal';
import { Event, TimeConfig } from '../../types';
import { generateTimeArrays, isTimestampValid, timestampToDayOfWeek } from '../../utils';
import CustomText from '../../../../foundation/ui/text/CustomText';
import TimeSelector from '../../../../foundation/ui/input/TimeSelector';
import colors from '../../../../foundation/theme/colors';

interface TimeModalProps {
    toggleModalOpen: () => void;
    open: boolean;
    event: Event;
    timestamp: string;
    onSaveItem: (data: TimeConfig) => void;
}

interface TimeModalSelection {
    allDay: boolean;
    startTime: string;
    endTime: string;
    isCalendarEvent: boolean;
};

const TimeModal = ({ toggleModalOpen, open, event, timestamp, onSaveItem }: TimeModalProps) => {

    const newTimeOptions = useMemo(() => generateTimeArrays(), [timestamp]);
    const defaultStartTime = '00:00';
    const defaultEndTime = '23:55';
    const [timeModalData, setTimeModalData] = useState<TimeModalSelection>(event.timeConfig ?? {
        isCalendarEvent: false,
        allDay: false,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
    });

    // Determines if the user input is savable or not.
    const validData =
        (!timeModalData.isCalendarEvent && !!timeModalData.startTime) ||
        (timeModalData.isCalendarEvent && timeModalData.allDay) ||
        (timeModalData.isCalendarEvent && !!timeModalData.startTime && !!timeModalData.endTime);

    return (
        <Modal
            title={event.value}
            toggleModalOpen={toggleModalOpen}
            subTitle={timestampToDayOfWeek(timestamp)}
            open={open}
            primaryButtonConfig={{
                label: 'Save',
                onClick: () => onSaveItem(timeModalData),
                disabled: !validData
            }}
            iconConfig={{
                type: 'MaterialCommunityIcons',
                name: 'clock-outline',
                color: colors.blue
            }}
        >
            <View style={styles.container}>

                {/* Calendar Controls */}
                <View style={globalStyles.spacedApart}>

                    {/* Calendar Toggle */}
                    <View style={{ width: '50%' }}>
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
                                    color={colors.blue}
                                    uncheckedColor={colors.grey}

                                />
                            </>
                        )}
                    </View>

                    {/* All Day Toggle */}
                    <View style={{ width: '50%' }}>
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
                                    color={colors.blue}
                                    uncheckedColor={colors.grey}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Time Controls */}
                <View>

                    {/* Start Time */}
                    {!timeModalData.allDay && (
                        <View style={{ width: '100%' }}>
                            <CustomText type='label'>Start Time</CustomText>
                            <TimeSelector
                                onChange={(newVal: string) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        startTime: newVal
                                    })
                                    console.log(newVal)
                                }}
                                options={newTimeOptions}
                                initialTimeValue={timeModalData.startTime}
                            />
                        </View>
                    )}

                    {/* End Time */}
                    {!timeModalData.allDay && timeModalData.isCalendarEvent && (
                        <View style={{ width: '100%' }}>
                            <CustomText type='label'>End Time</CustomText>
                            <TimeSelector
                                onChange={(newVal: string) => {
                                    console.log(newVal)
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
    }
});

export default TimeModal;