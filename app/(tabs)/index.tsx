import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import TodayBanner from '@/components/banners/TodayBanner';
import EventChipSets from '@/components/eventChip/EventChipSet';
import TodayPlanner from '@/components/lists/TodayPlanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import SlowFadeInView from '@/components/SlowFadeInView';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useAppPlatformColors } from '@/hooks/useColorTheme';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';

// ✅ 

const Today = () => {
  const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
  const calendarEventData = useAtomValue(calendarEventDataAtom);

  const { calendarChips } = useCalendarData(todayDatestamp);

  const { background } = useAppPlatformColors();

  const isCalendarLoading = useMemo(
    () => calendarEventData.plannersMap[todayDatestamp] === undefined,
    [todayDatestamp, calendarEventData]
  );

  return isCalendarLoading ? (
    <LoadingSpinner />
  ) : (
    <ScrollContainerProvider
      header={<TodayBanner timestamp={todayDatestamp} />}
      floatingBanner={calendarChips.length > 0 &&
        <SlowFadeInView>
          <EventChipSets
            datestamp={todayDatestamp}
            sets={calendarChips}
            backgroundPlatformColor={background}
          />
        </SlowFadeInView>
      }
    >
      <TodayPlanner />
    </ScrollContainerProvider>
  )
};

export default Today;