import React, { useEffect, useState } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import globalStyles from '../../../theme/globalStyles';
import CustomText from '../../../components/text/CustomText';
import DateValue from '../values/DateValue';
import { isoToTimeValue } from '../../timestampUtils';
import TimeValue from '../values/TimeValue';
import { TIME_MODAL_INPUT_HEIGHT } from '../../constants';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedSelectorContainer = Animated.createAnimatedComponent(View);

enum SelectorMode {
    DATE = 'date',
    TIME = 'time'
}

export interface DateSelectorProps {
    onDateChange: (newDate: Date) => void;
    date: Date;
    label: string;
    allDay: boolean;
    hide?: boolean;
}

const DateSelector = ({
    onDateChange,
    date,
    label,
    allDay,
    hide
}: DateSelectorProps) => {
    const [mode, setMode] = useState<SelectorMode | null>(null);
    const containerHeight = useSharedValue(0);

    // ---------- Utility Function ----------

    function toggleMode(newMode: SelectorMode) {
        if (mode === newMode) {
            setMode(null);
        } else {
            setMode(newMode);
        }
    }

    // ---------- Reactions to other input changes ----------

    useEffect(() => {
        if (allDay && !!mode) {
            setMode(SelectorMode.DATE)
        }
    }, [allDay]);

    // ---------- Animated Date Selector Handling ----------

    useEffect(() => {
        if (mode && !hide) {
            containerHeight.value = withTiming(210, { duration: 300 });
        } else {
            containerHeight.value = withTiming(0, { duration: 300 });
        }
    }, [mode, hide]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            height: containerHeight.value,
            overflow: 'hidden',
        };
    }, [containerHeight.value]);

    return (
        <View style={{ alignItems: 'center' }}>
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: TIME_MODAL_INPUT_HEIGHT }}>
                <View style={globalStyles.spacedApart}>
                    <CustomText type='standard' style={{ color: PlatformColor(hide ? 'tertiaryLabel' : 'label') }}>{label}</CustomText>
                    <View style={{ flex: 1 }} />
                    {!hide && (
                        <View style={{ ...globalStyles.verticallyCentered, transform: 'scale(1.1)', paddingRight: 16 }}>
                            {!allDay && (
                                <TouchableOpacity disabled={allDay} onPress={() => toggleMode(SelectorMode.TIME)} style={{ height: 25 }}>
                                    <TimeValue timeValue={isoToTimeValue(date.toISOString())} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => toggleMode(SelectorMode.DATE)} style={{ height: 25 }}>
                                <DateValue date={date} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
            <AnimatedSelectorContainer style={animatedContainerStyle}>
                <DatePicker
                    mode={mode ?? 'time'}
                    theme='dark'
                    date={date}
                    onDateChange={onDateChange}
                    minuteInterval={5}
                />
            </AnimatedSelectorContainer>
        </View>
    )
};

export default DateSelector;