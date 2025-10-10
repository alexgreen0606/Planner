import useAppTheme from '@/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

// ✅ 

const UpcomingDatesLayout = () => {
    const { CssColor: { background } } = useAppTheme();
    return (
        <Stack
            screenOptions={({ route: { params } }) => ({
                animation: 'fade',
                contentStyle: { backgroundColor: background },
                headerTransparent: true,
                headerLargeTitle: true,
                headerTitleStyle: { color: PlatformColor('label') as unknown as string },
                headerTitle: 'Upcoming Dates'
            })}
        >
            <Stack.Screen name='index' />
        </Stack>
    )
};

export default UpcomingDatesLayout;