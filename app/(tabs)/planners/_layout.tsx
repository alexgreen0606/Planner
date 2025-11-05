import PlannerHeader from '@/components/headers/PlannerHeader/PlannerHeader';
import ColorFadeView from '@/components/views/ColorFadeView';
import useAppTheme from '@/hooks/useAppTheme';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { Stack } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const PlannersLayout = () => {
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const { CssColor: { background }, ColorArray: { Screen: { upper } } } = useAppTheme();
    return (
        <Stack screenOptions={({ route: { params } }) => ({
            animation: 'fade',
            headerShown: true,
            headerTransparent: true,
            headerBackground: () => (
                <ColorFadeView totalHeight={TOP_SPACER + 32} solidHeight={TOP_SPACER} colors={upper} />
            ),
            header: () => (params as TPlannerPageParams)?.datestamp && <PlannerHeader datestamp={(params as TPlannerPageParams)?.datestamp} />,
            contentStyle: {
                backgroundColor: background
            }
        })} />
    )
};

export default PlannersLayout;