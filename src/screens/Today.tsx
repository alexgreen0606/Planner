import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import TodayPlanner from '../feature/today/components/TodayPlanner';
import { SortableListProvider } from '../foundation/sortedLists/services/SortableListProvider';
import colors from '../foundation/theme/colors';
import { generateFullDayEventsMap, generateHolidaysMap } from '../foundation/planners/calendarUtils';
import { generateTodayTimestamp } from '../foundation/planners/timeUtils';
import Chip from '../foundation/components/info/Chip';
import BirthdayChecklist from '../feature/today/components/BirthdayChecklist';
import TodayBanner from '../feature/today/components/TodayBanner';

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

      {/* Page Label */}
      <TodayBanner
        timestamp={timestamp}
        weatherCode={0}
        hight={45}
        low={32}
      />

      <SortableListProvider>
        <View style={styles.container}>

          {/* Holidays */}
          {holidays.length && (
            <View style={styles.chips}>
              {holidays.map(holiday => (
                <Chip
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

          {/* All Day chips */}
          {allDayEvents.length && (
            <View style={styles.chips}>
              {allDayEvents.map(event => (
                <Chip
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

          {/* Goals Planner Card */}

        </View>
      </SortableListProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
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