import { activeCalendarFiltersAtom, calendarMapAtom, toggleCalendarFilterAtom } from '@/atoms/calendarAtoms';
import useAppTheme from '@/hooks/useAppTheme';
import { calendarIconMap } from '@/lib/constants/calendarIcons';
import { Host, HStack, Image } from '@expo/ui/swift-ui';
import { Stack } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { PlatformColor } from 'react-native';

// ✅ 

const UpcomingDatesLayout = () => {
    const activeCalendarFilters = useAtomValue(activeCalendarFiltersAtom);
    const toggleCalendarFilter = useSetAtom(toggleCalendarFilterAtom);
    const calendarMap = useAtomValue(calendarMapAtom);

    const { CssColor: { background } } = useAppTheme();

    return (
        <Stack
            screenOptions={{
                animation: 'fade',
                contentStyle: { backgroundColor: background },
                headerTransparent: true,
                headerLargeTitle: true,
                headerTitleStyle: { color: PlatformColor('label') as unknown as string },
                headerTitle: 'Upcoming Dates',
                headerRight: () => (
                    <Host style={{ width: 180, height: 35 }}>
                        <HStack spacing={12}>
                            {Object.entries(calendarIconMap).map(([calendarName, iconName]) => {
                                const calendar = calendarMap[calendarName];
                                if (!calendar) return null;

                                const isActive = activeCalendarFilters.has(calendar.id);
                                const color = isActive
                                    ? calendar.color
                                    : PlatformColor('tertiaryLabel') as unknown as string;

                                return (
                                    <Image
                                        key={`${calendarName}-header-icon`}
                                        onPress={() => toggleCalendarFilter(calendar.id)}
                                        systemName={iconName} color={color}
                                    />
                                )
                            })}
                        </HStack>
                    </Host>
                )
            }}
        >
            <Stack.Screen name='index' />
        </Stack>
    )
};

export default UpcomingDatesLayout;