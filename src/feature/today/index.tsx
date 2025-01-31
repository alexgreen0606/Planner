import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TodayPlanner from './components/lists/TodayPlanner';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import { generateFullDayEventsMap, generateHolidaysMap } from '../../foundation/planners/calendarUtils';
import { getTodayTimestamp } from '../../foundation/planners/timeUtils';
import EventChip from '../../foundation/planners/components/EventChip';
import TodayBanner from './components/banner/TodayBanner';
import BirthdayChecklist from './components/lists/BirthdayChecklist';
import globalStyles from '../../foundation/theme/globalStyles';
import { Color } from '../../foundation/theme/colors';

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
      <TodayBanner
        showBannerBorder={holidays.length + allDayEvents.length !== 0}
        timestamp={timestamp}
      />

      <SortableListProvider>
        <View style={styles.container}>

          {/* Event Chips */}
          {holidays.length + allDayEvents.length > 0 && (
            <View style={styles.chips}>
              {holidays.map(holiday => (
                <EventChip
                  label={holiday}
                  iconConfig={{
                    type: 'globe',
                    size: 10,
                  }}
                  color={Color.PURPLE}
                  key={holiday}
                />
              ))}
              {allDayEvents.map(event => (
                <EventChip
                  label={event}
                  iconConfig={{
                    type: 'megaphone',
                    size: 10,
                  }}
                  color={Color.RED}
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