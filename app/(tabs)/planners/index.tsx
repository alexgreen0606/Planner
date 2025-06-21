import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import { visibleDatestampsAtom } from '@/atoms/visibleDatestamps';
import GenericIcon from '@/components/icon';
import LoadingSpinner from '@/components/LoadingSpinner';
import PlannerCard from '@/components/plannerCard';
import ScrollAnchor from '@/components/sortedList/ScrollAnchor';
import ButtonText from '@/components/text/ButtonText';
import { useLoadCalendarData } from '@/hooks/useLoadCalendarData';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { NULL } from '@/lib/constants/generic';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { getPlannerSetTitles } from '@/storage/plannerSetsStorage';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { PLANNER_SET_MODAL_PATHNAME } from '../../(modals)/plannerSetModal/[plannerSetKey]';

const defaultPlannerSet = 'Next 7 Days';

const Planners = () => {
    const [_, setTextfieldItem] = useTextfieldItemAs<IPlannerEvent>();
    const allPlannerSetTitles = getPlannerSetTitles();
    const pathname = usePathname();
    const router = useRouter();

    const [plannerSetKey, setPlannerSetKey] = useAtom(plannerSetKeyAtom);
    const visibleDatestamps = useAtomValue(visibleDatestampsAtom);

    const [forecasts, setForecasts] = useState<Record<string, WeatherForecast>>({
        "2025-06-09": {
            "date": "2025-04-23",
            "weatherCode": 61,
            "weatherDescription": "Slight rain",
            "temperatureMax": 57,
            "temperatureMin": 51,
            "precipitationSum": 0.06,
            "precipitationProbabilityMax": 24
        },
        "2025-06-10": {
            "date": "2025-03-28",
            "weatherCode": 65,
            "weatherDescription": "Heavy rain",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 1.19,
            "precipitationProbabilityMax": 32
        },
        "2025-06-11": {
            "date": "2025-03-29",
            "weatherCode": 3,
            "weatherDescription": "Overcast",
            "temperatureMax": 56,
            "temperatureMin": 47,
            "precipitationSum": 0,
            "precipitationProbabilityMax": 3
        },
        "2025-06-12": {
            "date": "2025-03-30",
            "weatherCode": 63,
            "weatherDescription": "Moderate rain",
            "temperatureMax": 54,
            "temperatureMin": 45,
            "precipitationSum": 0.46,
            "precipitationProbabilityMax": 66
        },
        "2025-06-13": {
            "date": "2025-03-31",
            "weatherCode": 51,
            "weatherDescription": "Light drizzle",
            "temperatureMax": 57,
            "temperatureMin": 50,
            "precipitationSum": 0.02,
            "precipitationProbabilityMax": 34
        },
        "2025-06-14": {
            "date": "2025-04-01",
            "weatherCode": 53,
            "weatherDescription": "Moderate drizzle",
            "temperatureMax": 59,
            "temperatureMin": 53,
            "precipitationSum": 0.09,
            "precipitationProbabilityMax": 34
        },
        "2025-06-15": {
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

    const isLoading = useLoadCalendarData(pathname);

    useEffect(() => {
        return () => setTextfieldItem(null); // TODO: save the item instead
    }, []);

    return isLoading ? (
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
                {visibleDatestamps.map((datestamp) =>
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
