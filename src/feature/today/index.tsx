import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TodayPlanner from './components/lists/TodayPlanner';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import Colors from '../../foundation/theme/colors';
import { generateFullDayEventsMap, generateHolidaysMap } from '../../foundation/planners/calendarUtils';
import { getTodayTimestamp } from '../../foundation/planners/timeUtils';
import EventChip from '../../foundation/planners/components/EventChip';
import TodayBanner from './components/banner/TodayBanner';
import BirthdayChecklist from './components/lists/BirthdayChecklist';
import globalStyles from '../../foundation/theme/globalStyles';

const Today = () => {
  const timestamp = getTodayTimestamp();
  const [holidays, setHolidays] = useState<string[]>([]);
  const [allDayEvents, setAllDayEvents] = useState<string[]>([]);

  async function getEventChips() {
    const holidayMap = await generateHolidaysMap([timestamp]);
    const allDayEvents = await generateFullDayEventsMap([timestamp]);
    setHolidays(holidayMap[timestamp]);
    setAllDayEvents(allDayEvents[timestamp]);
  };

  useEffect(() => {
    getEventChips();
  }, []);

  return (
    <View style={globalStyles.blackFilledSpace}>

      {/* Banner */}
      <TodayBanner timestamp={timestamp} />

      <SortableListProvider>
        <View style={styles.container}>

          {/* Holiday Chips */}
          {holidays.length && (
            <View style={styles.chips}>
              {holidays.map(holiday => (
                <EventChip
                  label={holiday}
                  iconConfig={{
                    type: 'globe',
                    size: 10,
                  }}
                  color={Colors.PURPLE}
                  key={holiday}
                />
              ))}
            </View>
          )}

          {/* All Day Chips */}
          {allDayEvents.length && (
            <View style={styles.chips}>
              {allDayEvents.map(event => (
                <EventChip
                  label={event}
                  iconConfig={{
                    type: 'megaphone',
                    size: 10,
                  }}
                  color={Colors.RED}
                  key={`${event}-${timestamp}`}
                />
              ))}
            </View>
          )}

          {/* Birthday Checklist Card */}
          <BirthdayChecklist />

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
    gap: 8,
    paddingTop: 16,
    alignItems: 'center'
  },
  planner: {
    width: '100%'
  },
  chips: {
    ...globalStyles.verticallyCentered,
    width: '100%',
    flexWrap: 'wrap',
  }
});

export default Today;