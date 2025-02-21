import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getWeeklyWeather, WeatherForecast } from '../../../feature/weather/utils';
import globalStyles from '../../../foundation/theme/globalStyles';
import PlannersBanner from './banner/PlannersBanner';
import { SortableListProvider } from '../../../foundation/sortedLists/services/SortableListProvider';
import PlannerCard from '../../../feature/planner';
import RecurringPlanner from '../../../feature/recurringPlanners/components/RecurringPlanner';
import { Dropdown } from 'react-native-element-dropdown';
import RecurringWeekdayPlanner from '../../../feature/recurringPlanners/components/RecurringWeekdayPlanner';
import { Palette } from '../../../foundation/theme/colors';
import CustomText from '../../../foundation/components/text/CustomText';
import PlannerModes from '../../../feature/planner/types';
import Deadlines from '../../../feature/deadlines';
import { getNextSevenDayDatestamps } from '../../../foundation/calendarEvents/timestampUtils';
import { RecurringPlannerKeys } from '../../../feature/recurringPlanners/types';
import { EventChipProps } from '../../../foundation/calendarEvents/components/EventChip';
import { generateEventChips } from '../../../foundation/calendarEvents/calendarUtils';
import GenericIcon from '../../../foundation/components/GenericIcon';

const defaultPlannerOptions = [
  { label: 'Next 7 Days', value: getNextSevenDayDatestamps() },
];

const Planners = () => {
  const datestamps = useMemo(() => getNextSevenDayDatestamps(), []);
  const recurringPlannerOptions = useMemo(() => {
    return Object.values(RecurringPlannerKeys).map(key => {
      return {
        label: key, value: [key]
      }
    })
  }, [])
  const [mode, setMode] = useState(PlannerModes.PLANNERS);
  const [selectedRecurring, setSelectedRecurring] = useState({ label: 'Weekdays', value: [RecurringPlannerKeys.WEEKDAYS] });
  const [selectedPlanners, setSelectedPlanners] = useState({ label: 'Next 7 Days', value: getNextSevenDayDatestamps() });
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>();
  const [eventChipMap, setEventChipMap] = useState<Record<string, EventChipProps[]>>();

  // Build a collection of the next 7 days of planners
  async function buildPlanners() {
    const allEventChips = await generateEventChips(datestamps);
    setEventChipMap(allEventChips);
    const forecastMap = await getWeeklyWeather(datestamps);

    setForecasts(forecastMap);
  };

  // Load in the initial planners
  useEffect(() => {
    buildPlanners();
  }, []);

  const renderDropdownItem = (item: { label: string, value: string }) => {
    return (
      <View style={styles.dropdownItem}>
        <CustomText type='standard'>
          {item.label}
        </CustomText>
      </View>
    )
  }

  return (
    <View style={globalStyles.blackFilledSpace}>

      {/* Page Label */}
      <PlannersBanner
        setMode={setMode}
        mode={mode}
      />

      {/* Planners */}
      {mode === PlannerModes.PLANNERS ? (
        <>
          {datestamps && eventChipMap && (
            <SortableListProvider>
              <View style={styles.dropdownContainer} >
                <Dropdown
                  data={defaultPlannerOptions}
                  maxHeight={300}
                  selectedTextStyle={styles.selectedTextStyle}
                  style={styles.dropdown}
                  containerStyle={{ backgroundColor: Palette.BLUE, borderWidth: 0 }}
                  renderItem={renderDropdownItem}
                  labelField="label"
                  valueField="value"
                  value={selectedPlanners}
                  onChange={setSelectedPlanners}
                />
                <GenericIcon
                  type='add'
                  color={Palette.GREY}
                />
              </View>
              <View style={styles.planners}>
                {selectedPlanners.value.map((datestamp) =>
                  <PlannerCard
                    key={`${datestamp}-planner`}
                    timestamp={datestamp}
                    reloadChips={buildPlanners}
                    forecast={forecasts?.[datestamp]}
                    eventChips={eventChipMap[datestamp]}
                  />
                )}
              </View>
            </SortableListProvider>
          )}
        </>
      ) : mode === PlannerModes.RECURRING ? (
        <SortableListProvider>
          <View style={styles.dropdownContainer} >
            <Dropdown
              data={recurringPlannerOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={selectedRecurring}
              containerStyle={{ backgroundColor: Palette.BLUE, borderWidth: 0 }}
              onChange={setSelectedRecurring}
              selectedTextStyle={styles.selectedTextStyle}
              style={styles.dropdown}
              renderItem={renderDropdownItem}
            />
            <GenericIcon
              type='add'
              color={Palette.GREY}
            />
          </View>
          <View style={{ ...styles.planners, flex: 1, paddingHorizontal: 0 }}>
            {selectedRecurring.value.map((key) => (
              key === RecurringPlannerKeys.WEEKDAYS ?
                <RecurringWeekdayPlanner key='recurring-planner' /> :
                <RecurringPlanner key={`${key}-planner`} plannerKey={key} />
            ))}
          </View>
        </SortableListProvider>
      ) : (
        <SortableListProvider>
          <Deadlines />
        </SortableListProvider>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  recurringModal: {
    height: 600
  },
  planners: {
    paddingHorizontal: 16,
    gap: 32,
    paddingBottom: 32
  },
  selectedTextStyle: {
    color: Palette.GREY,
    fontSize: 14,
    fontWeight: 800
  },
  dropdownContainer: {
    ...globalStyles.spacedApart,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  dropdown: {
    width: '40%',
    padding: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.GREY
  },
  dropdownItem: {
    backgroundColor: Palette.BACKGROUND,
    borderColor: Palette.DIM,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 8,
  }
});

export default Planners;
