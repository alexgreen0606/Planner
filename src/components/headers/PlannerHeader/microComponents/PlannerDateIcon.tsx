import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import Icon from '@/components/Icon';
import CustomText from '@/components/text/CustomText';
import FadeInView from '@/components/views/FadeInView';
import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { EPlannerCarouselLayout } from '@/lib/enums/planners/EPlannerCarouselLayout';
import { isTimeEarlier } from '@/utils/dateUtils';

interface IPlannerDateIconProps {
  datestamp: string;
  isCurrentDatestamp: boolean;
};

const PlannerDateIcon = ({ datestamp, isCurrentDatestamp }: IPlannerDateIconProps) => {
  const router = useRouter();

  const { dayOfMonth, dayOfWeek, isWeekend } = useMemo(() => {
    const date = DateTime.fromISO(datestamp);
    const dayOfWeek = date.toFormat('ccc').toUpperCase();
    return {
      dayOfMonth: date.toFormat('d'),
      dayOfWeek,
      isWeekend: ['SAT', 'SUN'].includes(dayOfWeek)
    };
  }, [datestamp]);

  // Track datestamp's relation to today.
  const todayDatestamp = useAtomValue(todayDatestampAtom);
  const { isTodayDatestamp, isPastDate } = useMemo(
    () => ({
      isTodayDatestamp: datestamp === todayDatestamp,
      isPastDate: isTimeEarlier(datestamp, todayDatestamp)
    }),
    [datestamp, todayDatestamp]
  );

  function handlePress() {
    router.push(`/planners/${datestamp}`);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={PRESSABLE_OPACITY}
      style={{
        width: EPlannerCarouselLayout.DATESTAMP_ICON_SIZE,
        height: EPlannerCarouselLayout.DATESTAMP_ICON_SIZE
      }}
      className="w-full h-full items-center pt-[0.3rem]"
    >
      {isCurrentDatestamp && (
        <FadeInView className="absolute">
          <Icon name="note" color="systemBlue" size={EPlannerCarouselLayout.DATESTAMP_ICON_SIZE} />
        </FadeInView>
      )}

      <CustomText
        variant="plannerCarouselDayOfWeek"
        customStyle={{
          color: PlatformColor(
            isCurrentDatestamp
              ? 'systemBackground'
              : isTodayDatestamp
                ? 'systemBlue'
                : isPastDate
                  ? 'tertiaryLabel'
                  : isWeekend
                    ? 'secondaryLabel'
                    : 'label'
          ),
          opacity: isTodayDatestamp && !isCurrentDatestamp ? 0.8 : undefined
        }}
      >
        {dayOfWeek}
      </CustomText>
      <CustomText
        variant="plannerCarouselDayOfMonth"
        customStyle={{
          color: PlatformColor(
            isCurrentDatestamp
              ? 'label'
              : isTodayDatestamp
                ? 'systemBlue'
                : isPastDate
                  ? 'tertiaryLabel'
                  : isWeekend
                    ? 'secondaryLabel'
                    : 'label'
          ),
          opacity: isTodayDatestamp && !isCurrentDatestamp ? 0.8 : undefined
        }}
      >
        {dayOfMonth}
      </CustomText>
    </TouchableOpacity>
  );
};

export default PlannerDateIcon;
