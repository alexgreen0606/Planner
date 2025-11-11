import { Host, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { plannerCarouselDataAtom } from '@/atoms/planner/plannerCarouselWeekAtom';
import Icon from '@/components/Icon';
import CustomText from '@/components/text/CustomText';
import {
  LARGE_MARGIN,
  SMALL_MARGIN
} from '@/lib/constants/layout';
import { EPlannerCarouselLayout } from '@/lib/enums/planners/EPlannerCarouselLayout';

import PlannerCarouselWeek from './PlannerCarouselWeek';

interface IPlannerCarouselProps {
  activeDatestamp: string;
  isCollapsed: boolean;
}

const PlannerCarousel = ({ activeDatestamp, isCollapsed }: IPlannerCarouselProps) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { top: TOP_SPACER } = useSafeAreaInsets();

  // Build the carousel data to render.
  const { weeks, map } = useAtomValue(plannerCarouselDataAtom);
  const { currentDatestampWeek, currentDatestampSundayIndex } = useMemo(() => {
    const currentDate = DateTime.fromISO(activeDatestamp);
    const currentSunday = currentDate.minus({ days: currentDate.weekday % 7 }).toISODate()!;
    return {
      currentDatestampWeek: map[currentSunday],
      currentDatestampSundayIndex: weeks.indexOf(currentSunday)
    };
  }, [activeDatestamp]);

  // Todo: update this when the current datestamp changes. Use atom to store this and above.
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

  return (
    <View className='w-full relative' style={{ marginTop: TOP_SPACER }}>

      <MotiView
        className='absolute z-[1]'
        animate={{
          top: isCollapsed ? -20 : SMALL_MARGIN,
          right: isCollapsed ? SCREEN_WIDTH - 22 - LARGE_MARGIN * 2 : LARGE_MARGIN
        }}
      >
        <Icon size={22} name="calendar" />
      </MotiView>

      <MotiView
        className='overflow-hidden'
        animate={{ height: isCollapsed ? 0 : EPlannerCarouselLayout.CAROUSEL_HEIGHT }}
      >
        <Host
          style={{
            height: EPlannerCarouselLayout.CAROUSEL_HEIGHT,
            width: '100%'
          }}
        >
          <VStack
            modifiers={[
              glassEffect({
                glass: { variant: 'regular' },
                shape: 'rectangle'
              }),
              cornerRadius(8),
              frame({ height: EPlannerCarouselLayout.CAROUSEL_HEIGHT })
            ]}
          >
            <View className="w-full py-2">
              {/* Week Info */}
              <View className="flex-row justify-between items-center px-4 h-[22]">
                <CustomText variant="plannerCarouselMonth">
                  {startMonth}
                  {startYear !== endYear && ` ${startYear}`}
                  {startMonth !== endMonth && ` / ${endMonth}`} {endYear}
                </CustomText>
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
                      currentDatestamp={activeDatestamp}
                    />
                  </View>
                )}
                onSnapToItem={handleWeekChange}
                loop={false}
                defaultIndex={currentDatestampSundayIndex}
                windowSize={7}
                width={SCREEN_WIDTH - LARGE_MARGIN * 2}
                height={EPlannerCarouselLayout.DATESTAMP_ICON_SIZE}
              />
            </View>
          </VStack>
        </Host>
      </MotiView>
    </View>
  );
};

export default PlannerCarousel;
