import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getNextSevenDayDatestamps } from '../../../src/foundation/calendarEvents/timestampUtils';
import { WeatherForecast } from '../../../src/feature/weather/utils';
import { CalendarData } from '../../../src/foundation/calendarEvents/types';
import { generateEmptyCalendarDataMaps, loadCalendarEventData } from '../../../src/foundation/calendarEvents/calendarUtils';
import { useReload } from '../../../src/foundation/reload/ReloadProvider';
import globalStyles from '../../../src/foundation/theme/globalStyles';
import PopoverList from '../../../src/foundation/components/PopoverList';
import GenericIcon from '../../../src/foundation/components/GenericIcon';
import PlannerCard from '../../../src/feature/plannerCard';
import { getPlannerSet, getPlannerSetTitles } from '../../../src/storage/plannerSetsStorage';
import { usePathname, useRouter } from 'expo-router';
import { PLANNER_SET_MODAL_PATHNAME } from '../../(modals)/plannerSetModal/[plannerSetKey]';
import { NULL } from '../../../src/feature/checklists/constants';

const defaultPlannerSet = 'Next 7 Days';

const Planners = () => {

    const router = useRouter();
    const allPlannerSetTitles = getPlannerSetTitles();
    const [plannerSetKey, setPlannerSetKey] = useState(defaultPlannerSet);

    const plannerDatestamps = useMemo(() => {
        if (plannerSetKey === 'Next 7 Days') return getNextSevenDayDatestamps();
        return getPlannerSet(plannerSetKey)?.dates ?? [];
    }, [plannerSetKey]);

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
    const [calendarEventData, setCalendarEventData] = useState<CalendarData>(generateEmptyCalendarDataMaps(plannerDatestamps))

    const { registerReloadFunction } = useReload();

    /**
     * Loads in all chip, weather, and calendar data.
     */
    async function loadAllExternalData() {
        // TODO: add in forecasts from apple weather kit

        setCalendarEventData(await loadCalendarEventData(plannerDatestamps));
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
                <PopoverList<string>
                    getLabelFromObject={(set) => set} // TODO remove this prop
                    options={[defaultPlannerSet, ...allPlannerSetTitles]}
                    onChange={(newSet) => setPlannerSetKey(newSet)}
                />
                <GenericIcon
                    type='add'
                    platformColor='systemBlue'
                    onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}${NULL}`)}
                />
            </View>

            {/* Planner Set Display */}
            <View style={styles.planners}>
                {plannerDatestamps.map((datestamp) =>
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
