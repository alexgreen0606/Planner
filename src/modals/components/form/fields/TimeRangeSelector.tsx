import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import TimeValue from '../../../../foundation/calendarEvents/components/values/TimeValue';
import CustomText from '../../../../foundation/components/text/CustomText';
import DateValue from '../../../../foundation/calendarEvents/components/values/DateValue';
import { DateTime } from 'luxon';
import globalStyles from '../../../../theme/globalStyles';
import DateRangeSelector from './DateRangeSelector';

const TimeSelectorContainer = Animated.createAnimatedComponent(View);
const DateSelectorContainer = Animated.createAnimatedComponent(View);

enum SelectorMode {
    DATES = 'dates',
    START_TIME = 'start_time',
    END_TIME = 'end_time'
}

export interface TimeRangeSelectorProps {
    startTimestamp: string | null;
    endTimestamp: string | null;
    setStartTimestamp: (timestamp: string | null) => void;
    setEndTimestamp: (timestamp: string | null) => void;
}

const TimeRangeSelector = ({
    startTimestamp,
    endTimestamp,
    setStartTimestamp,
    setEndTimestamp,
}: TimeRangeSelectorProps) => {
    const [mode, setMode] = useState<SelectorMode | null>(null);
    const timeSelectorHeight = useSharedValue(0);
    const dateSelectorHeight = useSharedValue(0);

    // ---------- Utility Function ----------

    function toggleMode(newMode: SelectorMode) {
        if (mode === newMode) {
            setMode(null);
        } else {
            setMode(newMode);
        }
    }

    // ---------- Reactions to other input changes ----------

    // TODO: trigger hiding the input fields when all day is initiated
    // useEffect(() => {
    //     if (allDay && !!mode) {
    //         setMode(SelectorMode.DATES)
    //     }
    // }, [allDay]);

    // ---------- Animated Date Selector Handling ----------

    useEffect(() => {
        switch (mode) {
            case SelectorMode.START_TIME:
            case SelectorMode.END_TIME:
                timeSelectorHeight.value = withTiming(210, { duration: 300 });
                dateSelectorHeight.value = withTiming(0, { duration: 300 });
                break;
            case SelectorMode.DATES:
                timeSelectorHeight.value = withTiming(0, { duration: 300 });
                dateSelectorHeight.value = withTiming(360, { duration: 300 });
                break;
            default:
                timeSelectorHeight.value = withTiming(0, { duration: 300 });
                dateSelectorHeight.value = withTiming(0, { duration: 300 });
        }
    }, [mode]);

    const timeSelectorContainerStyle = useAnimatedStyle(() => ({
        height: timeSelectorHeight.value,
        overflow: 'hidden',
        alignItems: 'center'
    }));

    const dateSelectorContainerStyle = useAnimatedStyle(() => ({
        height: dateSelectorHeight.value,
        overflow: 'hidden',
        alignItems: 'center'
    }));

    const timestamp = mode === SelectorMode.START_TIME ?
        startTimestamp : endTimestamp;

    const updateTimestamp = mode === SelectorMode.START_TIME ?
        setStartTimestamp : setEndTimestamp;

    const getColor = (type: SelectorMode) => {
        return type === mode ? 'systemBlue' : 'label';
    }

    console.log(startTimestamp, endTimestamp)

    return (
        <View>
            <View>
                <TouchableOpacity onPress={() => toggleMode(SelectorMode.DATES)} style={styles.dates}>
                    {startTimestamp && (
                        <DateValue platformColor={getColor(SelectorMode.DATES)} isoTimestamp={startTimestamp} />
                    )}
                    {endTimestamp && (
                        <View style={styles.through}>
                            <CustomText type='indicator2'>
                                to
                            </CustomText>
                        </View>
                    )}
                    {endTimestamp && (
                        <DateValue platformColor={getColor(SelectorMode.DATES)} isoTimestamp={endTimestamp} />
                    )}
                </TouchableOpacity>
                <DateSelectorContainer style={dateSelectorContainerStyle}>
                    <DateRangeSelector
                        startDate={startTimestamp ? DateTime.fromISO(startTimestamp).toFormat('yyyy-MM-dd') : null}
                        endDate={endTimestamp ? DateTime.fromISO(endTimestamp).toFormat('yyyy-MM-dd') : null}
                        onChange={(newStartDate: string | null, newEndDate: string | null) => {
                            if (!newStartDate || !newEndDate) {
                                setStartTimestamp(null);
                                setEndTimestamp(null);
                                return;
                            }

                            // Parse current timestamps to get the times
                            const currentStartDateTime = startTimestamp ? DateTime.fromISO(startTimestamp) : DateTime.now();
                            const currentEndDateTime = endTimestamp ? DateTime.fromISO(endTimestamp) : DateTime.now();

                            // Create new DateTime objects with new dates but preserving times
                            const newStartDateTime = DateTime.fromISO(newStartDate).set({
                                hour: currentStartDateTime.hour,
                                minute: currentStartDateTime.minute,
                                second: currentStartDateTime.second,
                                millisecond: currentStartDateTime.millisecond
                            });

                            const newEndDateTime = DateTime.fromISO(newEndDate).set({
                                hour: currentEndDateTime.hour,
                                minute: currentEndDateTime.minute,
                                second: currentEndDateTime.second,
                                millisecond: currentEndDateTime.millisecond
                            });

                            // Update the timestamps
                            setStartTimestamp(newStartDateTime.toISO());
                            setEndTimestamp(newEndDateTime.toISO());
                        }}
                    />
                </DateSelectorContainer>
            </View>
            {timestamp && startTimestamp && (
                <View>
                    <View style={globalStyles.spacedApart}>
                        <TouchableOpacity onPress={() => toggleMode(SelectorMode.START_TIME)}>
                            <TimeValue platformColor={getColor(SelectorMode.START_TIME)} isoTimestamp={startTimestamp} />
                        </TouchableOpacity>
                        {endTimestamp && (
                            <TouchableOpacity onPress={() => toggleMode(SelectorMode.END_TIME)}>
                                <TimeValue platformColor={getColor(SelectorMode.END_TIME)} isoTimestamp={endTimestamp} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TimeSelectorContainer style={timeSelectorContainerStyle}>
                        <DatePicker
                            mode='time'
                            theme='dark'
                            date={DateTime.fromISO(timestamp).toJSDate()}
                            onDateChange={(date) => {
                                // Parse the current timestamp and new date using luxon
                                const currentDateTime = DateTime.fromISO(timestamp);
                                const newTime = DateTime.fromJSDate(date);

                                // Create a new DateTime with the original date but new time
                                const updatedDateTime = currentDateTime.set({
                                    hour: newTime.hour,
                                    minute: newTime.minute,
                                    second: newTime.second,
                                    millisecond: newTime.millisecond
                                });

                                // Update the timestamp
                                updateTimestamp(updatedDateTime.toISO());
                            }}
                            minuteInterval={5}
                        />
                    </TimeSelectorContainer>
                </View>
            )}
        </View>
    )
};

const styles = StyleSheet.create({
    dates: {
        flexDirection: 'row',
        position: 'relative',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 4
    },
    through: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    }
})

export default TimeRangeSelector;