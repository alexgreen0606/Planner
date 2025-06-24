import { userAccessAtom } from '@/atoms/userAccess';
import Countdowns from '@/components/countdowns';
import EmptyLabel from '@/components/sortedList/EmptyLabel';
import { useTextfieldFallbackSave } from '@/hooks/useTextfieldFallbackSave';
import { EAccess } from '@/lib/enums/EAccess';
import { saveCountdown } from '@/utils/countdownUtils';
import { useAtomValue } from 'jotai';
import React from 'react';
import { View } from 'react-native';

const CountdownPermissionsWrapper = () => {
    const userAccess = useAtomValue(userAccessAtom);

    // Saves the textfield countdown if the user clicks away
    useTextfieldFallbackSave(saveCountdown);

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