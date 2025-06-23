import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import GenericIcon from '@/components/icon';
import LoadingSpinner from '@/components/LoadingSpinner';
import PlannerCard from '@/components/plannerCard';
import ScrollAnchor from '@/components/sortedList/ScrollAnchor';
import ButtonText from '@/components/text/ButtonText';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { NULL } from '@/lib/constants/generic';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useCalendarLoad } from '@/providers/CalendarProvider';
import { getPlannerSetTitles } from '@/storage/plannerSetsStorage';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { PLANNER_SET_MODAL_PATHNAME } from '../../(modals)/plannerSetModal/[plannerSetKey]';
import { calendarEventDataAtom } from '@/atoms/calendarEvents';

const defaultPlannerSet = 'Next 7 Days';

const Planners = () => {
    const [_, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const allPlannerSetTitles = getPlannerSetTitles();
    const router = useRouter();

    const [plannerSetKey, setPlannerSetKey] = useAtom(plannerSetKeyAtom);
    const calendarEventData = useAtomValue(calendarEventDataAtom);
    const { planner } = useAtomValue(mountedDatestampsAtom);

    const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>({
        "2025-06-22": {
            "date": "2025-04-23",
            "weatherCode": 61,
            "weatherDescription": "Slight rain",
            "temperatureMax": 57,
            "temperatureMin": 51,
            "precipitationSum": 0.06,
            "precipitationProbabilityMax": 24
        },
        "2025-06-23": {
            "date": "2025-03-28",
            "weatherCode": 65,
            "weatherDescription": "Heavy rain",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 1.19,
            "precipitationProbabilityMax": 32
        },
        "2025-06-24": {
            "date": "2025-03-29",
            "weatherCode": 3,
            "weatherDescription": "Overcast",
            "temperatureMax": 56,
            "temperatureMin": 47,
            "precipitationSum": 0,
            "precipitationProbabilityMax": 3
        },
        "2025-06-25": {
            "date": "2025-03-30",
            "weatherCode": 63,
            "weatherDescription": "Moderate rain",
            "temperatureMax": 54,
            "temperatureMin": 45,
            "precipitationSum": 0.46,
            "precipitationProbabilityMax": 66
        },
        "2025-06-26": {
            "date": "2025-03-31",
            "weatherCode": 51,
            "weatherDescription": "Light drizzle",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 0.02,
            "precipitationProbabilityMax": 34
        },
        "2025-06-27": {
            "date": "2025-04-01",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 59,
            "temperatureMin": 53,
            "precipitationSum": 0.09,
            "precipitationProbabilityMax": 34
        },
        "2025-06-28": {
            "date": "2025-04-02",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 57,
            "temperatureMin": 53,
            "precipitationSum": 0.37,
            "precipitationProbabilityMax": 41
        },
        "2025-06-29": {
            "date": "2025-04-02",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 57,
            "temperatureMin": 53,
            "precipitationSum": 0.37,
            "precipitationProbabilityMax": 41
        }
    });

    const plannerSetOptions = useMemo(() =>
        [defaultPlannerSet, ...allPlannerSetTitles].map((title) => ({
            id: title,
            title,
            titleColor: 'blue',
            state: plannerSetKey === title ? 'on' : 'off',
        })),
        [allPlannerSetTitles]
    );

    const isEntirePlannerLoading = useMemo(() =>
        planner.reduce((acc, datestamp) => {
            if (calendarEventData.plannersMap[datestamp] === undefined) {
                acc += 1;
                return acc;
            }
            return acc;
        }, 0),
        [planner, calendarEventData]
    );

    useEffect(() => {
        return () => setTextfieldItem(null); // TODO: save the item instead
    }, []);

    return isEntirePlannerLoading ? (
        <LoadingSpinner />
    ) : (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            {/* Planner Set Selection */}
            <View className='p-2 flex-row justify-between items-center w-full'>
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
                            onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}${plannerSetKey}`)}
                        />
                    )}
                    <GenericIcon
                        type='add'
                        size='l'
                        platformColor='systemBlue'
                        onClick={() => router.push(`${PLANNER_SET_MODAL_PATHNAME}${NULL}`)}
                    />
                </View>
            </View>

            {/* Planner Set Display */}
            <MotiView
                className='p-2 gap-4'
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
                        forecast={forecasts?.[datestamp]}
                    />
                )}
                <ScrollAnchor />
            </MotiView>

        </View>
    );
};

export default Planners;
