import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PlannerEvent } from '../../src/foundation/calendarEvents/types';
import { Birthday } from '../../src/feature/birthdayCard/types';
import { BIRTHDAY_STORAGE_ID } from '../../src/feature/birthdayCard/constants';
import { MMKV, useMMKVListener } from 'react-native-mmkv';
import { getTodayDatestamp } from '../../src/foundation/calendarEvents/timestampUtils';
import { loadCalendarEventData } from '../../src/foundation/calendarEvents/calendarUtils';
import { getContactedBirthdaysByDatestamp } from '../../src/feature/birthdayCard/storage';
import { eventChipToBirthday, extractNameFromBirthdayText } from '../../src/feature/birthdayCard/utils';
import globalStyles from '../../src/foundation/theme/globalStyles';
import { ScrollContainerProvider } from '../../src/foundation/sortedLists/services/ScrollContainerProvider';
import TodayBanner from '../../src/feature/todayPlans/TodayBanner';
import EventChip, { EventChipProps } from '../../src/foundation/calendarEvents/components/EventChip';
import BirthdayCard from '../../src/feature/birthdayCard';
import TodayPlanner from '../../src/feature/todayPlans';

interface TodayData {
  planner: PlannerEvent[];
  chips: EventChipProps[];
  uncontactedBirthdays: Birthday[];
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

    const uncontactedBirthdays: Birthday[] = [];
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
    <View style={globalStyles.blackFilledSpace}>

      <ScrollContainerProvider
        header={<TodayBanner timestamp={todayDatestamp} />}
        floatingBanner={pageData.chips.length > 0 && (
          <View style={styles.chips}>
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
        <View style={styles.planner}>
          <TodayPlanner
            loadAllExternalData={loadCalendarData}
            calendarEvents={pageData.planner}
          />
        </View>

      </ScrollContainerProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 4,
    alignItems: 'center'
  },
  planner: {
    flex: 1,
  },
  chips: {
    ...globalStyles.verticallyCentered,
    paddingBottom: 4,
    paddingTop: 8,
    paddingHorizontal: 8,
    width: '100%',
    flexWrap: 'wrap',
  }
});

export default Today;