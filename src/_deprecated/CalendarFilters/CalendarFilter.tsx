import { calendarIconMap } from '@/lib/constants/calendarIcons';
import { Calendar } from 'expo-calendar';
import { useAtomValue, useSetAtom } from 'jotai';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { LayoutChangeEvent, TouchableOpacity, View } from 'react-native';
import Icon from '../icons/Icon';
import CustomText from '../text/CustomText';
import { activeCalendarFiltersAtom, toggleCalendarFilterAtom } from '@/atoms/calendarAtoms';
import { PRESSABLE_OPACITY } from '@/lib/constants/generic';

// ✅ 

type TCalendarFilterProps = {
    calendar: Calendar;
};

const CalendarFilter = ({ calendar }: TCalendarFilterProps) => {
    const activeFilters = useAtomValue(activeCalendarFiltersAtom);
    const toggleFilter = useSetAtom(toggleCalendarFilterAtom);

    const [textWidth, setTextWidth] = useState(0);

    const isActive = activeFilters.has(calendar.id);

    function handleLayout(e: LayoutChangeEvent) {
        setTextWidth(e.nativeEvent.layout.width);
    }

    function handlePress() {
        toggleFilter(calendar.id);
    }

    return (
        <TouchableOpacity
            activeOpacity={PRESSABLE_OPACITY}
            onPress={handlePress}
            className='items-center gap-0.5'
        >
            <View className='flex-row gap-1 items-center' onLayout={handleLayout}>
                <Icon size={14} name={calendarIconMap[calendar.title]} color={calendar.color} />
                <CustomText
                    variant='calendarFilter'
                    customStyle={{ color: calendar.color }}
                >
                    {calendar.title}
                </CustomText>
            </View>
            {textWidth > 0 && (
                <MotiView
                    style={{ backgroundColor: calendar.color }}
                    from={{ width: 0 }}
                    animate={{ width: isActive ? textWidth : 0 }}
                    className='rounded h-[1px]'
                />
            )}
        </TouchableOpacity>
    )
};

export default CalendarFilter;