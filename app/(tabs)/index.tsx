import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import EventChipSets from '@/components/eventChip/EventChipSet';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { EStorageId } from '@/lib/enums/EStorageId';
import { useCalendarLoad } from '@/providers/CalendarProvider';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { loadCalendarData } from '@/utils/calendarUtils';
import { useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';

const birthdayStorage = new MMKV({ id: EStorageId.BIRTHDAY });

const Today = () => {
  const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

  const { isLoading } = useCalendarLoad();
  const { calendarChips } = useCalendarData(todayDatestamp);

  // Load of data each time a birthday is contacted
  useMMKVListener((key) => {
    if (key === todayDatestamp) {
      loadCalendarData([todayDatestamp]);
    }
  }, birthdayStorage);

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