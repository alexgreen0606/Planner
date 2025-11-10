import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';

import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import { getWeatherByDatestampAtom } from '@/atoms/weatherAtoms';
import PlannerActions from '@/components/actions/PlannerActions';
import Icon from '@/components/Icon';
import CustomText from '@/components/text/CustomText';
import FadeInView from '@/components/views/FadeInView';
import {
  getDayOfWeekFromDatestamp,
  getDaysUntilIso,
  getMonthDateFromDatestamp,
  getTodayDatestamp,
  getTomorrowDatestamp,
  getYesterdayDatestamp
} from '@/utils/dateUtils';

import PlannerCarousel from './microComponents/PlannerCarousel';
import PlannerChipSets from './microComponents/PlannerChipSets';

interface IPlannerHeaderProps {
  activeDatestamp: string;
}

const PlannerHeader = ({ activeDatestamp }: IPlannerHeaderProps) => {
  const weatherData = useAtomValue(getWeatherByDatestampAtom(activeDatestamp));

  // const isCollapsed = useCollapsibleHeader(datestamp, 60);
  const isCollapsed = false

  const todayDatestamp = useAtomValue(todayDatestampAtom);
  const { label, dayOfWeek, date } = useMemo(() => {
    let label = '';

    const daysUntilDate = getDaysUntilIso(activeDatestamp);
    if (activeDatestamp === getTodayDatestamp()) {
      label = 'Today';
    } else if (activeDatestamp === getTomorrowDatestamp()) {
      label = 'Tomorrow';
    } else if (activeDatestamp === getYesterdayDatestamp()) {
      label = 'Yesterday';
    } else if (daysUntilDate > 0) {
      label = `${daysUntilDate} days away`;
    } else {
      const absDays = Math.abs(daysUntilDate);
      label = `${absDays} day${absDays > 1 ? 's' : ''} ago`;
    }

    return {
      label,
      dayOfWeek: getDayOfWeekFromDatestamp(activeDatestamp),
      date: getMonthDateFromDatestamp(activeDatestamp)
    };
  }, [todayDatestamp, activeDatestamp]);

  return (
    <View className="px-4 gap-2">
      <PlannerCarousel isCollapsed={isCollapsed} activeDatestamp={activeDatestamp} />

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
          <PlannerActions datestamp={activeDatestamp} />
        </View>
      </View>

      <PlannerChipSets label={label} datestamp={activeDatestamp} />
    </View>
  );
};

export default PlannerHeader;
