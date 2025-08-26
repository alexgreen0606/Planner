import { userAccessAtom } from '@/atoms/userAccess';
import EmptyLabel from '@/components/EmptyLabel';
import Countdowns from '@/components/lists/Countdowns';
import { EAccess } from '@/lib/enums/EAccess';
import { useAtomValue } from 'jotai';
import React from 'react';
import { View } from 'react-native';

// ✅ 

const CountdownPermissionsWrapper = () => {
    const userAccess = useAtomValue(userAccessAtom);

    return userAccess.get(EAccess.CALENDAR) ? (
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