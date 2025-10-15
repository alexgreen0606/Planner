import CalendarFilters from '@/components/CalendarFilters';
import useAppTheme from '@/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { PlatformColor, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const UpcomingDatesLayout = () => {
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
            <CalendarFilters />
            <Stack
                screenOptions={{
                    animation: 'fade',
                    contentStyle: { backgroundColor: background },
                    headerTransparent: true,
                    headerLargeTitle: true,
                    headerTitleStyle: { color: PlatformColor('label') as unknown as string },
                    headerTitle: 'Upcoming Dates'
                }}
            >
                <Stack.Screen name='index' />
            </Stack>
        </View>
    )
};

export default UpcomingDatesLayout;