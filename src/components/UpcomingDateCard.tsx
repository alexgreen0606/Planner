import * as Calendar from 'expo-calendar';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

import { calendarMapAtom } from '@/atoms/planner/calendarAtoms';
import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import { calendarIconMap } from '@/lib/constants/calendarIconMap';
import { PRESSABLE_OPACITY } from '@/lib/constants/generic';
import { LARGE_MARGIN } from '@/lib/constants/layout';
import { getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { openEditEventModal, openViewEventModal } from '@/utils/plannerUtils';

import Icon from './Icon';
import CustomText, { textStyles } from './text/CustomText';
import DateValue from './text/DateValue';

interface IUpcomingDateCardProps {
  datestamp: string;
  events: Calendar.Event[];
  index: number;
};

const UpcomingDateCard = ({ datestamp, events, index }: IUpcomingDateCardProps) => {
  const calendarMap = useAtomValue(calendarMapAtom);
  const router = useRouter();

  const todayDatestamp = useAtomValue(todayDatestampAtom);
  const countdownLabel = useMemo(() => {
    let countdownLabel = '';

    const daysUntilDate = getDaysUntilIso(datestamp);

    if (datestamp === getTodayDatestamp()) {
      countdownLabel = 'Today';
    } else if (datestamp === getTomorrowDatestamp()) {
      countdownLabel = 'Tomorrow';
    } else if (daysUntilDate > 0) {
      countdownLabel = `${daysUntilDate} days`;
    }

    return countdownLabel;
  }, [todayDatestamp, datestamp]);

  function handleOpenPlanner() {
    router.push(`/planners/${datestamp}`);
  }

  function handleOpenEventModal(event: Calendar.Event, calendar: Calendar.Calendar) {
    if (calendar.allowsModifications) {
      openEditEventModal(event.id, datestamp);
    } else {
      openViewEventModal(event.id);
    }
  }

  const minimumContainerHeight = textStyles['dateValue'].fontSize + LARGE_MARGIN * 2;

  return (
    <Animated.View entering={SlideInRight} layout={LinearTransition} exiting={SlideOutLeft}>
      <View
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: PlatformColor('systemGray'),
          borderTopWidth: index === 0 ? StyleSheet.hairlineWidth : 0,
          minHeight: minimumContainerHeight
        }}
        className="flex-row gap-2"
      >
        {/* Date */}
        <TouchableOpacity
          onPress={handleOpenPlanner}
          activeOpacity={PRESSABLE_OPACITY}
          className="w-[80] justify-center"
          style={{ height: minimumContainerHeight }}
        >
          <DateValue isoTimestamp={datestamp} platformColor="secondaryLabel" />
        </TouchableOpacity>

        {/* Events */}
        <View
          className="flex-1 gap-3 justify-center"
          style={{
            minHeight: minimumContainerHeight,
            paddingVertical: (minimumContainerHeight - 16) / 2
          }}
        >
          {events.map((event) => {
            const calendar = calendarMap[event.calendarId];
            const calendarName = calendar?.title || 'Calendar';
            const iconName = calendarIconMap[calendarName] || calendarIconMap['Calendar'];
            const color = calendar?.color || '#000000';
            return (
              <TouchableOpacity
                onPress={() => handleOpenEventModal(event, calendar)}
                activeOpacity={PRESSABLE_OPACITY}
                className="flex-row items-center gap-2"
                key={`${event.id}-upcoming-event`}
              >
                <Icon name={iconName} color={color} size={16} />
                <CustomText variant="upcomingEvent">{event.title}</CustomText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Countdown */}
        <View
          style={{ height: minimumContainerHeight }}
          className="w-22 items-end justify-center"
        >
          <CustomText variant="pageSubHeader">{countdownLabel}</CustomText>
        </View>
      </View>
    </Animated.View>
  );
};

export default UpcomingDateCard;
