import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import useAppTheme from '@/hooks/useAppTheme';
import { PLANNER_BANNER_PADDING, PLANNER_CAROUSEL_HEIGHT, THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlannerActions from '../actions/PlannerActions';
import PlannerChipSets from '../PlannerChip/PlannerChipSets';
import CustomText from '../text/CustomText';
import ShadowView from '../views/ShadowView';
import UpperFadeOutView from '../views/UpperFadeOutView';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';

// ✅ 

const PlannerHeader = ({ datestamp }: TPlannerPageParams) => {
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const { today } = useAtomValue(mountedDatestampsAtom);

    const { label, dayOfWeek } = useMemo(() => {
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

        return { label, dayOfWeek: getDayOfWeekFromDatestamp(datestamp) };
    }, [today, datestamp]);

    const { background, upperFadeArray } = useAppTheme();

    return (
        <UpperFadeOutView
            colors={upperFadeArray}
            solidHeight={PLANNER_CAROUSEL_HEIGHT + TOP_SPACER} // TODO: have a more fixed height of the planner banner
            className='w-full'
            style={{
                paddingHorizontal: PLANNER_BANNER_PADDING,
            }}
        >

            {/* Planner Date Details */}
            <View className='flex-row justify-between items-center mb-3 px-2'>
                <ShadowView edgeSize={{ bottom: THIN_LINE_HEIGHT }} maxOpacity={.5}>
                    <CustomText variant='pageLabel'>
                        {dayOfWeek}
                    </CustomText>
                    <CustomText variant='detail' className='-mt-0.5' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                        {label}
                    </CustomText>
                </ShadowView>
                <PlannerActions datestamp={datestamp} />
            </View>

            {/* Planner Chips */}
            <PlannerChipSets
                datestamp={datestamp}
                backgroundPlatformColor={background}
            />

        </UpperFadeOutView>
    )
};

export default PlannerHeader;