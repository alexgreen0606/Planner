import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import useAppTheme from '@/hooks/useAppTheme';
import { PLANNER_BANNER_PADDING, THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlannerActions from '../actions/PlannerActions';
import PlannerCarousel from '../PlannerCarousel';
import PlannerChipSets from '../PlannerChip/PlannerChipSets';
import ShadowView from '../views/ShadowView';
import CustomText from '../text/CustomText';

// ✅ 

type TPlannerHeaderProps = {
    datestamp: string;
    isSpacer?: boolean;
};

const PlannerHeader = ({ datestamp, isSpacer }: TPlannerHeaderProps) => {
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

    const { background } = useAppTheme();

    return (
        <View
            className='w-full'
            style={{
                paddingHorizontal: PLANNER_BANNER_PADDING,
                paddingTop: isSpacer ? 0 : TOP_SPACER,
                pointerEvents: isSpacer ? 'none' : undefined,
                opacity: isSpacer ? 0 : 1,
            }}
        >

            {/* Planner Icon Carousel */}
            <PlannerCarousel datestamp={datestamp} />

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

        </View>
    )
};

export default PlannerHeader;