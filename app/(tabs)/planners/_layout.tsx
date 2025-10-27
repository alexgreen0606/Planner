import PlannerHeader from '@/components/headers/NewHeader';
import useAppTheme from '@/hooks/useAppTheme';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { Stack, useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const PlannersLayout = () => {
    const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const { CssColor: { background } } = useAppTheme();

    return (
        <View
            className='flex-1'
            style={{
                backgroundColor: background,
                paddingTop: TOP_SPACER
            }}
        >
            <PlannerHeader datestamp={datestamp ?? getTodayDatestamp()} />
            <Stack screenOptions={{
                animation: 'fade',
                headerTitle: '',
                headerBackVisible: false,
                headerShown: false,
                headerTransparent: true,
                contentStyle: {
                    backgroundColor: background
                }
            }} />
        </View>
    );
};

export default PlannersLayout;