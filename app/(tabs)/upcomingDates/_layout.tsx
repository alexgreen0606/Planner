import { activeCalendarFiltersAtom, calendarMapAtom, primaryCalendarAtom, toggleCalendarFilterAtom } from '@/atoms/calendarAtoms';
import PopupList from '@/components/PopupList';
import useAppTheme from '@/hooks/useAppTheme';
import { calendarIconMap } from '@/lib/constants/calendarIcons';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { hexToRgba } from '@/utils/colorUtils';
import { Host, Image } from '@expo/ui/swift-ui';
import { Stack } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { MotiView } from 'moti';
import { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';

// ✅ 

const UpcomingDatesLayout = () => {
    const activeCalendarFilters = useAtomValue(activeCalendarFiltersAtom);
    const primaryCalendar = useAtomValue(primaryCalendarAtom);
    const calendarMap = useAtomValue(calendarMapAtom);
    const toggleCalendarFilter = useSetAtom(toggleCalendarFilterAtom);

    const { CssColor: { background } } = useAppTheme();

    const { calendars, barWidth } = useMemo(() => {
        const uniqueCalendars = Array.from(
            new Map(Object.values(calendarMap).map((cal) => [cal.id, cal])).values()
        );
        const mappedCalendars = uniqueCalendars.map((calendar) => {
            const iconName = calendarIconMap[calendar.title] ?? "calendar";
            return { ...calendar, iconName };
        });
        mappedCalendars.sort((a, b) =>
            a.id === primaryCalendar?.id ? -1 : b.id === primaryCalendar?.id ? 1 : 0
        );

        return {
            calendars: mappedCalendars,
            barWidth: mappedCalendars.length * 35 + 20
        };
    }, [calendarMap, calendarIconMap, primaryCalendar]);

    const FilterOverflow = () => (
        <PopupList
            systemImage='line.3.horizontal.decrease'
            actions={calendars.map((calendar) => ({
                title: calendar.title,
                type: EPopupActionType.BUTTON,
                systemImage: calendar.iconName,
                color: handleGetIsCalendarFilterActive(calendar.id) ? calendar.color : hexToRgba(calendar.color),
                onPress: () => toggleCalendarFilter(calendar.id),
            }))}
        />
    );

    const FilterBar = () => (
        <View className='flex-row' style={{ width: barWidth, paddingHorizontal: 10 }}>
            {calendars.map((calendar) => (
                <MotiView
                    animate={{ opacity: handleGetIsCalendarFilterActive(calendar.id) ? 1 : 0.4 }}
                    key={`${calendar.id}-header-icon`}
                >
                    <Host style={{ height: 35, width: 35 }}>
                        <Image
                            onPress={() => toggleCalendarFilter(calendar.id)}
                            systemName={calendar.iconName}
                            color={calendar.color}
                        />
                    </Host>
                </MotiView>
            )
            )}
        </View>
    );

    function handleGetIsCalendarFilterActive(calendarId: string) {
        return activeCalendarFilters.size === 0 || activeCalendarFilters.has(calendarId)
    }

    return (
        <Stack
            screenOptions={{
                contentStyle: { backgroundColor: background },
                headerTransparent: true,
                headerLargeTitle: true,
                headerTitleStyle: { color: PlatformColor('label') as unknown as string },
                headerTitle: 'Upcoming Dates',
                headerRight: calendars.length > 5 ? FilterOverflow : FilterBar
            }}
        >
            <Stack.Screen name='index' />
        </Stack>
    )
};

export default UpcomingDatesLayout;