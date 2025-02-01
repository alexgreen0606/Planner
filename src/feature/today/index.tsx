import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TodayPlanner from './components/lists/TodayPlanner';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import { generateEventChips } from '../../foundation/planners/calendarUtils';
import { getTodayTimestamp } from '../../foundation/planners/timeUtils';
import EventChip, { EventChipProps } from '../../foundation/planners/components/EventChip';
import TodayBanner from './components/banner/TodayBanner';
import BirthdayChecklist from './components/lists/BirthdayChecklist';
import globalStyles from '../../foundation/theme/globalStyles';

const Today = () => {
  const timestamp = getTodayTimestamp();
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

          {/* TODO: Goals Planner Card */}

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