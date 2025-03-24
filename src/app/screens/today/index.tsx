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

const Today = () => {
  const timestamp = getTodayDatestamp();
  const [eventChips, setEventChips] = useState<EventChipProps[]>([]);
  const [birthdayChips, setBirthdayChips] = useState<EventChipProps[]>();

  async function getEventChips() {
    const allEventChips = await generateEventChipMap([timestamp]);
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
      <TodayBanner timestamp={timestamp} />

      <SortableListProvider enableReload>
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
            <BirthdayCard birthdays={birthdayChips} />
          )}

          {/* Planner */}
          <View style={styles.planner}>
            <TodayPlanner reloadChips={getEventChips} />
          </View>

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