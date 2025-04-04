import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import { getNextSevenDayDatestamps } from '../../foundation/calendarEvents/timestampUtils';
import { PlannerEvent } from '../../foundation/calendarEvents/types';
import { RecurringPlannerKeys } from '../../feature/recurringPlanners/constants';
import PlannerModes from '../../feature/planner/types';
import { WeatherForecast } from '../../feature/weather/utils';
import { generateEventChipMap, generatePlannerEventMap } from '../../foundation/calendarEvents/calendarUtils';
import CustomText from '../../foundation/components/text/CustomText';
import globalStyles from '../../foundation/theme/globalStyles';
import { SortableListProvider } from '../../foundation/sortedLists/services/SortableListProvider';
import TopNavbar from '../../foundation/navigation/components/TopNavbar';
import GenericIcon from '../../foundation/components/GenericIcon';
import PlannerCard from '../../feature/planner';
import RecurringWeekdayPlanner from '../../feature/recurringPlanners/components/RecurringWeekdayPlanner';
import RecurringPlanner from '../../feature/recurringPlanners/components/RecurringPlanner';
import Deadlines from '../../feature/deadlines';

interface PageDataMaps {
  chips: Record<string, EventChipProps[]>;
  calendarEvents: Record<string, PlannerEvent[]>;
}

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
  const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>({
    "2025-03-27": {
      "date": "2025-03-27",
      "weatherCode": 61,
      "weatherDescription": "Slight rain",
      "temperatureMax": 57,
      "temperatureMin": 51,
      "precipitationSum": 0.06,
      "precipitationProbabilityMax": 24
    },
    "2025-03-28": {
      "date": "2025-03-28",
      "weatherCode": 65,
      "weatherDescription": "Heavy rain",
      "temperatureMax": 57,
      "temperatureMin": 50,
      "precipitationSum": 1.19,
      "precipitationProbabilityMax": 32
    },
    "2025-03-29": {
      "date": "2025-03-29",
      "weatherCode": 3,
      "weatherDescription": "Overcast",
      "temperatureMax": 56,
      "temperatureMin": 47,
      "precipitationSum": 0,
      "precipitationProbabilityMax": 3
    },
    "2025-03-30": {
      "date": "2025-03-30",
      "weatherCode": 63,
      "weatherDescription": "Moderate rain",
      "temperatureMax": 54,
      "temperatureMin": 45,
      "precipitationSum": 0.46,
      "precipitationProbabilityMax": 66
    },
    "2025-03-31": {
      "date": "2025-03-31",
      "weatherCode": 51,
      "weatherDescription": "Light drizzle",
      "temperatureMax": 57,
      "temperatureMin": 50,
      "precipitationSum": 0.02,
      "precipitationProbabilityMax": 34
    },
    "2025-04-01": {
      "date": "2025-04-01",
      "weatherCode": 53,
      "weatherDescription": "Moderate drizzle",
      "temperatureMax": 59,
      "temperatureMin": 53,
      "precipitationSum": 0.09,
      "precipitationProbabilityMax": 34
    },
    "2025-04-02": {
      "date": "2025-04-02",
      "weatherCode": 53,
      "weatherDescription": "Moderate drizzle",
      "temperatureMax": 57,
      "temperatureMin": 53,
      "precipitationSum": 0.37,
      "precipitationProbabilityMax": 41
    }
  });
  const [pageDataMaps, setPageDataMaps] = useState<PageDataMaps>({
    chips: {},
    calendarEvents: {}
  })

  /**
   * Loads in all chip, weather, and calendar data.
   */
  async function loadAllExternalData() {
    // TODO: add in forecasts from apple weather kit
    setPageDataMaps({
      chips: await generateEventChipMap(datestamps),
      calendarEvents: await generatePlannerEventMap(datestamps)
    })
  };

  // Load in the initial planners
  useEffect(() => {
    loadAllExternalData();
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
      <SortableListProvider floatingBanner={
        <TopNavbar
          tabs={[
            { label: 'Planners', onClick: () => setMode(PlannerModes.PLANNERS) },
            { label: 'Deadlines', onClick: () => setMode(PlannerModes.DEADLINES) },
            { label: 'Recurring', onClick: () => setMode(PlannerModes.RECURRING) }
          ]}
          currentTabIndex={mode === PlannerModes.PLANNERS ? 0 : mode === PlannerModes.RECURRING ? 1 : 2}
          setCurrentTabIndex={(index) => {
            if (index === 0) {
              setMode(PlannerModes.PLANNERS);
            } else if (index === 1) {
              setMode(PlannerModes.RECURRING);
            } else {
              setMode(PlannerModes.DEADLINES);
            }
          }}
        />
      }
      >

        {/* Planners */}
        {mode === PlannerModes.PLANNERS && datestamps ? (
          <View>
            <View style={styles.dropdownContainer} >
              <Dropdown
                data={defaultPlannerOptions}
                maxHeight={300}
                selectedTextStyle={styles.selectedTextStyle}
                style={styles.dropdown}
                containerStyle={{ borderWidth: 0 }}
                renderItem={renderDropdownItem}
                labelField="label"
                valueField="value"
                value={selectedPlanners}
                onChange={setSelectedPlanners}
              />
              <GenericIcon
                type='add'
                platformColor='secondaryLabel'
              />
            </View>
            <View style={styles.planners}>
              {selectedPlanners.value.map((datestamp) =>
                <PlannerCard
                  key={`${datestamp}-planner`}
                  datestamp={datestamp}
                  loadAllExternalData={loadAllExternalData}
                  forecast={forecasts?.[datestamp]}
                  calendarEvents={pageDataMaps.calendarEvents[datestamp] ?? []}
                  eventChips={pageDataMaps.chips[datestamp] ?? []}
                />
              )}
            </View>
          </View>
        ) : mode === PlannerModes.RECURRING ? (
          <View style={{ flex: 1 }}>
            <View style={styles.dropdownContainer} >
              <Dropdown
                data={recurringPlannerOptions}
                maxHeight={300}
                labelField="label"
                valueField="value"
                value={selectedRecurring}
                containerStyle={{ backgroundColor: PlatformColor('systemBlue'), borderWidth: 0 }}
                onChange={setSelectedRecurring}
                selectedTextStyle={styles.selectedTextStyle}
                style={styles.dropdown}
                renderItem={renderDropdownItem}
              />
              <GenericIcon
                type='add'
                platformColor='secondaryLabel'
              />
            </View>
            <View style={{ ...styles.planners, flex: 1, paddingHorizontal: 0 }}>
              {selectedRecurring.value.map((key) => (
                key === RecurringPlannerKeys.WEEKDAYS ?
                  <RecurringWeekdayPlanner key='weekday-recurring-planner' /> :
                  <RecurringPlanner key={`${key}-planner`} plannerKey={key} />
              ))}
            </View>
          </View>
        ) : (
          <Deadlines />
        )}
      </SortableListProvider>
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
    color: PlatformColor('secondaryLabel'),
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
  },
  dropdownItem: {
    backgroundColor: PlatformColor('systemBackground'),
    borderColor: PlatformColor('systemGray3'),
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 8,
  }
});

export default Planners;
