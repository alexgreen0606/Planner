import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import TimeValue from '@/components/text/TimeValue';
import { LINEAR_ANIMATION_CONFIG } from '@/lib/constants/animations';
import { datestampToMidnightDate, getTodayDatestamp } from '@/utils/dateUtils';
import { DateTime } from 'luxon';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import DateRangeSelector from './DateRangeSelector';

const InputContainer = Animated.createAnimatedComponent(View);
const StartTimeContainer = Animated.createAnimatedComponent(View);
const EndTimeContainer = Animated.createAnimatedComponent(View);
const StartDateContainer = Animated.createAnimatedComponent(View);
const EndDateContainer = Animated.createAnimatedComponent(View);

enum SelectorMode {
    DATES = 'dates',
    START_TIME = 'start_time',
    END_TIME = 'end_time'
}

const SELECTOR_MAX_HEIGHTS = {
    OPEN: 400,
    CLOSED: 0
} as const;

const FOCUSED_VALUE_SCALES = {
    NORMAL: 1,
    HIGHLIGHTED: 1.1
} as const;

const DEFAULT_ANIMATION_CONFIG = {
    inputContainerMaxHeight: SELECTOR_MAX_HEIGHTS.CLOSED,
    startTimeScale: FOCUSED_VALUE_SCALES.NORMAL,
    endTimeScale: FOCUSED_VALUE_SCALES.NORMAL,
    datesScale: FOCUSED_VALUE_SCALES.NORMAL
} as const;

const MODE_ANIMATIONS = {
    [SelectorMode.START_TIME]: {
        inputContainerMaxHeight: SELECTOR_MAX_HEIGHTS.OPEN,
        startTimeScale: FOCUSED_VALUE_SCALES.HIGHLIGHTED,
        endTimeScale: FOCUSED_VALUE_SCALES.NORMAL,
        datesScale: FOCUSED_VALUE_SCALES.NORMAL
    },
    [SelectorMode.END_TIME]: {
        inputContainerMaxHeight: SELECTOR_MAX_HEIGHTS.OPEN,
        startTimeScale: FOCUSED_VALUE_SCALES.NORMAL,
        endTimeScale: FOCUSED_VALUE_SCALES.HIGHLIGHTED,
        datesScale: FOCUSED_VALUE_SCALES.NORMAL
    },
    [SelectorMode.DATES]: {
        inputContainerMaxHeight: SELECTOR_MAX_HEIGHTS.OPEN,
        startTimeScale: FOCUSED_VALUE_SCALES.NORMAL,
        endTimeScale: FOCUSED_VALUE_SCALES.NORMAL,
        datesScale: FOCUSED_VALUE_SCALES.HIGHLIGHTED
    }
} as const;

type StoredTimeInfo = {
    hour: number;
    minute: number;
}

export interface TimeRangeSelectorProps {
    startIso: string | null;
    endIso: string | null;
    onChange: (
        start: string | null,
        end: string | null
    ) => void;
    allDay?: boolean;
    multiDay?: boolean;
    openInputTrigger?: boolean;
}

const TimeRangeSelector = ({
    startIso,
    endIso,
    onChange,
    allDay,
    multiDay,
    openInputTrigger
}: TimeRangeSelectorProps) => {
    const [isInputFieldOpen, setIsInputFieldOpen] = useState(false);
    const [mode, setMode] = useState<SelectorMode>(SelectorMode.START_TIME);
    const inputContainerMaxHeight = useSharedValue(0);
    const startTimeScale = useSharedValue(1);
    const endTimeScale = useSharedValue(1);
    const datesScale = useSharedValue(1);

    // Store the last known times
    const storedStartTime = useRef<StoredTimeInfo | null>(null);
    const storedEndTime = useRef<StoredTimeInfo | null>(null);


    const isoInEdit = mode === SelectorMode.START_TIME ?
        startIso : endIso;
    const setIsoInEdit = mode === SelectorMode.START_TIME ?
        (start: string | null) => onChange(start, endIso) :
        (end: string | null) => onChange(startIso, end);

    // ---------- Utility Functions ----------

    function getValueColor(type: SelectorMode) {
        return isInputFieldOpen && type === mode ? 'systemTeal' : 'label';
    }

    function toggleMode(newMode: SelectorMode) {
        if (mode === SelectorMode.DATES && !startIso) return;

        if (newMode === mode && isInputFieldOpen) {
            setIsInputFieldOpen(false);
        } else {
            setMode(newMode);
            setIsInputFieldOpen(true);
        }
    }

    function updateDateTime(
        iso: string | null,
        newTime: DateTime
    ): string {
        const dateTime = DateTime.fromISO(iso ?? DateTime.now().toISO());
        return dateTime.set({
            hour: newTime.hour,
            minute: newTime.minute,
            second: newTime.second,
            millisecond: newTime.millisecond
        }).toISO()!;
    }

    function resetTimesToMidnight() {
        const midnightDate = datestampToMidnightDate(getTodayDatestamp());
        const newTime = DateTime.fromJSDate(midnightDate);
        const newStart = updateDateTime(startIso, newTime);
        const newEnd = updateDateTime(endIso, newTime);

        onChange(newStart, newEnd);
    }

    function handleDatesChange(
        startDatestamp: string | null,
        endDatestamp: string | null
    ) {
        if (!startDatestamp || !endDatestamp) {

            // Store the current times before clearing
            if (startIso) {
                const startDateTime = DateTime.fromISO(startIso);
                storedStartTime.current = {
                    hour: startDateTime.hour,
                    minute: startDateTime.minute
                };
            }
            if (endIso) {
                const endDateTime = DateTime.fromISO(endIso);
                storedEndTime.current = {
                    hour: endDateTime.hour,
                    minute: endDateTime.minute
                };
            }

            onChange(null, null);
            return;
        }

        // Use stored times if available, otherwise use current times or defaults
        const startTimeToUse = storedStartTime.current || 
            (startIso ? DateTime.fromISO(startIso) : DateTime.now());
        const endTimeToUse = storedEndTime.current || 
            (endIso ? DateTime.fromISO(endIso) : DateTime.now());

        const newStartDateTime = DateTime.fromISO(startDatestamp).set({
            hour: storedStartTime.current?.hour ?? startTimeToUse.hour ?? 0,
            minute: storedStartTime.current?.minute ?? startTimeToUse.minute ?? 0,
            second: 0,
            millisecond: 0
        });
        const newEndDateTime = DateTime.fromISO(endDatestamp).set({
            hour: storedEndTime.current?.hour ?? endTimeToUse.hour ?? 0,
            minute: storedEndTime.current?.minute ?? endTimeToUse.minute ?? 0,
            second: 0,
            millisecond: 0
        });

        onChange(newStartDateTime.toISO(), newEndDateTime.toISO());
    }

    function handleTimeChange(date: Date, iso: string) {
        const newTime = DateTime.fromJSDate(date);
        const updatedIso = updateDateTime(iso, newTime);

        setIsoInEdit(updatedIso);
    }

    function applyAnimationConfig(config: typeof DEFAULT_ANIMATION_CONFIG) {
        Object.entries(config).forEach(([key, value]) => {
            switch (key) {
                case 'inputContainerMaxHeight':
                    inputContainerMaxHeight.value = withTiming(value, LINEAR_ANIMATION_CONFIG);
                    break;
                case 'startTimeScale':
                    startTimeScale.value = withTiming(value, LINEAR_ANIMATION_CONFIG);
                    break;
                case 'endTimeScale':
                    endTimeScale.value = withTiming(value, LINEAR_ANIMATION_CONFIG);
                    break;
                case 'datesScale':
                    datesScale.value = withTiming(value, LINEAR_ANIMATION_CONFIG);
                    break;
            }
        });
    };

    // ---------- Reactions ----------

    useEffect(() => {
        if (allDay) {
            resetTimesToMidnight();
            setMode(SelectorMode.DATES);
            setIsInputFieldOpen(false);
        }
    }, [allDay]);

    useEffect(() => {
        if (openInputTrigger) setIsInputFieldOpen(true);
    }, [openInputTrigger]);

    useEffect(() => {
        const animationConfig: any = MODE_ANIMATIONS[mode];
        applyAnimationConfig(isInputFieldOpen ? animationConfig : DEFAULT_ANIMATION_CONFIG);
    }, [mode, isInputFieldOpen]);

    // ------------- Animations -------------

    const inputContainerStyle = useAnimatedStyle(() => ({
        maxHeight: inputContainerMaxHeight.value
    }));

    const datesContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: datesScale.value }]
    }));

    const startTimeContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: startTimeScale.value }]
    }));

    const endTimeContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: endTimeScale.value }]
    }));

    return (
        <View>
            <View className='flex-row items-center'>
                {startIso && (
                    <View className='flex-1 items-center gap-1'>
                        <StartDateContainer style={datesContainerStyle}>
                            <TouchableOpacity
                                onPress={() => toggleMode(SelectorMode.DATES)}
                            >
                                <DateValue
                                    isoTimestamp={startIso}
                                    platformColor={getValueColor(SelectorMode.DATES)}
                                />
                            </TouchableOpacity>
                        </StartDateContainer>
                        {!allDay && (
                            <StartTimeContainer style={startTimeContainerStyle}>
                                <TouchableOpacity
                                    onPress={() => toggleMode(SelectorMode.START_TIME)}
                                >
                                    <TimeValue
                                        isoTimestamp={startIso}
                                        platformColor={getValueColor(SelectorMode.START_TIME)}
                                    />
                                </TouchableOpacity>
                            </StartTimeContainer>
                        )}
                    </View>
                )}
                {endIso && multiDay && (
                    <CustomText type='indicator'>
                        TO
                    </CustomText>
                )}
                {endIso && multiDay && (
                    <View className='flex-1 items-center gap-1'>
                        <EndDateContainer style={datesContainerStyle}>
                            <TouchableOpacity
                                onPress={() => toggleMode(SelectorMode.DATES)}
                            >
                                <DateValue
                                    isoTimestamp={endIso}
                                    platformColor={getValueColor(SelectorMode.DATES)}
                                />
                            </TouchableOpacity>
                        </EndDateContainer>
                        {!allDay && (
                            <EndTimeContainer style={endTimeContainerStyle}>
                                <TouchableOpacity
                                    onPress={() => toggleMode(SelectorMode.END_TIME)}
                                >
                                    <TimeValue
                                        isoTimestamp={endIso}
                                        platformColor={getValueColor(SelectorMode.END_TIME)}
                                    />
                                </TouchableOpacity>
                            </EndTimeContainer>
                        )}
                    </View>
                )}
            </View>
            <InputContainer
                className='overflow-hidden items-center'
                style={inputContainerStyle}
            >
                {mode === SelectorMode.DATES ? (
                    <DateRangeSelector
                        startDatestamp={startIso ?
                            DateTime.fromISO(startIso).toFormat('yyyy-MM-dd') : null
                        }
                        endDatestamp={endIso ?
                            DateTime.fromISO(endIso).toFormat('yyyy-MM-dd') : null
                        }
                        onChange={handleDatesChange}
                        multiDay={multiDay}
                    />
                ) : isoInEdit && (
                    <DatePicker
                        mode='time'
                        theme='dark'
                        date={DateTime.fromISO(isoInEdit).toJSDate()}
                        onDateChange={(date) => handleTimeChange(date, isoInEdit)}
                        minuteInterval={5}
                        minimumDate={
                            mode === SelectorMode.END_TIME && startIso
                                ? DateTime.fromISO(startIso).plus({ minutes: 5 }).toJSDate()
                                : undefined
                        }
                    />
                )}
            </InputContainer>
        </View>
    )
};

export default TimeRangeSelector;