import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SortedPlanner from '../feature/planners/components/lists/SortedPlanner';
import Modal from '../foundation/components/modal/Modal';
import { generateNextSevenDayTimestamps, PLANNER_STORAGE_ID, RECURRING_WEEKDAY_PLANNER_KEY } from '../foundation/planners/timeUtils';
import SortedRecurringPlanner from '../feature/planners/components/lists/SortedRecurringPlanner';
import colors from '../foundation/theme/colors';
import PlannerBanner from '../feature/planners/components/banner/PlannerBanner';
import { ActivityIndicator } from 'react-native-paper';
import { getWeeklyWeather, WeatherForecast } from '../foundation/weather/utils';
import { SortableListProvider } from '../foundation/sortedLists/services/SortableListProvider';
import globalStyles from '../foundation/theme/globalStyles';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { generateBirthdaysMap, generateFullDayEventsMap, generateHolidaysMap } from '../foundation/planners/calendarUtils';

const Planner = () => {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>();
  const [birthdays, setBirthdays] = useState<Record<string, string[]>>();
  const [holidays, setHolidays] = useState<Record<string, string[]>>();
  const [allDayEvents, setAllDayEvents] = useState<Record<string, string[]>>();
  const [recurringPlannerModalOpen, setRecurringPlannerModalOpen] = useState(false);

  const toggleRecurringPlannerModal = () => setRecurringPlannerModalOpen(curr => !curr);

  /**
   * Reset all state variable to trigger page load.
   */
  const resetState = () => {
    setTimestamps([]);
    setHolidays(undefined);
    setBirthdays(undefined);
    setForecasts(undefined);
    setAllDayEvents(undefined);
  }

  // Build a collection of the next 7 days of planners
  const buildPlanners = async (reloadPage: boolean) => {
    if (reloadPage) resetState();
    const timestamps = generateNextSevenDayTimestamps();
    const holidayMap = await generateHolidaysMap(timestamps);
    const birthdayMap = await generateBirthdaysMap(timestamps);
    const forecastMap = await getWeeklyWeather(timestamps);
    const allDayEvents = await generateFullDayEventsMap(timestamps);
    setTimestamps(timestamps);
    setHolidays(holidayMap);
    setBirthdays(birthdayMap);
    setForecasts(forecastMap);
    setAllDayEvents(allDayEvents);
  };

  // Load in the initial planners
  useEffect(() => {
    buildPlanners(false);
  }, []);

  // Reload the planners whenever the recurring planner changes
  const recurringPlannerStorage = useMMKV({ id: PLANNER_STORAGE_ID });
  useMMKVListener((key) =>
    key === RECURRING_WEEKDAY_PLANNER_KEY &&
    !recurringPlannerModalOpen &&
    buildPlanners(true),
    recurringPlannerStorage);

  return (
    <View style={globalStyles.blackFilledSpace}>

      {/* Page Label */}
      <PlannerBanner
        label='Planner'
        iconConfig={{
          type: 'planner',
          size: 26,
          color: colors.blue
        }}
        controlConfig={{
          type: 'recurring-calendar',
          size: 20,
          color: colors.grey
        }}
        control={toggleRecurringPlannerModal}
      />

      {/* Planners */}
      {!timestamps || !birthdays || !holidays || !forecasts || !allDayEvents ? (
        <ActivityIndicator color={colors.blue} />
      ) : (
        <SortableListProvider>
          <View key={`${recurringPlannerModalOpen}-weekday-modal-open`} style={styles.planners}>
            {timestamps.map((timestamp) =>
              <View key={`${timestamp}-planner`}>
                <SortedPlanner
                  timestamp={timestamp}
                  reloadChips={() => buildPlanners(false)}
                  holidays={holidays[timestamp]}
                  birthdays={birthdays[timestamp]}
                  forecast={forecasts[timestamp]}
                  allDayEvents={allDayEvents[timestamp]}
                />
              </View>
            )}
          </View>
        </SortableListProvider>
      )}

      {/* Recurring Planner Modal */}
      <Modal
        title='Recurring Weekday Planner'
        open={recurringPlannerModalOpen}
        primaryButtonConfig={{
          onClick: toggleRecurringPlannerModal,
          label: 'Close'
        }}
        toggleModalOpen={toggleRecurringPlannerModal}
        iconConfig={{
          type: 'recurring-calendar',
          color: colors.blue
        }}
      >
        <View style={styles.recurringModal}>
          <SortableListProvider>
            <SortedRecurringPlanner modalOpen={recurringPlannerModalOpen} />
          </SortableListProvider>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  recurringModal: {
    height: 600
  },
  planners: {
    padding: 16,
    gap: 24
  }
});

export default Planner;
