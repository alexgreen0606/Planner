import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import EventChipSets from '@/components/eventChip/EventChipSet';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';

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
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              type: 'timing',
              duration: 2000
            }}
          >
            <EventChipSets
              datestamp={todayDatestamp}
              sets={calendarChips}
              backgroundPlatformColor='systemBackground'
            />
          </MotiView>
        }
      >

        {/* Planner */}
        <TodayPlanner />

      </ScrollContainerProvider>
    </View>
  );
};

export default Today;