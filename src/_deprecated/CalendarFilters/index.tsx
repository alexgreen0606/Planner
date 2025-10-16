import { calendarMapAtom } from '@/atoms/calendarAtoms';
import { useAtomValue } from 'jotai';
import React from 'react';
import { View } from 'react-native';
import CalendarFilter from './CalendarFilter';

// ✅ 

const CalendarFilters = () => {
    const calendarMap = useAtomValue(calendarMapAtom);

    const calendars = Object.values(calendarMap ?? {});

    return (
        <View className="px-4">
            <View className="flex flex-row flex-wrap justify-between">
                {calendars.map((calendar) => <CalendarFilter key={calendar.id} calendar={calendar} />)}
            </View>
        </View>
    );
}

export default CalendarFilters;