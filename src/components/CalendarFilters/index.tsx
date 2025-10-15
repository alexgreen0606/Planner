import { useAtom } from 'jotai';
import React from 'react';
import { View } from 'react-native';
import CalendarFilter from './CalendarFilter';
import { calendarIdMapAtom } from '@/atoms/calendarAtoms';

// ✅ 

const CalendarFilters = () => {
    const [calendarIdMap] = useAtom(calendarIdMapAtom);

    const calendars = Object.values(calendarIdMap ?? {});

    return (
        <View className="px-4">
            <View className="flex flex-row flex-wrap justify-between">
                {calendars.map((calendar) => <CalendarFilter key={calendar.id} calendar={calendar} />)}
            </View>
        </View>
    );
}

export default CalendarFilters;