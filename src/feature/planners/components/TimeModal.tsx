import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox, useTheme } from 'react-native-paper';
import globalStyles from '../../../theme/globalStyles';
import Modal from '../../../foundation/ui/modal/Modal';
import { Event, TimeConfig } from '../types';
import TimeDropdown from '../../../foundation/ui/input/TimeDropdown';
import { generateGenericTimeOptions, generateTimeOptions, isValidTimestamp, timestampToDayOfWeek } from '../utils';
import CustomText from '../../../foundation/ui/text';

interface TimeModalProps {
    toggleModalOpen: () => void;
    open: boolean;
    event: Event;
    timestamp: string;
    onSaveItem: (data: TimeConfig) => void;
}

interface TimeModalSelection {
    allDay: boolean;
    startDate?: string;
    endDate?: string;
    isAppleEvent: boolean;
};

const TimeModal = ({ toggleModalOpen, open, event, timestamp, onSaveItem }: TimeModalProps) => {
    const timeOptions = isValidTimestamp(timestamp) ? generateTimeOptions(timestamp) : generateGenericTimeOptions();
    const defaultStartDate = timeOptions[0].value;
    const defaultEndDate = timeOptions[timeOptions.length - 1].value;
    const { colors } = useTheme();
    const [dropdownInFocus, setDropdownInFocus] = useState(event.timeConfig ? '' : 'Start Time');
    const [timeModalData, setTimeModalData] = useState<TimeModalSelection>(event.timeConfig ?? {
        isAppleEvent: false,
        allDay: false,
        startDate: undefined,
        endDate: undefined,
    });

    const onSaveInput = () => {
        const startDate = (timeModalData.allDay ? defaultStartDate : timeModalData.startDate) || defaultStartDate;
        const endDate = (timeModalData.allDay ? defaultEndDate : timeModalData.endDate) || defaultEndDate;
        onSaveItem({
            ...timeModalData,
            startDate,
            endDate
        });
    }

    const startDateOptionIndex = useMemo(() => {
        const index = timeOptions.findIndex(option => option.value === timeModalData.startDate);
        return index >= 0 ? index + 1 : 0; // Ensure fallback to 0 only when index is not found
    }, [timeOptions, timeModalData]);

    const validData =
        (!timeModalData.isAppleEvent && !!timeModalData.startDate) ||
        (timeModalData.isAppleEvent && timeModalData.allDay) ||
        (timeModalData.isAppleEvent && !!timeModalData.startDate && !!timeModalData.endDate);

    return (
        <Modal
            title={`${isValidTimestamp(timestamp) ? `${timestampToDayOfWeek(timestamp)} - ` : ''}${event.value}`}
            toggleModalOpen={toggleModalOpen}
            open={open}
            primaryButtonConfig={{
                label: 'Save',
                onClick: onSaveInput,
                disabled: !validData
            }}
        >
            <View style={styles.container}>
                <View style={globalStyles.spacedApart}>
                    <View style={{ width: '46%' }}>
                        {isValidTimestamp(timestamp) && (
                            <>
                                <CustomText type='collapseText'>Calendar Event</CustomText>
                                <Checkbox
                                    status={timeModalData.isAppleEvent ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setTimeModalData({ ...timeModalData, isAppleEvent: !timeModalData.isAppleEvent })
                                    }}
                                    color={colors.primary}
                                    uncheckedColor={colors.outline}
                                />
                            </>
                        )}
                    </View>
                    <View style={{ width: '46%' }}>
                        {timeModalData.isAppleEvent && (
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
                <View style={globalStyles.spacedApart}>
                    {!timeModalData.allDay && (
                        <View style={{ width: '46%' }}>
                            <CustomText type='collapseText'>Start Time</CustomText>
                            <TimeDropdown
                                onChange={(newVal: string | undefined) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        startDate: newVal
                                    })
                                    if (newVal)
                                        setDropdownInFocus('End Time');
                                }}
                                beginFocus={() => setDropdownInFocus('Start Time')}
                                endFocus={() => setDropdownInFocus('')}
                                options={timeOptions}
                                dropdownInFocus={dropdownInFocus}
                                placeholder='Start Time'
                                currTimestamp={timeModalData.startDate}
                                minOptionIndex={0}
                            />
                        </View>
                    )}
                    {!timeModalData.allDay && timeModalData.isAppleEvent && (
                        <View style={{ width: '46%' }}>
                            <CustomText type='collapseText'>End Time</CustomText>
                            <TimeDropdown
                                onChange={(newVal: string | undefined) => {
                                    setTimeModalData({
                                        ...timeModalData,
                                        endDate: newVal
                                    })
                                    if (newVal)
                                        setDropdownInFocus('');
                                }}
                                dropdownInFocus={dropdownInFocus}
                                options={timeOptions}
                                beginFocus={() => setDropdownInFocus('End Time')}
                                endFocus={() => setDropdownInFocus('')}
                                placeholder='End Time'
                                currTimestamp={timeModalData.endDate}
                                minOptionIndex={startDateOptionIndex}
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
        height: 'auto',
        gap: 10
    }
});

export default TimeModal;