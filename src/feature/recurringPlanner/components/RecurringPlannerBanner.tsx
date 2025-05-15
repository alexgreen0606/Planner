import CustomText from '@/components/text/CustomText';
import React from 'react';
import { View } from 'react-native';

interface RecurringPlannerBannerProps {
    title: string;
}

const RecurringPlannerBanner = ({ title }: RecurringPlannerBannerProps) =>
    <View className='flex-row justify-between items-center w-full'>
        <CustomText type='header'>
            {title}
        </CustomText>
    </View>

export default RecurringPlannerBanner;
