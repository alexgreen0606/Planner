import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TodayPlanner from '../../../feature/today';
import { SortableListProvider } from '../../../foundation/sortedLists/services/SortableListProvider';
import TodayBanner from './banner/TodayBanner';
import BirthdayCard from '../../../feature/birthdays';
import globalStyles from '../../../foundation/theme/globalStyles';
import EventChip, { EventChipProps } from '../../../foundation/calendarEvents/components/EventChip';
import { getTodayDatestamp } from '../../../foundation/calendarEvents/timestampUtils';
import { generateEventChipMap } from '../../../foundation/calendarEvents/calendarUtils';

interface PageDataMaps {
  chips: EventChipProps[];
  birthdays: EventChipProps[];
}

const Today = () => {
  const todayDatestamp = getTodayDatestamp();
  const [pageData, setPageData] = useState<PageDataMaps>({
    chips: [],
    birthdays: []
  });

  async function loadCalendarData() {
    const allEventChips = await generateEventChipMap([todayDatestamp]);
    const todayChips = allEventChips[todayDatestamp];
    const todayBirthdayChips: EventChipProps[] = [];
    const todayOtherChips: EventChipProps[] = [];
    todayChips.forEach(chip => {
      if (chip.iconConfig.type === 'birthday') {
        todayBirthdayChips.push(chip);
      } else {
        todayOtherChips.push(chip);
      }
    });
    setPageData({
      chips: todayOtherChips,
      birthdays: todayBirthdayChips
    });
  }

  useEffect(() => {
    loadCalendarData();
  }, []);

  return (
    <View style={globalStyles.blackFilledSpace}>

      <SortableListProvider
        extraBannerHeight={pageData.chips.length > 0 ? 24 : 0}
        bannerContent={
          <View>
            <TodayBanner timestamp={todayDatestamp} />

            {/* Event Chips */}
            {pageData.chips.length > 0 && (
              <View style={styles.chips}>
                {pageData.chips.map((chipConfig, i) => (
                  <EventChip
                    key={`event-chip-${i}`}
                    {...chipConfig}
                  />
                ))}
              </View>
            )}
          </View>
        }>

        {/* Birthday Checklist Card */}
        {pageData.birthdays.length > 0 && (
          <BirthdayCard birthdays={pageData.birthdays} /> // TODO: update birthdays to use actual events
        )}

        {/* Planner */}
        <View style={styles.planner}>
          <TodayPlanner reloadChips={loadCalendarData} />
        </View>

      </SortableListProvider>
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: '100%',
    flexWrap: 'wrap',
  }
});

export default Today;