import { calendarChipsByDate } from '@/atoms/calendarEvents';
import EventChip from '@/components/EventChip';
import EventChipSets from '@/components/EventChipSet';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { BIRTHDAY_STORAGE_ID } from '@/constants/storage';
import { ScrollContainerProvider } from '@/services/ScrollContainer';
import { loadCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';

const birthdayStorage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

const Today = () => {
  const todayDatestamp = getTodayDatestamp();

  const [calendarChips] = useAtom(calendarChipsByDate(todayDatestamp));

  // Initial load of data
  useEffect(() => {
    loadCalendarData();
  }, []);

  // Load of data each time a birthday is contacted
  useMMKVListener((key) => {
    if (key === todayDatestamp) {
      loadCalendarData();
    }
  }, birthdayStorage);

  return (
    <View
      className='flex-1'
      style={{ backgroundColor: PlatformColor('systemBackground') }}
    >

      <ScrollContainerProvider
        header={<TodayBanner timestamp={todayDatestamp} />}
        floatingBanner={calendarChips.length > 0 && (
          <EventChipSets
            datestamp={todayDatestamp}
            sets={[calendarChips]}
            backgroundPlatformColor='systemBackground'
          />
        )}
      >

        {/* Planner */}
        <TodayPlanner />

      </ScrollContainerProvider>
    </View>
  );
};

export default Today;