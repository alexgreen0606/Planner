import { useHeaderHeight } from '@react-navigation/elements';
import { usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useEffect } from 'react';
import { RefreshControl, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { filteredUpcomingDateEntriesAtom } from '@/atoms/planner/calendarAtoms';
import EmptyPageLabel from '@/components/EmptyLabel';
import UpcomingDateCard from '@/components/UpcomingDateCard';
import { UPCOMING_DATES_SCROLL_KEY } from '@/lib/constants/scrollRegistryKeys';
import { useExternalDataContext } from '@/providers/ExternalDataProvider';
import { useScrollRegistry } from '@/providers/ScrollRegistry';

const UpcomingDatesPage = () => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const { top: TOP_SPACER } = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const pathname = usePathname();

  const { onReloadPage, loadingPathnames } = useExternalDataContext();
  const scrollRegistry = useScrollRegistry();

  const filteredUpcomingDates = useAtomValue(filteredUpcomingDateEntriesAtom);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    }
  });

  // Register the scroll offset for use within the header.
  useEffect(() => {
    scrollRegistry.set(UPCOMING_DATES_SCROLL_KEY, scrollY);
  }, []);

  const contentInset = headerHeight - TOP_SPACER;

  return (
    <View className="flex-1">
      {/* Dates List */}
      <Animated.ScrollView
        refreshControl={
          <RefreshControl refreshing={loadingPathnames.has(pathname)} onRefresh={onReloadPage} />
        }
        onScroll={onScroll}
        contentInset={{ top: contentInset }}
        contentOffset={{ x: 0, y: -contentInset }}
        scrollIndicatorInsets={{ top: contentInset }}
        className="flex-1"
        contentContainerClassName="pb-4 px-4"
      >
        {filteredUpcomingDates.map(([datestamp, events], index) => (
          <UpcomingDateCard
            datestamp={datestamp}
            events={events}
            index={index}
            key={`${datestamp}-upcoming-date`}
          />
        ))}
      </Animated.ScrollView>

      {/* Empty Page Label */}
      {filteredUpcomingDates.length === 0 && <EmptyPageLabel label="No upcoming dates" />}
    </View>
  );
};

export default UpcomingDatesPage;
