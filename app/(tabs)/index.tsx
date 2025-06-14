import { calendarChipsByDate, calendarPlannerByDate } from '@/atoms/calendarEvents';
import EventChipSets from '@/components/EventChipSet';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { BIRTHDAY_STORAGE_ID } from '@/lib/constants/storage';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { loadCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';

const birthdayStorage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

const Today = () => {
  const todayDatestamp = getTodayDatestamp();

  const [calendarChips] = useAtom(calendarChipsByDate(todayDatestamp));

  const [isLoading, setIsLoading] = useState(true);

  // Initial load of data
  useEffect(() => {
    loadCalendarData();
  }, []);

  useEffect(() => {
    if (calendarChips !== null) {
      setIsLoading(false);
    }
  }, [calendarChips]);

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
        floatingBanner={calendarChips.length > 0 && (
          <EventChipSets
            datestamp={todayDatestamp}
            sets={calendarChips}
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