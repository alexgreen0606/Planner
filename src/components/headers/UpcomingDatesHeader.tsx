import { useAtomValue, useSetAtom } from 'jotai';
import { MotiText, MotiView } from 'moti';
import { useMemo } from 'react';
import { PlatformColor, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  activeCalendarFiltersAtom,
  calendarMapAtom,
  primaryCalendarAtom,
  toggleCalendarFilterAtom
} from '@/atoms/planner/calendarAtoms';
import { useCollapsibleHeader } from '@/hooks/collapsibleHeaders/useCollapsibleHeader';
import { calendarIconMap } from '@/lib/constants/calendarIconMap';
import { UPCOMING_DATES_SCROLL_KEY } from '@/lib/constants/generic';
import { EHeaderHeight } from '@/lib/enums/EHeaderHeight';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { getRgbFromHex } from '@/utils/colorUtils';

import ActionList from '../ActionList';
import IconButton from '../buttons/IconButton';
import CustomText, { textStyles } from '../text/CustomText';
import ShadowView from '../views/ShadowView';

const UpcomingDatesHeader = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets();

  const isCollapsed = useCollapsibleHeader(UPCOMING_DATES_SCROLL_KEY, EHeaderHeight.UPCOMING_DATES);

  const activeCalendarFilters = useAtomValue(activeCalendarFiltersAtom);
  const toggleCalendarFilter = useSetAtom(toggleCalendarFilterAtom);
  const primaryCalendar = useAtomValue(primaryCalendarAtom);
  const calendarMap = useAtomValue(calendarMapAtom);

  const calendars = useMemo(() => {
    return Object.values(calendarMap)
      .map((calendar) => ({
        ...calendar,
        iconName: calendarIconMap[calendar.title] ?? 'calendar'
      }))
      .sort((a, b) => (a.id === primaryCalendar?.id ? -1 : b.id === primaryCalendar?.id ? 1 : 0));
  }, [calendarMap, calendarIconMap, primaryCalendar]);

  function handleGetIsCalendarActive(calendarId: string) {
    return activeCalendarFilters.size === 0 || activeCalendarFilters.has(calendarId);
  }

  return (
    <View
      style={{ marginTop: TOP_SPACER, height: EHeaderHeight.UPCOMING_DATES }}
      className="flex-row justify-between items-start px-4"
    >
      <View>
        {/* Page Label */}
        <ShadowView edgeSize={{ right: 200 }}>
          {/* Header */}
          <MotiText
            style={textStyles['pageHeader']}
            animate={{
              // @ts-ignore
              fontSize: isCollapsed ? 22 : 32
            }}
          >
            <Text style={{ color: PlatformColor('label') }}>
              Upcoming Dates
            </Text>
          </MotiText>
        </ShadowView>

        {/* Subheader */}
        <MotiView
          className="overflow-hidden"
          animate={{
            height: isCollapsed ? 0 : 20
          }}
        >
          <CustomText variant="pageSubHeader">All-day calendar events</CustomText>
        </MotiView>

        {/* Calendar Filter Indicator */}
        <View className="flex-row gap-1 mt-1">
          {calendars.map(({ title, color, id }) => (
            <MotiView
              animate={{
                opacity: handleGetIsCalendarActive(id) ? 1 : 0.4
              }}
              key={`${title}-filter-indicator`}
            >
              <IconButton
                onClick={() => toggleCalendarFilter(id)}
                name={calendarIconMap[title] ?? 'calendar'}
                color={color}
                size={18}
              />
            </MotiView>
          ))}
        </View>
      </View>

      {/* Filter Popup List */}
      <ActionList
        systemImage="line.3.horizontal.decrease"
        actions={calendars.map((calendar) => ({
          title: calendar.title,
          type: EPopupActionType.BUTTON,
          systemImage: calendar.iconName,
          color: handleGetIsCalendarActive(calendar.id)
            ? calendar.color
            : getRgbFromHex(calendar.color),
          onPress: () => toggleCalendarFilter(calendar.id)
        }))}
        wrapButton
      />
    </View>
  );
};

export default UpcomingDatesHeader;
