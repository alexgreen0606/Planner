import { filteredUpcomingDatesMapAtom } from '@/atoms/calendarAtoms';
import EmptyPageLabel from '@/components/EmptyLabel';
import UpcomingDateCard from '@/components/UpcomingDateCard';
import { useExternalDataContext } from '@/providers/ExternalDataProvider';
import { useScrollRegistry } from '@/providers/ScrollRegistry';
import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useEffect } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

const UpcomingDatesPage = () => {
    const { top: TOP_SPACER } = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const pathname = usePathname();

    const { onReloadPage, loadingPathnames } = useExternalDataContext();
    const scrollRegistry = useScrollRegistry();

    const filteredUpcomingDates = useAtomValue(filteredUpcomingDatesMapAtom);

    const scrollY = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            scrollY.value = e.contentOffset.y;
        }
    });

    const contentInset = headerHeight - TOP_SPACER;

    useEffect(() => {
        scrollRegistry.set('upcomingDates', scrollY);
    }, []);

    return (
        <View className='flex-1'>
            <Animated.ScrollView
                refreshControl={(
                    <RefreshControl
                        refreshing={loadingPathnames.has(pathname)}
                        onRefresh={onReloadPage}
                    />
                )}
                onScroll={onScroll}
                contentInset={{ top: contentInset }}
                contentOffset={{ x: 0, y: -contentInset }}
                scrollIndicatorInsets={{ top: contentInset }}
                contentContainerClassName='pb-4'
                className="flex-1"
            >
                {Object.entries(filteredUpcomingDates).map(([datestamp, events], index) => (
                    <UpcomingDateCard
                        key={`${datestamp}-upcoming-date`}
                        datestamp={datestamp}
                        events={events}
                        index={index}
                    />
                ))}
            </Animated.ScrollView>

            {Object.entries(filteredUpcomingDates).length === 0 && (
                <EmptyPageLabel
                    label='No upcoming dates'
                />
            )}
        </View>
    );
};

export default UpcomingDatesPage;