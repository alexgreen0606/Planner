import PlannerHeader from '@/components/PlannerHeader/PlannerHeader';
import useAppTheme from '@/hooks/useAppTheme';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { Stack, useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

// ✅ 

const PlannersLayout = () => {
    const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();

    const { CssColor: { background } } = useAppTheme();

    return (
        <View className='flex-1' style={{backgroundColor: background}}>
            <PlannerHeader datestamp={datestamp ?? getTodayDatestamp()} />
            <Stack screenOptions={{
                animation: 'fade',
                headerShown: false,
                contentStyle: {
                    backgroundColor: background
                }
            }} />
        </View>
    )
};

export default PlannersLayout;