import { recurringPlannerIdAtom } from '@/atoms/recurringPlannerId';
import { HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { useAtom } from 'jotai';
import React from 'react';
import { View } from 'react-native';
import GenericIcon from '../icons/Icon';
import GlassIconButton from '../icons/customButtons/GlassIconButton';
import CustomText from '../text/CustomText';

// ✅ 

const RecurringPlannerBanner = () => {
    const [recurringPlannerId, setRecurringPlannerId] = useAtom(recurringPlannerIdAtom);

    return (
        <View
            className='flex-row items-start justify-between w-full px-2'
            style={{ height: HEADER_HEIGHT }}
        >
            <GlassIconButton systemImage='chevron.left' onPress={() => null} />

            <View className='flex-row w-40 gap-1 items-center'>
                <CustomText variant='pageLabel'>
                    {recurringPlannerId}
                </CustomText>
            </View>

            <GlassIconButton systemImage='chevron.right' onPress={() => null} />
        </View>
    )
};

export default RecurringPlannerBanner;