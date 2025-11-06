import { useAtomValue, useSetAtom } from 'jotai'
import { MotiText, MotiView } from 'moti'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useAnimatedReaction } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { runOnJS } from 'react-native-worklets'

import {
  activeCalendarFiltersAtom,
  calendarMapAtom,
  primaryCalendarAtom,
  toggleCalendarFilterAtom,
} from '@/atoms/planner/calendarAtoms'
import { calendarIconMap } from '@/lib/constants/calendarIcons'
import { UPCOMING_DATES_SCROLL_KEY } from '@/lib/constants/scrollRegistryKeys'
import { EPopupActionType } from '@/lib/enums/EPopupActionType'
import { useScrollRegistry } from '@/providers/ScrollRegistry'
import { hexToRgba } from '@/utils/colorUtils'

import IconButton from '../../icons/IconButton'
import PopupList from '../../PopupList'
import CustomText, { textStyles } from '../../text/CustomText'
import ShadowView from '../../views/ShadowView'

// ✅

const HEADER_HEIGHT = 90

const UpcomingDatesHeader = () => {
  const { top: TOP_SPACER } = useSafeAreaInsets()

  const scrollRegistry = useScrollRegistry()
  const scrollY = scrollRegistry.get(UPCOMING_DATES_SCROLL_KEY) ?? { value: 0 }

  const activeCalendarFilters = useAtomValue(activeCalendarFiltersAtom)
  const toggleCalendarFilter = useSetAtom(toggleCalendarFilterAtom)
  const primaryCalendar = useAtomValue(primaryCalendarAtom)
  const calendarMap = useAtomValue(calendarMapAtom)

  const [collapseHeader, setCollapseHeader] = useState(false)

  const calendars = useMemo(() => {
    return Object.values(calendarMap)
      .map((calendar) => ({
        ...calendar,
        iconName: calendarIconMap[calendar.title] ?? 'calendar',
      }))
      .sort((a, b) => (a.id === primaryCalendar?.id ? -1 : b.id === primaryCalendar?.id ? 1 : 0))
  }, [calendarMap, calendarIconMap, primaryCalendar])

  // Collapse the header whenever the user scrolls past the default scroll position.
  const headerCollapseThreshold = -HEADER_HEIGHT + 1
  useAnimatedReaction(
    () => scrollY.value,
    (offset) => {
      if (!collapseHeader && offset >= headerCollapseThreshold) {
        runOnJS(setCollapseHeader)(true)
      } else if (collapseHeader && offset < headerCollapseThreshold) {
        runOnJS(setCollapseHeader)(false)
      }
    },
  )

  function handleGetIsCalendarActive(calendarId: string) {
    return activeCalendarFilters.size === 0 || activeCalendarFilters.has(calendarId)
  }

  return (
    <View
      style={{ marginTop: TOP_SPACER, height: HEADER_HEIGHT }}
      className="flex-row justify-between items-start px-4"
    >
      <View>
        {/* Page Label */}
        <ShadowView edgeSize={{ right: 200 }}>
          {/* Header */}
          <MotiText
            style={textStyles['upcomingDatesHeader']}
            animate={{
              // @ts-ignore
              fontSize: collapseHeader ? 18 : 28,
            }}
          >
            Upcoming Dates
          </MotiText>
        </ShadowView>

        {/* Subheader */}
        <MotiView
          className="overflow-hidden"
          animate={{
            height: collapseHeader ? 0 : 20,
          }}
        >
          <CustomText variant="upcomingDatesSubHeader">All-day calendar events</CustomText>
        </MotiView>

        {/* Calendar Filter Indicator */}
        <View className="flex-row gap-1 mt-1">
          {calendars.map(({ title, color, id }) => (
            <MotiView
              animate={{ opacity: handleGetIsCalendarActive(id) ? 1 : 0.4 }}
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
      <PopupList
        systemImage="line.3.horizontal.decrease"
        actions={calendars.map((calendar) => ({
          title: calendar.title,
          type: EPopupActionType.BUTTON,
          systemImage: calendar.iconName,
          color: handleGetIsCalendarActive(calendar.id)
            ? calendar.color
            : hexToRgba(calendar.color),
          onPress: () => toggleCalendarFilter(calendar.id),
        }))}
        wrapButton
      />
    </View>
  )
}

export default UpcomingDatesHeader
