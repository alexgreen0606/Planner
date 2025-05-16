import EventChip, { EventChipProps } from '@/components/EventChip';
import BirthdayCard from '@/feature/birthdayCard';
import { getContactedBirthdaysByDatestamp } from '@/storage/birthdayStorage';
import { eventChipToBirthday, extractNameFromBirthdayText } from '@/feature/birthdayCard/utils';
import { ScrollContainerProvider } from '@/services/ScrollContainer';
import TodayPlanner from '@/feature/todayPlans';
import TodayBanner from '@/feature/todayPlans/TodayBanner';
import { loadCalendarEventData } from '@/utils/calendarUtils/calendarUtils';
import { getTodayDatestamp } from '@/utils/calendarUtils/timestampUtils';
import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { MMKV, useMMKVListener } from 'react-native-mmkv';
import { BIRTHDAY_STORAGE_ID } from '@/constants/storageIds';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { IBirthday } from '@/types/listItems/IBirthday';

interface TodayData {
  planner: IPlannerEvent[];
  chips: EventChipProps[];
  uncontactedBirthdays: IBirthday[];
}

const birthdayStorage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

const Today = () => {
  const todayDatestamp = getTodayDatestamp();
  const [pageData, setPageData] = useState<TodayData>({
    planner: [],
    chips: [],
    uncontactedBirthdays: []
  });

  // ------------ Manual Birthday Storage Handling -------------

  async function loadCalendarData() {

    const {
      chipsMap,
      plannersMap
    } = await loadCalendarEventData([todayDatestamp]); // TODO: don't load this in every time -> too wasteful -> store the data in a memo, and recall this function when they change. Then add the full reload function to useReload

    const contactedBirthdayPersons = getContactedBirthdaysByDatestamp(todayDatestamp);

    const uncontactedBirthdays: IBirthday[] = [];
    chipsMap[todayDatestamp].forEach((chip) => {
      if (
        // The chip is a birthday chip
        chip.iconConfig.type === 'birthday' &&
        // The birthday person has not been contacted today
        !contactedBirthdayPersons.includes(extractNameFromBirthdayText(chip.label))) {
        uncontactedBirthdays.push(eventChipToBirthday(chip, todayDatestamp));
      }
    });
    uncontactedBirthdays.sort((a, b) => a.age - b.age).map((bday, i) => ({ ...bday, sortId: i }));
    setPageData({
      planner: plannersMap[todayDatestamp],
      chips: chipsMap[todayDatestamp],
      uncontactedBirthdays
    });
  }

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
        floatingBanner={pageData.chips.length > 0 && (
          <View
            className="pb-1 pt-2 px-2 w-full flex flex-wrap flex-row gap-2 items-center"
          >
            {pageData.chips.map((chipConfig, i) => (
              <EventChip
                key={`event-chip-${i}`}
                backgroundPlatformColor='systemBackground'
                {...chipConfig}
              />
            ))}
          </View>
        )
        }>

        {/* Birthday Checklist Card */}
        <BirthdayCard birthdays={pageData.uncontactedBirthdays} />

        {/* Planner */}
        <TodayPlanner
          loadAllExternalData={loadCalendarData}
          calendarEvents={pageData.planner}
        />

      </ScrollContainerProvider>
    </View>
  );
};

export default Today;