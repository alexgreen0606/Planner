import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { useExternalDataContext } from '@/providers/ExternalDataProvider';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getMonthDateFromDatestamp, getTodayDatestamp, getTomorrowDatestamp, getYesterdayDatestamp } from '@/utils/dateUtils';
import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import PlannerActions from '../actions/PlannerActions';
import PlannerChipSets from '../PlannerChip/PlannerChipSets';
import CustomText from '../text/CustomText';
import PlannerCarousel from './microComponents/PlannerCarousel';

// ✅ 

const PlannerHeader = () => {
    const { datestamp } = useLocalSearchParams<TPlannerPageParams>();
    const pathname = usePathname();

    const todayDatestamp = useAtomValue(todayDatestampAtom);

    const { loadingPathnames } = useExternalDataContext();

    const [showLoading, setShowLoading] = useState(false);

    const { label, dayOfWeek, date } = useMemo(() => {
        let label = '';

        const daysUntilDate = getDaysUntilIso(datestamp);

        if (datestamp === getTodayDatestamp()) {
            label = 'Today';
        } else if (datestamp === getTomorrowDatestamp()) {
            label = 'Tomorrow';
        } else if (datestamp === getYesterdayDatestamp()) {
            label = 'Yesterday';
        } else if (daysUntilDate > 0) {
            label = `${daysUntilDate} days away`;
        } else {
            const absDays = Math.abs(daysUntilDate);
            label = `${absDays} day${absDays > 1 ? 's' : ''} ago`;
        }

        return { label, dayOfWeek: getDayOfWeekFromDatestamp(datestamp), date: getMonthDateFromDatestamp(datestamp) };
    }, [todayDatestamp, datestamp]);

    const isLoading = loadingPathnames.has(pathname);
    const MIN_SHIMMER = 4000;

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isLoading) {
            // When loading starts → show immediately
            setShowLoading(true);
        } else {
            // When loading ends → delay fade-out to finish shimmer cycle
            timeout = setTimeout(() => setShowLoading(false), MIN_SHIMMER);
        }

        return () => clearTimeout(timeout);
    }, [isLoading]);

    return (
        <View className='px-4 gap-2'>

            <PlannerCarousel datestamp={datestamp} />

            <View className='flex-row w-full justify-between items-center'>
                <Host>
                    <VStack modifiers={[glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }), cornerRadius(8)]}>
                        <View className='px-4 py-2 relative'>
                            <CustomText variant='pageLabel'>
                                {dayOfWeek}
                            </CustomText>
                            <View className='flex-row gap-1'>
                                <CustomText variant='detail' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                                    {date}
                                </CustomText>
                                <View className='h-full' style={{ width: StyleSheet.hairlineWidth, backgroundColor: PlatformColor('label') }} />
                                <CustomText variant='detail' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                                    {label}
                                </CustomText>
                            </View>
                        </View>
                    </VStack>
                </Host>
                <PlannerActions datestamp={datestamp} />
            </View>

            <PlannerChipSets datestamp={datestamp} />
        </View>
    )
};

export default PlannerHeader;