import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TodayPlanner from '../../feature/today/components/list/TodayPlanner';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import { generateEventChips } from '../../foundation/calendar/calendarUtils';
import { getTodayGenericTimestamp } from '../../foundation/calendar/dateUtils';
import EventChip, { EventChipProps } from '../../foundation/calendar/components/EventChip';
import TodayBanner from '../../feature/today/components/banner/TodayBanner';
import BirthdayChecklist from '../../feature/birthdays/components/BirthdayChecklist';
import globalStyles from '../../foundation/theme/globalStyles';
import DeadlineList from '../../feature/deadlines/components/DeadlineList';

const Today = () => {
  const timestamp = getTodayGenericTimestamp();
  const [eventChips, setEventChips] = useState<EventChipProps[]>([]);
  const [birthdayChips, setBirthdayChips] = useState<EventChipProps[]>();

  async function getEventChips() {
    const allEventChips = await generateEventChips([timestamp]);
    const todayChips = allEventChips[timestamp];
    const todayBirthdayChips: EventChipProps[] = [];
    const todayOtherChips: EventChipProps[] = [];
    todayChips.forEach(chip => {
      if (chip.label.includes(' Birthday')) {
        todayBirthdayChips.push(chip);
      } else {
        todayOtherChips.push(chip);
      }
    });
    setBirthdayChips(todayBirthdayChips);
    setEventChips(todayOtherChips);
  }

  useEffect(() => {
    getEventChips();
  }, []);

  return (
    <View style={globalStyles.blackFilledSpace}>

      {/* Banner */}
      <TodayBanner
        showBannerBorder={eventChips.length + (birthdayChips?.length || 0) > 0}
        timestamp={timestamp}
      />

      <SortableListProvider>
        <View style={styles.container}>

          {/* Event Chips */}
          {eventChips.length > 0 && (
            <View style={styles.chips}>
              {eventChips.map(chipConfig => (
                <EventChip
                  key={chipConfig.label}
                  {...chipConfig}
                />
              ))}
            </View>
          )}

          {/* Birthday Checklist Card */}
          {birthdayChips && (
            <BirthdayChecklist birthdays={birthdayChips} />
          )}

          {/* Planner */}
          <View style={styles.planner}>
            <TodayPlanner reloadChips={getEventChips} />
          </View>

          {/* Deadline List Card*/}
          <DeadlineList />

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
    width: '100%'
  },
  chips: {
    ...globalStyles.verticallyCentered,
    paddingTop: 8,
    paddingHorizontal: 8,
    width: '100%',
    flexWrap: 'wrap',
  }
});

export default Today;