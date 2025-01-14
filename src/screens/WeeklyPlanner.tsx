import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SortablePlanner from '../feature/planners/components/lists/SortablePlanner';
import Modal from '../foundation/ui/modal/Modal';
import { RECURRING_WEEKDAY_PLANNER } from '../feature/planners/enums';
import { generateNextSevenDayTimestamps } from '../feature/planners/utils';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../enums';
import { getAllDayEvents, getBirthdays, getHolidays, getPlannerStorageKey } from '../feature/planners/storage/plannerStorage';
import SortableRecurringPlanner from '../feature/planners/components/lists/SortableRecurringPlanner';
import colors from '../foundation/theme/colors';
import PageLabel from '../foundation/ui/text/PageLabel';
import { ActivityIndicator } from 'react-native-paper';
import { WeatherForecast } from '../foundation/weather/types';
import { getWeather } from '../foundation/weather/utils';
import { DraggableListProvider } from '../foundation/sortedLists/services/DraggableListProvider';

const WeeklyPlanner = () => {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>();
  const [birthdays, setBirthdays] = useState<Record<string, string[]>>();
  const [holidays, setHolidays] = useState<Record<string, string[]>>();
  const [allDayEvents, setAllDayEvents] = useState<Record<string, string[]>>();
  const [weekdayPlannerOpen, setWeekdayPlannerOpen] = useState(false);
  const [plannerListKey, setPlannerListKey] = useState('PLANNER_LIST_KEY');
  const [saveRecurringTrigger, setSaveRecurringTrigger] = useState('TRIGGER');

  useEffect(() => {
    const buildWeeklyPlanner = async () => {
      const timestamps = generateNextSevenDayTimestamps();
      const holidayMap = await getHolidays(timestamps);
      const birthdayMap = await getBirthdays(timestamps);
      const forecastMap = await getWeather(timestamps);
      const allDayEvents = await getAllDayEvents(timestamps);
      setTimestamps(timestamps);
      setHolidays(holidayMap);
      setBirthdays(birthdayMap);
      setForecasts(forecastMap);
      setAllDayEvents(allDayEvents);
    };

    buildWeeklyPlanner();
  }, []);

  const storage = useMMKV({ id: StorageIds.PLANNER_STORAGE });

  // Reload the planner when the recurring planner changes
  useMMKVListener((key) => {
    if (key === getPlannerStorageKey(RECURRING_WEEKDAY_PLANNER)) {
      setPlannerListKey(curr => (`${curr}_RERENDER`));
      toggleWeekdayPlanner();
    }
  }, storage)

  const toggleWeekdayPlanner = () => setWeekdayPlannerOpen(!weekdayPlannerOpen);

  if (!timestamps || !birthdays || !holidays || !forecasts || !allDayEvents)
    return (
      <SafeAreaView style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.black
      }}>
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <SafeAreaView>
        <PageLabel
          label='Planner'
          iconConfig={{
            type: 'Ionicons',
            name: 'calendar-number-sharp',
            size: 26,
            color: colors.blue
          }}
          controlConfig={{
            type: 'MaterialCommunityIcons',
            name: 'calendar-sync',
            size: 20,
            color: colors.grey
          }}
          control={toggleWeekdayPlanner}
        />
        <DraggableListProvider>
          <View key={plannerListKey} style={{ padding: 16 }}>
            {timestamps.map((timestamp) =>
              <View style={{ width: '100%', alignItems: 'center', marginBottom: 16 }} key={`${timestamp}-planner`}>
                <SortablePlanner
                  timestamp={timestamp}
                  holidays={holidays[timestamp]}
                  birthdays={birthdays[timestamp]}
                  forecast={forecasts[timestamp]}
                  allDayEvents={allDayEvents[timestamp]}
                />
              </View>
            )}
          </View>
        </DraggableListProvider>
        <Modal
          title='Recurring Weekday Planner'
          open={weekdayPlannerOpen}
          primaryButtonConfig={{
            onClick: () => setSaveRecurringTrigger(`${saveRecurringTrigger}_AGAIN`),
            label: 'Save'
          }}
          toggleModalOpen={toggleWeekdayPlanner}
          iconConfig={{
            type: 'MaterialCommunityIcons',
            name: 'calendar-sync',
            color: colors.blue
          }}
        >
          <SortableRecurringPlanner
            manualSaveTrigger={saveRecurringTrigger}
          />
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default WeeklyPlanner;
