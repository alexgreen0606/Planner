import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import TodayBanner from '@/components/banners/TodayBanner';
import EventChipSets from '@/components/eventChip/EventChipSet';
import TodayPlanner from '@/components/lists/TodayPlanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import SlowFadeInView from '@/components/SlowFadeInView';
import useCalendarData from '@/hooks/useCalendarData';
import useAppPlatformColors from '@/hooks/useColorTheme';
import usePlanner from '@/hooks/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

const Today = () => {
  const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

  const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
  const calendarEventData = useAtomValue(calendarEventDataAtom);

  const { calendarChips } = useCalendarData(todayDatestamp);

  const { background } = useAppPlatformColors();

  const {
    isEditingTitle,
    planner,
    visibleEventIds,
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onUpdatePlannerEventValueWithTimeParsing,
    onEditTitle,
    onToggleEditTitle
  } = usePlanner(todayDatestamp, eventStorage);

  const isCalendarLoading = useMemo(
    () => calendarEventData.plannersMap[todayDatestamp] === undefined,
    [todayDatestamp, calendarEventData]
  );

  return isCalendarLoading ? (
    <LoadingSpinner />
  ) : (
    <ScrollContainerProvider
      header={
        <TodayBanner
          today={planner}
          datestamp={todayDatestamp}
          isEditingTitle={isEditingTitle}
          onEditTitle={onEditTitle}
          onToggleEditTitle={onToggleEditTitle}
        />
      }
      floatingBanner={calendarChips.length > 0 &&
        <SlowFadeInView>
          <EventChipSets
            datestamp={todayDatestamp}
            sets={calendarChips}
            backgroundPlatformColor={background}
          />
        </SlowFadeInView>
      }
    >
      <TodayPlanner
        eventStorage={eventStorage}
        visibleEventIds={visibleEventIds}
        onUpdatePlannerEventIndexWithChronologicalCheck={onUpdatePlannerEventIndexWithChronologicalCheck}
        onUpdatePlannerEventValueWithTimeParsing={onUpdatePlannerEventValueWithTimeParsing}
      />
    </ScrollContainerProvider>
  )
};

export default Today;