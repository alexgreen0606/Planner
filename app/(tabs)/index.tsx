import EventChipSets from '@/components/EventChipSet';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useLoadCalendarData } from '@/hooks/useLoadCalendarData';
import { BIRTHDAY_STORAGE_ID } from '@/lib/constants/storage';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { loadCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { usePathname } from 'expo-router';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';

const birthdayStorage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

const Today = () => {
  const todayDatestamp = useMemo(() => getTodayDatestamp(), []);
  const todayDatestampRange = useMemo(() => [getTodayDatestamp()], [todayDatestamp]);

  const pathname = usePathname();

  const { isLoading } = useLoadCalendarData(todayDatestampRange, pathname);
  const { calendarChips } = useCalendarData(todayDatestamp);

  // Load of data each time a birthday is contacted
  useMMKVListener((key) => {
    if (key === todayDatestamp) {
      loadCalendarData();
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
          <EventChipSets
            datestamp={todayDatestamp}
            sets={calendarChips}
            backgroundPlatformColor='systemBackground'
          />
        }
      >

        {/* Planner */}
        <TodayPlanner />

      </ScrollContainerProvider>
    </View>
  );
};

export default Today;