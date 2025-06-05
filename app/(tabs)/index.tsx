import { calendarChipsByDate } from '@/atoms/calendarEvents';
import EventChip, { EventChipProps } from '@/components/EventChip';
import TodayPlanner from '@/components/today';
import TodayBanner from '@/components/today/TodayBanner';
import { BIRTHDAY_STORAGE_ID } from '@/constants/storage';
import { ScrollContainerProvider } from '@/services/ScrollContainer';
import { IBirthday } from '@/types/listItems/IBirthday';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { loadCalendarData } from '@/utils/calendarUtils';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';

interface TodayData {
  planner: IPlannerEvent[];
  chips: EventChipProps[];
  uncontactedBirthdays: IBirthday[];
}

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
          <View
            className="pb-1 pt-2 px-2 w-full flex flex-wrap flex-row gap-2 items-center"
          >
            {calendarChips.map((chipConfig, i) => (
              <EventChip
                key={`event-chip-${i}`}
                backgroundPlatformColor='systemBackground'
                {...chipConfig}
              />
            ))}
          </View>
        )
        }>

        {/* Planner */}
        <TodayPlanner />

      </ScrollContainerProvider>
    </View>
  );
};

export default Today;