import { userAccessAtom } from '@/atoms/userAccess';
import EmptyLabel from '@/components/EmptyLabel';
import Countdowns from '@/components/lists/Countdowns';
import { EAccess } from '@/lib/enums/EAccess';
import { useAtomValue } from 'jotai';
import React from 'react';
import { Linking, View } from 'react-native';

// ✅ 

const CountdownPermissionsWrapper = () => {
    const userAccess = useAtomValue(userAccessAtom);
    return userAccess.get(EAccess.CALENDAR) ? (
        <Countdowns />
    ) : (
        <View className='flex-1 items-center justify-center'>
            <EmptyLabel
                label='Calendar access required. Click here to open settings.'
                onPress={() => {
                    Linking.openSettings();
                }}
                iconConfig={{
                    type: 'alert',
                    platformColor: 'tertiaryLabel'
                }}
            />
        </View>
    )
};

export default CountdownPermissionsWrapper;