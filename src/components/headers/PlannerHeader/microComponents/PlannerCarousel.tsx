import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

import { plannerCarouselDataAtom } from '@/atoms/planner/plannerCarouselWeekAtom';
import Icon from '@/components/icons/Icon';
import CustomText from '@/components/text/CustomText';
import {
  LARGE_MARGIN,
  PLANNER_CAROUSEL_ICON_WIDTH,
  SMALL_MARGIN
} from '@/lib/constants/miscLayout';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { useScrollRegistry } from '@/providers/ScrollRegistry';

import PlannerCarouselWeek from './PlannerCarouselWeek';

const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const { weeks, map } = useAtomValue(plannerCarouselDataAtom);

  const { currentDatestampWeek, currentDatestampSundayIndex } = useMemo(() => {
    const currentDate = DateTime.fromISO(currentDatestamp);
    const currentSunday = currentDate.minus({ days: currentDate.weekday % 7 }).toISODate()!;
    return {
      currentDatestampWeek: map[currentSunday],
      currentDatestampSundayIndex: weeks.indexOf(currentSunday)
    };
  }, [currentDatestamp]);

  const scrollRegistry = useScrollRegistry();
  const scrollY = scrollRegistry.get(currentDatestamp) ?? { value: 0 };

  const [currentWeek, setCurrentWeek] = useState(currentDatestampWeek);

  const { startMonth, startYear, endMonth, endYear } = useMemo(() => {
    const startDate = DateTime.fromISO(currentWeek[0]);
    const endDate = DateTime.fromISO(currentWeek[6]);
    return {
      startYear: startDate.toFormat('yyyy'),
      startMonth: startDate.toFormat('LLLL'),
      endMonth: endDate.toFormat('LLLL'),
      endYear: endDate.toFormat('yyyy')
    };
  }, [currentWeek]);

  function handleWeekChange(index: number) {
    setCurrentWeek(map[weeks[index]]);
  }

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 20], [1, 0], Extrapolation.CLAMP)
  }));

  return (
    <Animated.View style={headerStyle}>
      <Host
        style={{
          height: 22 + PLANNER_CAROUSEL_ICON_WIDTH + SMALL_MARGIN * 2,
          width: '100%'
        }}
      >
        <VStack
          modifiers={[
            glassEffect({
              glass: { variant: 'regular' },
              shape: 'rectangle'
            }),
            cornerRadius(8)
          ]}
        >
          <View className="w-full py-2">
            {/* Week Info */}
            <View className="flex-row justify-between items-center px-4">
              <CustomText variant="month">
                {startMonth}
                {startYear !== endYear && ` ${startYear}`}
                {startMonth !== endMonth && ` / ${endMonth}`} {endYear}
              </CustomText>
              <Icon size={22} name="calendar" />
            </View>

            {/* Scroll Wheel */}
            <Carousel
              data={weeks}
              renderItem={({ item: startDatestamp }) => (
                <View
                  style={{
                    width: SCREEN_WIDTH - LARGE_MARGIN * 4,
                    marginLeft: LARGE_MARGIN
                  }}
                >
                  <PlannerCarouselWeek
                    datestamps={map[startDatestamp]}
                    currentDatestamp={currentDatestamp}
                  />
                </View>
              )}
              onSnapToItem={handleWeekChange}
              loop={false}
              defaultIndex={currentDatestampSundayIndex}
              windowSize={7}
              width={SCREEN_WIDTH - LARGE_MARGIN * 2}
              height={PLANNER_CAROUSEL_ICON_WIDTH}
            />
          </View>
        </VStack>
      </Host>
    </Animated.View>
  );
};

export default PlannerCarousel;
