import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getMonthDateFromDatestamp, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlannerActions from '../actions/PlannerActions';
import CustomText from '../text/CustomText';
import PlannerCarousel from './microComponents/PlannerCarousel';

// ✅ 

const PlannerHeader = ({ datestamp }: TPlannerPageParams) => {
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

    return (
        <View className='w-full' style={{ marginTop: TOP_SPACER }}>

            {/* Planner Carousel */}
            <PlannerCarousel datestamp={datestamp} />

            {/* Selected Date Details */}
            <View className='flex-row justify-between items-center px-4'>
                <View>
                    <CustomText variant='pageLabel'>
                        {dayOfWeek}
                    </CustomText>
                    <CustomText variant='detail' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                        {date}
                    </CustomText>
                </View>
                <PlannerActions datestamp={datestamp} />
            </View>
        </View>
    )
};

export default PlannerHeader;