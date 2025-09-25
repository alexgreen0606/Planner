import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import useAppTheme from '@/hooks/useAppTheme';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import GlassIconButton from '../icon/GlassButtonIcon';
import PlannerCarousel from '../PlannerCarousel';
import PlannerChipSets from '../PlannerChip/PlannerChipSets';
import CustomText from '../text/CustomText';
import { PLANNER_BANNER_PADDING } from '@/lib/constants/miscLayout';

// ✅ 

type TPlannerBannerProps = {
    datestamp: string;
};

const PlannerBanner = ({ datestamp }: TPlannerBannerProps) => {
    const { today } = useAtomValue(mountedDatestampsAtom);

    const { background } = useAppTheme();

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

    return (
        <View className='w-full' style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}>

            {/* Planner Icon Carousel */}
            <PlannerCarousel />

            {/* Planner Details */}
            <View className='flex-row justify-between mb-2'>
                <View>
                    <CustomText variant='pageLabel'>
                        {dayOfWeek}
                    </CustomText>
                    <CustomText variant='detail' className='-mt-0.5' style={{ color: PlatformColor('secondaryLabel') }}>
                        {label}
                    </CustomText>
                </View>
                <GlassIconButton systemImage='ellipsis' />
            </View>

            {/* Planner Chips */}
            <PlannerChipSets
                datestamp={datestamp}
                backgroundPlatformColor={background}
            />

        </View>
    )
};

export default PlannerBanner;