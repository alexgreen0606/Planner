import { externalPlannerDataAtom } from '@/atoms/externalPlannerData';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import TodayBanner from '@/components/banners/TodayBanner';
import EventChipSets from '@/components/eventChip/EventChipSet';
import TodayPlanner from '@/components/lists/TodayPlanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import useAppTheme from '@/hooks/useAppTheme';
import useCalendarData from '@/hooks/useCalendarData';
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
  const calendarEventData = useAtomValue(externalPlannerDataAtom);

  const { calendarChips } = useCalendarData(todayDatestamp);

  const { background } = useAppTheme();

  const {
    isEditingTitle,
    planner,
    OverflowIcon,
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
          OverflowIcon={OverflowIcon}
          datestamp={todayDatestamp}
          isEditingTitle={isEditingTitle}
          onEditTitle={onEditTitle}
          onToggleEditTitle={onToggleEditTitle}
        />
      }
      floatingBanner={
        <EventChipSets
          datestamp={todayDatestamp}
          sets={calendarChips}
          backgroundPlatformColor={background}
        />
      }
    >
      <TodayPlanner
        eventStorage={eventStorage}
        eventIds={planner.eventIds}
        onUpdatePlannerEventIndexWithChronologicalCheck={onUpdatePlannerEventIndexWithChronologicalCheck}
        onUpdatePlannerEventValueWithTimeParsing={onUpdatePlannerEventValueWithTimeParsing}
      />
    </ScrollContainerProvider>
  )
};

export default Today;