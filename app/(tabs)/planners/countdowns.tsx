import { hasCalendarAccessAtom } from '@/atoms/calendarEvents';
import Countdowns from '@/components/countdowns';
import EmptyLabel from '@/components/sortedList/EmptyLabel';
import { useAtomValue } from 'jotai';
import React from 'react';
import { View } from 'react-native';

const CountdownPermissionsWrapper = () => {
    const hasCalendarAccess = useAtomValue(hasCalendarAccessAtom);

    return hasCalendarAccess ? (
        <Countdowns />
    ) : (
        <View className='flex-1 items-center justify-center'>
        <EmptyLabel
            label='Countdowns requires calendar access.'
            onPress={() => null} // TODO: open setting on click
            iconConfig={{
                type: 'alert'
            }}
        />
        </View>
    )
};

export default CountdownPermissionsWrapper;