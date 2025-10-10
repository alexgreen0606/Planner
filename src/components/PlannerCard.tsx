import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import CustomText from '@/components/text/CustomText';
import WeatherDisplay from '@/components/weather';
import useAppTheme from '@/hooks/useAppTheme';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import PlannerChipSets from '../components/PlannerChip/PlannerChipSets';

// ✅ 

type TPlannerCardProps = {
    datestamp: string;
};

const PlannerCard = ({
    datestamp
}: TPlannerCardProps) => {
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);

    const { modal: { inputField } } = useAppTheme();

    const { dayOfWeek, monthDate, isTomorrow } = useMemo(() => {
        const dayOfWeek = getDayOfWeekFromDatestamp(datestamp);
        const monthDate = getMonthDateFromDatestamp(datestamp);
        const isTomorrow = datestamp === getTomorrowDatestamp();
        return { dayOfWeek, monthDate, isTomorrow };
    }, [datestamp]);

    const prioritizeDayOfWeek = plannerSetKey === 'Next 7 Days';

    return (
        <View className='rounded-xl p-2 w-80' style={{ backgroundColor: PlatformColor(inputField) }}>
            <View className='flex-row justify-between'>
                <View className='flex-1'>

                    {/* Date */}
                    <View className='flex-row items-center'>
                        <CustomText variant='plannerCardDetail'>
                            {prioritizeDayOfWeek ? monthDate : dayOfWeek}
                        </CustomText>
                        {isTomorrow && (
                            <View
                                className='h-full mx-2'
                                style={{
                                    width: StyleSheet.hairlineWidth,
                                    backgroundColor: PlatformColor('systemGray')
                                }}
                            />
                        )}
                        {isTomorrow && (
                            <CustomText variant='plannerCardSoftDetail'>
                                Tomorrow
                            </CustomText>
                        )}
                    </View>
                    <CustomText className='-mt-0.25' variant='plannerCardHeader'>
                        {prioritizeDayOfWeek ? dayOfWeek : monthDate}
                    </CustomText>
                </View>

                {/* Weather */}
                <WeatherDisplay
                    high={97}
                    low={74}
                />

            </View>

            {/* Planner Chips */}
            <View className='min-h-8'>
                <PlannerChipSets datestamp={datestamp} />
            </View>
        </View>
    )
};

export default PlannerCard;