import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import TodayBanner from '@/components/banners/TodayBanner';
import EventChipSets from '@/components/eventChip/EventChipSet';
import SlowFadeInView from '@/components/SlowFadeInView';
import TodayPlanner from '@/components/lists/TodayPlanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';

// ✅ 

const Today = () => {
  const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
  const calendarEventData = useAtomValue(calendarEventDataAtom);

  const { calendarChips } = useCalendarData(todayDatestamp);

  const isCalendarLoading = useMemo(
    () => calendarEventData.plannersMap[todayDatestamp] === undefined,
    [todayDatestamp, calendarEventData]
  );

  return isCalendarLoading ? (
    <LoadingSpinner />
  ) : (
    <View
      className='flex-1'
      style={{ backgroundColor: PlatformColor('systemBackground') }}
    >
      <ScrollContainerProvider
        header={<TodayBanner timestamp={todayDatestamp} />}
        floatingBanner={calendarChips.length > 0 &&
          <SlowFadeInView>
            <EventChipSets
              datestamp={todayDatestamp}
              sets={calendarChips}
              backgroundPlatformColor='systemBackground'
            />
          </SlowFadeInView>
        }
      >

        {/* Planner */}
        <TodayPlanner />

      </ScrollContainerProvider>
    </View>
  );
};

export default Today;