import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import TodayPlanner from '../feature/today/components/lists/TodayPlanner';
import { SortableListProvider } from '../foundation/sortedLists/services/SortableListProvider';
import colors from '../foundation/theme/colors';
import { generateFullDayEventsMap, generateHolidaysMap } from '../foundation/planners/calendarUtils';
import { generateTodayTimestamp } from '../foundation/time/utils';
import EventChip from '../foundation/planners/components/EventChip';
import TodayBanner from '../feature/today/components/banner/TodayBanner';
import BirthdayChecklist from '../feature/today/components/lists/BirthdayChecklist';

const Today = () => {
  const timestamp = generateTodayTimestamp();
  const [holidays, setHolidays] = useState<string[]>([]);
  const [allDayEvents, setAllDayEvents] = useState<string[]>([]);

  // Build a collection of the next 7 days of planners
  const buildTodayDetails = async () => {
    const holidayMap = await generateHolidaysMap([timestamp]);
    const allDayEvents = await generateFullDayEventsMap([timestamp]);
    setHolidays(holidayMap[timestamp]);
    setAllDayEvents(allDayEvents[timestamp]);
  };

  useEffect(() => {
    buildTodayDetails();
  }, []);

  return (
    <View style={globalStyles.blackFilledSpace}>

      {/* Banner */}
      <TodayBanner timestamp={timestamp}/>

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
                    color: colors.purple
                  }}
                  color={colors.purple}
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
                    color: colors.red
                  }}
                  color={colors.red}
                  key={`${event}-${timestamp}`}
                />
              ))}
            </View>
          )}

          {/* Birthday Checklist Card */}
          <BirthdayChecklist />

          {/* Planner */}
          <View style={styles.planner}>
            <TodayPlanner reloadChips={buildTodayDetails} />
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