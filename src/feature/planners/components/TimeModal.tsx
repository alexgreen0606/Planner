import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../foundation/ui/modal/Modal';
import { Event, TimeConfig } from '../types';
import { generateGenericTimeOptions, generateTimeArrays, isTimestampValid, timestampToDayOfWeek } from '../utils';
import CustomText from '../../../foundation/ui/text';
import TimeSelector from '../../../foundation/ui/input/TimeSelector';
import colors from '../../../theme/colors';

interface TimeModalProps {
    toggleModalOpen: () => void;
    open: boolean;
    event: Event;
    timestamp: string;
    onSaveItem: (data: TimeConfig) => void;
}

interface TimeModalSelection {
    allDay: boolean;
    startTime?: string;
    endTime?: string;
    isCalendarEvent: boolean;
};

const TimeModal = ({ toggleModalOpen, open, event, timestamp, onSaveItem }: TimeModalProps) => {
    const timeOptions = useMemo(() => generateGenericTimeOptions(), [timestamp]);
    const newTimeOptions = useMemo(() => generateTimeArrays(), [timestamp]);
    const [timeModalData, setTimeModalData] = useState<TimeModalSelection>(event.timeConfig ?? {
        isCalendarEvent: false,
        allDay: false,
        startTime: undefined,
        endTime: undefined,
    });

    const defaultStartTime = timeOptions[0].value;
    const defaultEndTime = timeOptions[timeOptions.length - 1].value;

    /**
     * Saves the user input to the event.
     */
    const onSaveInput = () => {
        const startTime = (timeModalData.allDay ? defaultStartTime : timeModalData.startTime) || defaultStartTime;
        const endTime = (timeModalData.allDay ? defaultEndTime : timeModalData.endTime) || defaultEndTime;
        onSaveItem({
            ...timeModalData,
            startTime: startTime,
            endTime: endTime
        });
    };

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
                onClick: onSaveInput,
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
                                        setTimeModalData({ ...timeModalData, isCalendarEvent: !timeModalData.isCalendarEvent })
                                    }}
                                    color={colors.blue}
                                    uncheckedColor={colors.grey}

                                />
                            </>
                        )}
                    </View>

                    {/* All Day Control */}
                    <View style={{ width: '50%' }}>
                        {timeModalData.isCalendarEvent && (
                            <>
                                <CustomText type='label'>All Day</CustomText>
                                <Checkbox.Android
                                    status={timeModalData.allDay ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setTimeModalData({ ...timeModalData, allDay: !timeModalData.allDay })
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
                                }}
                                options={newTimeOptions}
                                initialTimeValue={timeModalData.startTime || defaultStartTime}
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
                                initialTimeValue={timeModalData.endTime || defaultEndTime}
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