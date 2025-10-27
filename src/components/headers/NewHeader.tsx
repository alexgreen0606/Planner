import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import useAppTheme from '@/hooks/useAppTheme';
import { PLANNER_BANNER_PADDING, PLANNER_CAROUSEL_HEIGHT, THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getMonthDateFromDatestamp, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlannerActions from '../actions/PlannerActions';
import PlannerChipSets from '../PlannerChip/PlannerChipSets';
import CustomText from '../text/CustomText';
import ColorFadeView from '../views/ColorFadeView';
import ShadowView from '../views/ShadowView';
import { GlassEffectContainer, Host, VStack } from '@expo/ui/swift-ui';
import PlannerCarousel from '../PlannerCarousel/NewCarousel';

// ✅ 

const PlannerHeader = ({ datestamp }: TPlannerPageParams) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const todayDatestamp = useAtomValue(todayDatestampAtom);

    const { label, dayOfWeek, date } = useMemo(() => {
        let label = '';

        const daysUntilDate = getDaysUntilIso(datestamp);

        if (datestamp === getTodayDatestamp()) {
            label = 'Today';
        } else if (datestamp === getTomorrowDatestamp()) {
            label = 'Tomorrow';
        } else if (daysUntilDate > 0) {
            label = `${daysUntilDate} days away`;
        } else {
            const absDays = Math.abs(daysUntilDate);
            label = `${absDays} day${absDays > 1 ? 's' : ''} ago`;
        }

        return { label, dayOfWeek: getDayOfWeekFromDatestamp(datestamp), date: getMonthDateFromDatestamp(datestamp) };
    }, [todayDatestamp, datestamp]);

    const { PlatformColor: { background }, ColorArray: { Screen: { upper } } } = useAppTheme();

    return (
        <Host style={{ flex: 1 }}>
            <GlassEffectContainer>
                <VStack>
                    <View>

                        <PlannerCarousel datestamp={datestamp} />

                        {/* Planner Date Details */}
                        <View className='flex-row justify-between items-center mb-3 px-2'>
                            <View>
                                <CustomText variant='pageLabel'>
                                    {dayOfWeek}
                                </CustomText>
                                <CustomText variant='detail' className='-mt-0.5' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                                    {date}
                                </CustomText>
                            </View>
                            <View>
                                <PlannerActions datestamp={datestamp} />
                                <CustomText variant='detail' className='-mt-0.5' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                                    {label}
                                </CustomText>
                            </View>
                        </View>
                    </View>
                </VStack>
            </GlassEffectContainer>
        </Host>
    )
};

export default PlannerHeader;