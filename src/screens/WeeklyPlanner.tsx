import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SortedPlanner from '../feature/planners/components/lists/SortedPlanner';
import Modal from '../foundation/ui/modal/Modal';
import { generateNextSevenDayTimestamps } from '../feature/planners/utils';
import { getAllDayEvents, getBirthdays, getHolidays } from '../feature/planners/storage/plannerStorage';
import SortedRecurringPlanner from '../feature/planners/components/lists/SortedRecurringPlanner';
import colors from '../foundation/theme/colors';
import PageLabel from '../foundation/ui/text/PageLabel';
import { ActivityIndicator } from 'react-native-paper';
import { WeatherForecast } from '../foundation/weather/types';
import { getWeather } from '../foundation/weather/utils';
import { SortableListProvider } from '../foundation/sortedLists/services/SortableListProvider';

const WeeklyPlanner = () => {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>();
  const [birthdays, setBirthdays] = useState<Record<string, string[]>>();
  const [holidays, setHolidays] = useState<Record<string, string[]>>();
  const [allDayEvents, setAllDayEvents] = useState<Record<string, string[]>>();
  const [weekdayPlannerOpen, setWeekdayPlannerOpen] = useState(false);

  const toggleWeekdayPlanner = () => setWeekdayPlannerOpen(!weekdayPlannerOpen);

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
        <View style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
          {!timestamps || !birthdays || !holidays || !forecasts || !allDayEvents ? (
            <ActivityIndicator color={colors.blue} />
          ) : (
            <SortableListProvider>
              <View key={`${weekdayPlannerOpen}-weekday-modal-open`} style={{ padding: 16 }}>
                {timestamps.map((timestamp) =>
                  <View style={{ width: '100%', alignItems: 'center', marginBottom: 16 }} key={`${timestamp}-planner`}>
                    <SortedPlanner
                      timestamp={timestamp}
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
        </View>
        <Modal
          title='Recurring Weekday Planner'
          open={weekdayPlannerOpen}
          primaryButtonConfig={{
            onClick: toggleWeekdayPlanner,
            label: 'Close'
          }}
          toggleModalOpen={toggleWeekdayPlanner}
          iconConfig={{
            type: 'MaterialCommunityIcons',
            name: 'calendar-sync',
            color: colors.blue
          }}
        >
          <SortedRecurringPlanner />
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default WeeklyPlanner;
