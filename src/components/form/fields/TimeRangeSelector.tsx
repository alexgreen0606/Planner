import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import TimeValue from '@/components/text/TimeValue';
import { LINEAR_ANIMATION_CONFIG } from '@/constants/animations';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import DateRangeSelector from './DateRangeSelector';

const TimeSelectorContainer = Animated.createAnimatedComponent(View);
const DateSelectorContainer = Animated.createAnimatedComponent(View);

const StartTimeContainer = Animated.createAnimatedComponent(View);
const EndTimeContainer = Animated.createAnimatedComponent(View);
const StartDateContainer = Animated.createAnimatedComponent(View);
const EndDateContainer = Animated.createAnimatedComponent(View);

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
    const startTimeScale = useSharedValue(1);
    const endTimeScale = useSharedValue(1);
    const datesScale = useSharedValue(1);

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
                timeSelectorHeight.value = withTiming(210, LINEAR_ANIMATION_CONFIG);
                dateSelectorHeight.value = withTiming(0, LINEAR_ANIMATION_CONFIG);
                startTimeScale.value = withTiming(1.1, LINEAR_ANIMATION_CONFIG);
                endTimeScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                datesScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                break;
            case SelectorMode.END_TIME:
                timeSelectorHeight.value = withTiming(210, LINEAR_ANIMATION_CONFIG);
                dateSelectorHeight.value = withTiming(0, LINEAR_ANIMATION_CONFIG);
                startTimeScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                endTimeScale.value = withTiming(1.1, LINEAR_ANIMATION_CONFIG);
                datesScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                break;
            case SelectorMode.DATES:
                timeSelectorHeight.value = withTiming(0, LINEAR_ANIMATION_CONFIG);
                dateSelectorHeight.value = withTiming(360, LINEAR_ANIMATION_CONFIG);
                startTimeScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                endTimeScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                datesScale.value = withTiming(1.1, LINEAR_ANIMATION_CONFIG);
                break;
            default:
                timeSelectorHeight.value = withTiming(0, LINEAR_ANIMATION_CONFIG);
                dateSelectorHeight.value = withTiming(0, LINEAR_ANIMATION_CONFIG);
                startTimeScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                endTimeScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
                datesScale.value = withTiming(1, LINEAR_ANIMATION_CONFIG);
        }
    }, [mode]);

    const timeSelectorContainerStyle = useAnimatedStyle(() => ({
        height: timeSelectorHeight.value
    }));

    const dateSelectorContainerStyle = useAnimatedStyle(() => ({
        maxHeight: dateSelectorHeight.value
    }));

    const datesContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: datesScale.value }],
        marginBottom: datesScale.value
    }));

    const startTimeContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: startTimeScale.value }]
    }));

    const endTimeContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: endTimeScale.value }]
    }));

    const timestamp = mode === SelectorMode.START_TIME ?
        startTimestamp : endTimestamp;

    const updateTimestamp = mode === SelectorMode.START_TIME ?
        setStartTimestamp : setEndTimestamp;

    const getColor = (type: SelectorMode) => {
        return type === mode ? 'systemTeal' : 'label';
    }

    return (
        <View>
            <View className='flex-row items-center'>
                {startTimestamp && (
                    <View className='flex-1 items-center gap-1'>
                        <StartDateContainer style={datesContainerStyle}>
                            <TouchableOpacity onPress={() => toggleMode(SelectorMode.DATES)}>
                                <DateValue platformColor={getColor(SelectorMode.DATES)} isoTimestamp={startTimestamp} />
                            </TouchableOpacity>
                        </StartDateContainer>
                        <StartTimeContainer style={startTimeContainerStyle}>
                            <TouchableOpacity onPress={() => toggleMode(SelectorMode.START_TIME)}>
                                <TimeValue platformColor={getColor(SelectorMode.START_TIME)} isoTimestamp={startTimestamp} />
                            </TouchableOpacity>
                        </StartTimeContainer>
                    </View>
                )}
                {endTimestamp && (
                    <CustomText type='indicator'>
                        TO
                    </CustomText>
                )}
                {endTimestamp && (
                    <View className='flex-1 items-center gap-1'>
                        <EndDateContainer style={datesContainerStyle}>
                            <TouchableOpacity onPress={() => toggleMode(SelectorMode.DATES)}>
                                <DateValue platformColor={getColor(SelectorMode.DATES)} isoTimestamp={endTimestamp} />
                            </TouchableOpacity>
                        </EndDateContainer>
                        <EndTimeContainer style={endTimeContainerStyle}>
                            <TouchableOpacity onPress={() => toggleMode(SelectorMode.END_TIME)}>
                                <TimeValue platformColor={getColor(SelectorMode.END_TIME)} isoTimestamp={endTimestamp} />
                            </TouchableOpacity>
                        </EndTimeContainer>
                    </View>
                )}
            </View>
            <DateSelectorContainer
                className='overflow-hidden items-center'
                style={dateSelectorContainerStyle}
            >
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
            {timestamp && startTimestamp && mode !== SelectorMode.DATES && (
                <TimeSelectorContainer
                    className='overflow-hidden items-center'
                    style={timeSelectorContainerStyle}
                >
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
            )}
        </View>
    )
};

export default TimeRangeSelector;