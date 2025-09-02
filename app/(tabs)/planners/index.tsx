import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import GenericIcon from '@/components/icon';
import PlannerCard from '@/components/lists/PlannerCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ScrollContainerAnchor from '@/components/ScrollContainerAnchor';
import ButtonText from '@/components/text/ButtonText';
import { NULL } from '@/lib/constants/generic';
import { PLANNER_SET_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { getAllPlannerSetTitles } from '@/storage/plannerSetsStorage';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React, { useMemo } from 'react';
import { View } from 'react-native';

// ✅ 

const defaultPlannerSet = 'Next 7 Days';

const forecasts: Record<string, WeatherForecast> = {
    "2025-09-02": {
        "date": "2025-04-23",
        "weatherCode": 61,
        "weatherDescription": "Slight rain",
        "temperatureMax": 57,
        "temperatureMin": 51,
        "precipitationSum": 0.06,
        "precipitationProbabilityMax": 24
    },
    "2025-07-25": {
        "date": "2025-03-28",
        "weatherCode": 65,
        "weatherDescription": "Heavy rain",
        "temperatureMax": 57,
        "temperatureMin": 50,
        "precipitationSum": 1.19,
        "precipitationProbabilityMax": 32
    },
    "2025-07-26": {
        "date": "2025-03-29",
        "weatherCode": 3,
        "weatherDescription": "Overcast",
        "temperatureMax": 56,
        "temperatureMin": 47,
        "precipitationSum": 0,
        "precipitationProbabilityMax": 3
    },
    "2025-07-27": {
        "date": "2025-03-30",
        "weatherCode": 63,
        "weatherDescription": "Moderate rain",
        "temperatureMax": 54,
        "temperatureMin": 45,
        "precipitationSum": 0.46,
        "precipitationProbabilityMax": 66
    },
    "2025-07-28": {
        "date": "2025-03-31",
        "weatherCode": 51,
        "weatherDescription": "Light drizzle",
        "temperatureMax": 57,
        "temperatureMin": 50,
        "precipitationSum": 0.02,
        "precipitationProbabilityMax": 34
    },
    "2025-07-29": {
        "date": "2025-04-01",
        "weatherCode": 53,
        "weatherDescription": "Moderate drizzle",
        "temperatureMax": 59,
        "temperatureMin": 53,
        "precipitationSum": 0.09,
        "precipitationProbabilityMax": 34
    },
    "2025-07-30": {
        "date": "2025-04-02",
        "weatherCode": 53,
        "weatherDescription": "Moderate drizzle",
        "temperatureMax": 57,
        "temperatureMin": 53,
        "precipitationSum": 0.37,
        "precipitationProbabilityMax": 41
    },
    "2025-07-31": {
        "date": "2025-04-02",
        "weatherCode": 53,
        "weatherDescription": "Moderate drizzle",
        "temperatureMax": 57,
        "temperatureMin": 53,
        "precipitationSum": 0.37,
        "precipitationProbabilityMax": 41
    }
}

const Planners = () => {
    const router = useRouter();

    const [plannerSetKey, setPlannerSetKey] = useAtom(plannerSetKeyAtom);
    const calendarEventData = useAtomValue(calendarEventDataAtom);
    const { planner } = useAtomValue(mountedDatestampsAtom);

    const allPlannerSetTitles = getAllPlannerSetTitles(); // TODO: use MMKV to watch this

    const plannerSetOptions = useMemo(() =>
        [defaultPlannerSet, ...allPlannerSetTitles].map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: plannerSetKey === title ? 'on' : 'off',
        })),
        [allPlannerSetTitles]
    );

    // Only 1 planner will be loading at midnight. In this case, don't show loading overlay on page.
    const isLoadingEntirePlanner = useMemo(() =>
        planner.reduce((acc, datestamp) => {
            if (calendarEventData.plannersMap[datestamp] === undefined) {
                acc++;
                return acc;
            }
            return acc;
        }, 0) > 1,
        [planner, calendarEventData]
    );

    return isLoadingEntirePlanner ? (
        <LoadingSpinner />
    ) : (
        <View className='flex-1'>

            {/* Planner Set Selection */}
            <View className='px-3 pt-3 flex-row justify-between items-center w-full'>
                <MenuView
                    onPressAction={({ nativeEvent }) => {
                        setPlannerSetKey(nativeEvent.event)
                    }}
                    actions={plannerSetOptions as MenuAction[]}
                    shouldOpenOnLongPress={false}
                >
                    <ButtonText>
                        {plannerSetKey}
                    </ButtonText>
                </MenuView>
                <View className='gap-2 flex-row'>
                    {plannerSetKey !== 'Next 7 Days' && (
                        <GenericIcon
                            type='edit'
                            size='l'
                            platformColor='systemBlue'
                            onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}/${plannerSetKey}`)}
                        />
                    )}
                    <GenericIcon
                        type='add'
                        size='l'
                        platformColor='systemBlue'
                        onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}/${NULL}`)}
                    />
                </View>
            </View>

            {/* Planner Set Display */}
            <MotiView
                className='p-4 gap-4'
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    type: 'timing',
                    duration: 800,
                }}
            >
                {planner.map((datestamp) =>
                    <PlannerCard
                        key={`${datestamp}-planner`}
                        datestamp={datestamp}
                        forecast={forecasts[datestamp]}
                    />
                )}
                <ScrollContainerAnchor />
            </MotiView>

        </View>
    )
};

export default Planners;
