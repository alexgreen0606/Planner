import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
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

import PlannerCarousel from './microComponents/PlannerCarousel';
import PlannerChipSets from './microComponents/PlannerChipSets';

// ✅

const PlannerHeader = ({ datestamp }: { datestamp: string }) => {
  const pathname = usePathname();

  const { loadingPathnames } = useExternalDataContext();

  const scrollRegistry = useScrollRegistry();

  const weatherData = useAtomValue(getWeatherByDatestampAtom(datestamp));
  const todayDatestamp = useAtomValue(todayDatestampAtom);

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

    return {
      label,
      dayOfWeek: getDayOfWeekFromDatestamp(datestamp),
      date: getMonthDateFromDatestamp(datestamp)
    };
  }, [todayDatestamp, datestamp]);

  const scrollY = scrollRegistry.get(datestamp) ?? { value: 0 };
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

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.min(scrollY.value, 20) }]
  }));

  return (
    <Animated.View className="px-4 gap-2" style={headerStyle}>
      <PlannerCarousel datestamp={datestamp} />

      <View className="flex-row w-full justify-between">
        <View className="flex-row gap-2">
          <Host style={{ height: 60 }}>
            <VStack
              modifiers={[
                glassEffect({
                  glass: {
                    variant: 'regular'
                  },
                  shape: 'rectangle'
                }),
                cornerRadius(8),
                frame({ height: 60 })
              ]}
            >
              <View className="px-4 py-2">
                <CustomText variant="pageLabel">{dayOfWeek}</CustomText>
                <CustomText
                  variant="detail"
                  customStyle={{
                    color: PlatformColor('secondaryLabel')
                  }}
                >
                  {date}
                </CustomText>
              </View>
            </VStack>
          </Host>
          {weatherData && (
            <FadeInView>
              <Host style={{ height: 42 }}>
                <VStack
                  modifiers={[
                    glassEffect({
                      glass: {
                        variant: 'regular'
                      },
                      shape: 'rectangle'
                    }),
                    cornerRadius(8),
                    frame({
                      height: 42
                    })
                  ]}
                >
                  <View className="px-4 py-2 flex-row gap-2">
                    <View className="h-full justify-center">
                      <Icon size={26} name={weatherData.symbol} type="multicolor" />
                    </View>
                    <View>
                      <CustomText variant="weatherCondition">{weatherData.condition}</CustomText>
                      <CustomText variant="weatherTemperature">
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
    </Animated.View>
  );
};

export default PlannerHeader;
