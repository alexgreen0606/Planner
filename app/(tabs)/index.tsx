import EventChipSets from '@/components/eventChip/EventChipSet';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useLoadCalendarData } from '@/hooks/useLoadCalendarData';
import { useTodayDatestamp } from '@/hooks/useTodayDatestamp';
import { BIRTHDAY_STORAGE_ID } from '@/lib/constants/storage';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { loadCalendarData } from '@/utils/calendarUtils';
import { usePathname } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';

const birthdayStorage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

const Today = () => {
  const todayDatestamp = useTodayDatestamp();
  const pathname = usePathname();

  const isLoading = useLoadCalendarData(pathname);
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