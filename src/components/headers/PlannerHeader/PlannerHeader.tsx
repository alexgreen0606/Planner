import { usePathname } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import { getWeatherByDatestampAtom } from '@/atoms/weatherAtoms';
import PlannerActions from '@/components/actions/PlannerActions';
import Icon from '@/components/icons/Icon';
import CustomText from '@/components/text/CustomText';
import FadeInView from '@/components/views/FadeInView';
import { useExternalDataContext } from '@/providers/ExternalDataProvider';
import { useScrollRegistry } from '@/providers/ScrollRegistry';
import {
  getDayOfWeekFromDatestamp,
  getDaysUntilIso,
  getMonthDateFromDatestamp,
  getTodayDatestamp,
  getTomorrowDatestamp,
  getYesterdayDatestamp
} from '@/utils/dateUtils';

import { useCollapsibleHeader } from '@/hooks/collapsibleHeaders/useCollapsibleHeader';
import PlannerCarousel, { CAROUSEL_HEIGHT } from './microComponents/PlannerCarousel';
import PlannerChipSets from './microComponents/PlannerChipSets';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PlannerHeader = ({ datestamp }: { datestamp: string }) => {
  const weatherData = useAtomValue(getWeatherByDatestampAtom(datestamp));
  // const isCollapsed = useCollapsibleHeader(datestamp, 60);
  const isCollapsed = false

  const { top: TOP_SPACER } = useSafeAreaInsets();

  const todayDatestamp = useAtomValue(todayDatestampAtom);
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

    return {
      label,
      dayOfWeek: getDayOfWeekFromDatestamp(datestamp),
      date: getMonthDateFromDatestamp(datestamp)
    };
  }, [todayDatestamp, datestamp]);

  return (
    <View className="px-4 gap-2">
      <PlannerCarousel isCollapsed={isCollapsed} datestamp={datestamp} />

      <View className="flex-row w-full justify-between">
        <View>
          <CustomText variant="upcomingDatesHeader">{dayOfWeek}</CustomText>
          <CustomText
            variant="detail"
            customStyle={{
              color: PlatformColor('secondaryLabel')
            }}
          >
            {date}
          </CustomText>
        </View>

        <View className='flex-row gap-1'>
          {weatherData && (
            <FadeInView>
              <View className="px-4 py-2 flex-row gap-2">
                <View className="justify-center">
                  <Icon size={26} name={weatherData.symbol} type="multicolor" />
                </View>
                <View>
                  <CustomText variant="weatherCondition">{weatherData.condition}</CustomText>
                  <CustomText variant="weatherTemperature">
                    {weatherData.high}° | {weatherData.low}°
                  </CustomText>
                </View>
              </View>
            </FadeInView>
          )}
          <PlannerActions datestamp={datestamp} />
        </View>
      </View>

      <PlannerChipSets label={label} datestamp={datestamp} />
    </View>
  );
};

export default PlannerHeader;
