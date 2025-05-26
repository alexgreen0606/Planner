import GenericIcon from '@/components/GenericIcon';
import PlannerCard from '@/components/plannerCard';
import PopoverList from '@/components/PopoverList';
import { NULL } from '@/constants/generic';
import { generateDatestampRange, getNextEightDayDatestamps } from '@/utils/dateUtils';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { PLANNER_SET_MODAL_PATHNAME } from '../../(modals)/plannerSetModal/[plannerSetKey]';
import { useReloadScheduler } from '../../../src/services/ReloadScheduler';
import { getPlannerSet, getPlannerSetTitles } from '../../../src/storage/plannerSetsStorage';
import { loadCalendarData } from '../../../src/utils/calendarUtils';
import { WeatherForecast } from '../../../src/utils/weatherUtils';


const defaultPlannerSet = 'Next 7 Days';

const Planners = () => {

    const router = useRouter();
    const allPlannerSetTitles = getPlannerSetTitles();
    const [plannerSetKey, setPlannerSetKey] = useState(defaultPlannerSet);

    const plannerDatestamps = useMemo(() => {
        if (plannerSetKey === 'Next 7 Days') return getNextEightDayDatestamps().slice(1, 8);

        const plannerSet = getPlannerSet(plannerSetKey);
        if (!plannerSet) return [];

        return generateDatestampRange(plannerSet.startDate, plannerSet.endDate)
    }, [plannerSetKey]);

    const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>({
        "2025-05-17": {
            "date": "2025-04-23",
            "weatherCode": 61,
            "weatherDescription": "Slight rain",
            "temperatureMax": 57,
            "temperatureMin": 51,
            "precipitationSum": 0.06,
            "precipitationProbabilityMax": 24
        },
        "2025-05-16": {
            "date": "2025-03-28",
            "weatherCode": 65,
            "weatherDescription": "Heavy rain",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 1.19,
            "precipitationProbabilityMax": 32
        },
        "2025-05-18": {
            "date": "2025-03-29",
            "weatherCode": 3,
            "weatherDescription": "Overcast",
            "temperatureMax": 56,
            "temperatureMin": 47,
            "precipitationSum": 0,
            "precipitationProbabilityMax": 3
        },
        "2025-05-19": {
            "date": "2025-03-30",
            "weatherCode": 63,
            "weatherDescription": "Moderate rain",
            "temperatureMax": 54,
            "temperatureMin": 45,
            "precipitationSum": 0.46,
            "precipitationProbabilityMax": 66
        },
        "2025-05-20": {
            "date": "2025-03-31",
            "weatherCode": 51,
            "weatherDescription": "Light drizzle",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 0.02,
            "precipitationProbabilityMax": 34
        },
        "2025-05-21": {
            "date": "2025-04-01",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 59,
            "temperatureMin": 53,
            "precipitationSum": 0.09,
            "precipitationProbabilityMax": 34
        },
        "2025-05-22": {
            "date": "2025-04-02",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 57,
            "temperatureMin": 53,
            "precipitationSum": 0.37,
            "precipitationProbabilityMax": 41
        }
    });

    const { registerReloadFunction } = useReloadScheduler();

    const pathname = usePathname();

    // Load in the initial planners
    useEffect(() => {
        loadCalendarData();
        registerReloadFunction('planners-reload-trigger', loadCalendarData, pathname);
    }, []);

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            {/* Planner Set Selection */}
            <View className='py-2 px-4 flex-row justify-between items-center w-full' >
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
            <View className='p-2 gap-4'>
                {plannerDatestamps.map((datestamp) =>
                    <PlannerCard
                        key={`${datestamp}-planner`}
                        datestamp={datestamp}
                        forecast={forecasts?.[datestamp]}
                    />
                )}
            </View>

        </View>
    );
};

export default Planners;
