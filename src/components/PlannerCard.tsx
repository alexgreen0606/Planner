import { plannerSetKeyAtom } from '@/atoms/plannerSetKey';
import CustomText from '@/components/text/CustomText';
import WeatherDisplay from '@/components/weather';
import { PLANNER_CARD_HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { Host, VStack } from '@expo/ui/swift-ui';
import { glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import PlannerChipSets from './PlannerChip/PlannerChipSets';

// ✅ 

type TPlannerCardProps = {
    planner: TPlanner;
};

const PlannerCard = ({
    planner
}: TPlannerCardProps) => {
    const plannerSetKey = useAtomValue(plannerSetKeyAtom);

    const { dayOfWeek, monthDate, isTomorrow } = useMemo(() => {
        const dayOfWeek = getDayOfWeekFromDatestamp(planner.datestamp);
        const monthDate = getMonthDateFromDatestamp(planner.datestamp);
        const isTomorrow = planner.datestamp === getTomorrowDatestamp();
        return { dayOfWeek, monthDate, isTomorrow };
    }, [planner.datestamp]);

    const prioritizeDayOfWeek = plannerSetKey === 'Next 7 Days';

    return (
        <Host style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: PLANNER_CARD_HEADER_HEIGHT }}>
            <VStack modifiers={[glassEffect({ glass: { variant: 'clear' }, shape: 'rectangle' })]}>
                <View className='p-2 flex-row justify-between'>
                    <View className='flex-1'>

                        {/* Date */}
                        <View className='flex-row flex-1 items-center'>
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
                <PlannerChipSets datestamp={planner.datestamp} />

            </VStack>
        </Host>
    )
};

export default PlannerCard;