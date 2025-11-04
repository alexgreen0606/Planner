import { todayDatestampAtom } from '@/atoms/todayDatestamp';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { useExternalDataContext } from '@/providers/ExternalDataProvider';
import { getDayOfWeekFromDatestamp, getDaysUntilIso, getMonthDateFromDatestamp, getTodayDatestamp, getTomorrowDatestamp, getYesterdayDatestamp } from '@/utils/dateUtils';
import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import PlannerActions from '../actions/PlannerActions';
import PlannerChipSets from './microComponents/PlannerChipSets';
import CustomText from '../text/CustomText';
import PlannerCarousel from './microComponents/PlannerCarousel';
import { weatherForDatestampAtom } from '@/atoms/weatherAtoms';
import Icon from '../icons/Icon';
import FadeInView from '../views/FadeInView';

// ✅ 

const PlannerHeader = () => {
    const { datestamp } = useLocalSearchParams<TPlannerPageParams>();
    const pathname = usePathname();

    const weatherData = useAtomValue(weatherForDatestampAtom(datestamp));
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

            <View className='flex-row w-full justify-between'>
                <View className='flex-row gap-2'>
                    <Host style={{ height: 60 }}>
                        <VStack modifiers={[glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }), cornerRadius(8), frame({ height: 60 })]}>
                            <View className='px-4 py-2'>
                                <CustomText variant='pageLabel'>
                                    {dayOfWeek}
                                </CustomText>
                                {/* <View className='flex-row gap-1'> */}
                                <CustomText variant='detail' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                                    {date}
                                </CustomText>
                                {/* <View className='h-full' style={{ width: StyleSheet.hairlineWidth, backgroundColor: PlatformColor('label') }} />
                                    <CustomText variant='detail' customStyle={{ color: PlatformColor('secondaryLabel') }}>
                                        {label}
                                    </CustomText> */}
                                {/* </View> */}
                            </View>
                        </VStack>
                    </Host>
                    {weatherData && (
                        <FadeInView>
                            <Host style={{ height: 42 }}>
                                <VStack modifiers={[glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }), cornerRadius(8), frame({ height: 42 })]}>
                                    <View className='px-4 py-2 flex-row gap-2'>
                                        <View className='h-full justify-center'>
                                            <Icon size={26} name={weatherData.symbol} type='multicolor' />
                                        </View>
                                        <View>
                                            <CustomText variant='weatherCondition'>
                                                {weatherData.condition}
                                            </CustomText>
                                            <CustomText variant='weatherTemperature'>
                                                {weatherData.high}° | {weatherData.low}°
                                            </CustomText>
                                        </View>
                                    </View>
                                </VStack>
                            </Host>
                        </FadeInView>
                    )}
                </View>

                <PlannerActions datestamp={datestamp} />
            </View>

            <PlannerChipSets label={label} datestamp={datestamp} />
        </View>
    )
};

export default PlannerHeader;