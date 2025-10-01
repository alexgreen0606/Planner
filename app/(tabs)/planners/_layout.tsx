import PlannerHeader from '@/components/headers/PlannerHeader';
import UpperFadeOutView from '@/components/views/UpperFadeOutView';
import useAppTheme from '@/hooks/useAppTheme';
import { HEADER_HEIGHT, PLANNER_CAROUSEL_HEIGHT } from '@/lib/constants/miscLayout';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

// ✅ 

const Layout = () => {
    const { background } = useAppTheme();

    return (
        <Stack
            screenOptions={({ route: { params } }) => ({
                animation: 'fade',
                headerTransparent: true,
                contentStyle: { backgroundColor: PlatformColor(background) },
                header: () => (
                    <PlannerHeader datestamp={(params as TPlannerPageParams)?.datestamp ?? getTodayDatestamp()} />
                ),
                headerBackground: () => (
                    <UpperFadeOutView
                        solidHeight={PLANNER_CAROUSEL_HEIGHT}
                        totalHeight={PLANNER_CAROUSEL_HEIGHT + HEADER_HEIGHT + HEADER_HEIGHT}
                    />
                )
            })}
        >
            <Stack.Screen name='index' />
            <Stack.Screen name='[datestamp]' />
        </Stack>
    )
};

export default Layout;