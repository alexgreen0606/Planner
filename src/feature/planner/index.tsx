import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getWeeklyWeather, WeatherForecast } from '../../foundation/weather/utils';
import { getNextSevenDayTimestamps, PLANNER_STORAGE_ID, RECURRING_WEEKDAY_PLANNER_KEY } from '../../foundation/planners/timeUtils';
import { generateEventChips } from '../../foundation/planners/calendarUtils';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import globalStyles from '../../foundation/theme/globalStyles';
import PlannerBanner from './components/banner/PlannerBanner';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import SortedPlanner from './components/lists/SortedPlanner';
import Modal from '../../foundation/components/modal/Modal';
import SortedRecurringPlanner from './components/lists/SortedRecurringPlanner';
import { Color } from '../../foundation/theme/colors';
import { EventChipProps } from '../../foundation/planners/components/EventChip';

const Planner = () => {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>();
  const [eventChipMap, setEventChipMap] = useState<Record<string, EventChipProps[]>>();
  const [recurringPlannerModalOpen, setRecurringPlannerModalOpen] = useState(false);

  const toggleRecurringPlannerModal = () => setRecurringPlannerModalOpen(curr => !curr);

  /**
   * Reset all state variable to trigger page load.
   */
  const resetState = () => {
    setTimestamps([]);
    setForecasts(undefined);
    setEventChipMap(undefined);
  }

  // Build a collection of the next 7 days of planners
  const buildPlanners = async (reloadPage: boolean) => {
    if (reloadPage) resetState();
    const timestamps = getNextSevenDayTimestamps();
    const allEventChips = await generateEventChips(timestamps);
    setTimestamps(timestamps);
    setEventChipMap(allEventChips);
    const forecastMap = await getWeeklyWeather(timestamps);

    setForecasts(forecastMap);
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
        toggleRecurringPlannerModal={toggleRecurringPlannerModal}
      />

      {/* Planners */}
      {timestamps && eventChipMap && (
        <SortableListProvider>
          <View key={`${recurringPlannerModalOpen}-weekday-modal-open`} style={styles.planners}>
            {timestamps.map((timestamp) =>
              <View key={`${timestamp}-planner`}>
                <SortedPlanner
                  timestamp={timestamp}
                  reloadChips={() => buildPlanners(false)}
                  forecast={forecasts?.[timestamp]}
                  eventChips={eventChipMap[timestamp]}
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
          color: Color.BLUE
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
