import PlannerCarousel from '@/components/PlannerCarousel';
import useAppTheme from '@/hooks/useAppTheme';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { Stack, useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const PlannerLayout = () => {
    const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const { background } = useAppTheme();

    return (
        <View
            className='flex-1'
            style={{
                backgroundColor: PlatformColor(background),
                paddingTop: TOP_SPACER
            }}
        >
            <PlannerCarousel datestamp={datestamp ?? getTodayDatestamp()} />
            <Stack screenOptions={{
                animation: 'fade',
                headerShown: false,
                contentStyle: {
                    backgroundColor: PlatformColor(background)
                }
            }} />
        </View>
    );
};

export default PlannerLayout;