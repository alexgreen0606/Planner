import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import EventChipSets from '@/components/eventChip/EventChipSet';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarLoad } from '@/providers/CalendarProvider';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React from 'react';
import { PlatformColor, Text, TouchableOpacity, View } from 'react-native';

const Today = () => {
  const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

  const { isLoading } = useCalendarLoad();
  const { calendarChips } = useCalendarData(todayDatestamp);

  return isLoading ? (
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