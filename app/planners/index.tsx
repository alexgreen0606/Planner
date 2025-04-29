import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import { getNextSevenDayDatestamps } from '../../src/foundation/calendarEvents/timestampUtils';
import { PLANNER_SETS_KEY, PLANNER_SETS_STORAGE_ID, PlannerSet } from '../../src/feature/plannerCard/types';
import { WeatherForecast } from '../../src/feature/weather/utils';
import { CalendarData } from '../../src/foundation/calendarEvents/types';
import { generateEmptyCalendarDataMaps, loadCalendarEventData } from '../../src/foundation/calendarEvents/calendarUtils';
import { useReload } from '../../src/foundation/reload/ReloadProvider';
import globalStyles from '../../src/foundation/theme/globalStyles';
import PopoverList from '../../src/foundation/components/PopoverList';
import GenericIcon from '../../src/foundation/components/GenericIcon';
import PlannerCard from '../../src/feature/plannerCard';
import PlannerSetModal from '../../src/feature/plannerCard/components/PlannerSetModal';

const defaultPlannerSet = {
    id: 'default',
    title: 'Next 7 Days',
    dates: getNextSevenDayDatestamps()
};

const Planners = () => {
    const datestamps = useMemo(() => getNextSevenDayDatestamps(), []);

    const storage = new MMKV({ id: PLANNER_SETS_STORAGE_ID });
    const [plannerSets] = useMMKVObject<PlannerSet[]>(PLANNER_SETS_KEY, storage);

    const [plannerSetModalOpen, setPlannerSetModalOpen] = useState(false);
    const [plannerSet, setPlannerSet] = useState(defaultPlannerSet);
    const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>({
        "2025-04-23": {
            "date": "2025-04-23",
            "weatherCode": 61,
            "weatherDescription": "Slight rain",
            "temperatureMax": 57,
            "temperatureMin": 51,
            "precipitationSum": 0.06,
            "precipitationProbabilityMax": 24
        },
        "2025-04-24": {
            "date": "2025-03-28",
            "weatherCode": 65,
            "weatherDescription": "Heavy rain",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 1.19,
            "precipitationProbabilityMax": 32
        },
        "2025-04-25": {
            "date": "2025-03-29",
            "weatherCode": 3,
            "weatherDescription": "Overcast",
            "temperatureMax": 56,
            "temperatureMin": 47,
            "precipitationSum": 0,
            "precipitationProbabilityMax": 3
        },
        "2025-04-26": {
            "date": "2025-03-30",
            "weatherCode": 63,
            "weatherDescription": "Moderate rain",
            "temperatureMax": 54,
            "temperatureMin": 45,
            "precipitationSum": 0.46,
            "precipitationProbabilityMax": 66
        },
        "2025-04-27": {
            "date": "2025-03-31",
            "weatherCode": 51,
            "weatherDescription": "Light drizzle",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 0.02,
            "precipitationProbabilityMax": 34
        },
        "2025-04-28": {
            "date": "2025-04-01",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 59,
            "temperatureMin": 53,
            "precipitationSum": 0.09,
            "precipitationProbabilityMax": 34
        },
        "2025-04-29": {
            "date": "2025-04-02",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 57,
            "temperatureMin": 53,
            "precipitationSum": 0.37,
            "precipitationProbabilityMax": 41
        }
    });
    const [calendarEventData, setCalendarEventData] = useState<CalendarData>(generateEmptyCalendarDataMaps(datestamps))

    const { registerReloadFunction } = useReload();

    function togglePlannerSetModalOpen() {
        setPlannerSetModalOpen(curr => !curr);
    }

    /**
     * Loads in all chip, weather, and calendar data.
     */
    async function loadAllExternalData() {
        // TODO: add in forecasts from apple weather kit

        setCalendarEventData(await loadCalendarEventData(datestamps));
    };

    // Load in the initial planners
    useEffect(() => {
        loadAllExternalData();
        registerReloadFunction('planners-reload-trigger', loadAllExternalData);
    }, []);

    return (
        <View style={globalStyles.blackFilledSpace}>

            {/* Planner Set Selection */}
            <View style={[
                globalStyles.spacedApart,
                styles.dropdownContainer
            ]} >
                <PopoverList<PlannerSet>
                    getLabelFromObject={(set) => set.title}
                    options={[defaultPlannerSet, ...(plannerSets ?? [])]}
                    onChange={(newSet) => setPlannerSet(newSet)}
                />
                <GenericIcon
                    type='add'
                    platformColor='systemBlue'
                    onClick={togglePlannerSetModalOpen}
                />
            </View>

            {/* Planner Set Display */}
            <View style={styles.planners}>
                {plannerSet.dates.map((datestamp) =>
                    <PlannerCard
                        key={`${datestamp}-planner`}
                        datestamp={datestamp}
                        loadAllExternalData={loadAllExternalData}
                        forecast={forecasts?.[datestamp]}
                        calendarEvents={calendarEventData.plannersMap[datestamp] ?? []}
                        eventChips={calendarEventData.chipsMap[datestamp] ?? []}
                    />
                )}
            </View>

            {/* Planner Set Modal */}
            <PlannerSetModal open={plannerSetModalOpen} toggleModalOpen={togglePlannerSetModalOpen} />

        </View>
    );
};

const styles = StyleSheet.create({
    dropdownContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16
    },
    planners: {
        padding: 8,
        gap: 26,
    }
});

export default Planners;
