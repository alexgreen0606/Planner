import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox, useTheme } from 'react-native-paper';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../foundation/ui/modal/Modal';
import { Event, TimeConfig } from '../types';
import TimeDropdown from '../../../foundation/ui/input/TimeDropdown';
import { generateGenericTimeOptions, isTimestampValid, timestampToDayOfWeek } from '../utils';
import CustomText from '../../../foundation/ui/text';
import { TimeDropdownType } from '../enums';

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
    const { colors } = useTheme();
    const [dropdownInFocus, setDropdownInFocus] = useState<TimeDropdownType | undefined>(
        event.timeConfig ? undefined : TimeDropdownType.START
    );
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

    /**
     * Determines the first option available within the dropdown list.
     */
    const startTimeOptionIndex = useMemo(() => {
        const index = timeOptions.findIndex(option => option.value === timeModalData.startTime);
        return index >= 0 ? index + 1 : 0;
    }, [timeOptions, timeModalData]);

    // Determines if the user input is savable or not.
    const validData =
        (!timeModalData.isCalendarEvent && !!timeModalData.startTime) ||
        (timeModalData.isCalendarEvent && timeModalData.allDay) ||
        (timeModalData.isCalendarEvent && !!timeModalData.startTime && !!timeModalData.endTime);

    return (
        <Modal
            title={`${isTimestampValid(timestamp) ? `${timestampToDayOfWeek(timestamp)} - ` : ''}${event.value}`}
            toggleModalOpen={toggleModalOpen}
            open={open}
            primaryButtonConfig={{
                label: 'Save',
                onClick: onSaveInput,
                disabled: !validData
            }}
        >
            <View style={styles.container}>

                {/* Calendar Controls */}
                <View style={globalStyles.spacedApart}>

                    {/* Calendar Toggle */}
                    <View style={{ width: '46%' }}>
                        {isTimestampValid(timestamp) && (
                            <>
                                <CustomText type='collapseText'>Calendar Event</CustomText>
                                <Checkbox
                                    status={timeModalData.isCalendarEvent ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setTimeModalData({ ...timeModalData, isCalendarEvent: !timeModalData.isCalendarEvent })
                                    }}
                                    color={colors.primary}
                                    uncheckedColor={colors.outline}
                                />
                            </>
                        )}
                    </View>

                    {/* All Day Control */}
                    <View style={{ width: '46%' }}>
                        {timeModalData.isCalendarEvent && (
                            <>
                                <CustomText type='collapseText'>All Day</CustomText>
                                <Checkbox
                                    status={timeModalData.allDay ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setTimeModalData({ ...timeModalData, allDay: !timeModalData.allDay })
                                    }}
                                    color={colors.primary}
                                    uncheckedColor={colors.outline}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* Time Controls */}
                <View style={globalStyles.spacedApart}>

                    {/* Start Time */}
                    {!timeModalData.allDay && (
                        <View style={{ width: '46%' }}>
                            <CustomText type='collapseText'>Start Time</CustomText>
                            <TimeDropdown
                                onChange={(newVal: string | undefined) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        startTime: newVal
                                    })
                                    if (newVal)
                                        setDropdownInFocus(TimeDropdownType.END);
                                }}
                                beginFocus={() => setDropdownInFocus(TimeDropdownType.START)}
                                endFocus={() => setDropdownInFocus(undefined)}
                                options={timeOptions}
                                dropdownInFocus={dropdownInFocus}
                                placeholder='Start Time'
                                currTimestamp={timeModalData.startTime}
                                minOptionIndex={0}
                            />
                        </View>
                    )}

                    {/* End Time */}
                    {!timeModalData.allDay && timeModalData.isCalendarEvent && (
                        <View style={{ width: '46%' }}>
                            <CustomText type='collapseText'>End Time</CustomText>
                            <TimeDropdown
                                onChange={(newVal: string | undefined) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        endTime: newVal
                                    })
                                    if (newVal)
                                        setDropdownInFocus(undefined);
                                }}
                                dropdownInFocus={dropdownInFocus}
                                options={timeOptions}
                                beginFocus={() => setDropdownInFocus(TimeDropdownType.END)}
                                endFocus={() => setDropdownInFocus(undefined)}
                                placeholder='End Time'
                                currTimestamp={timeModalData.endTime}
                                minOptionIndex={startTimeOptionIndex}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 16
    }
});

export default TimeModal;