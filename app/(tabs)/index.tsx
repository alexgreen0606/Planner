import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import TodayBanner from '@/components/banners/TodayBanner';
import EventChipSets from '@/components/eventChip/EventChipSet';
import TodayPlanner from '@/components/lists/TodayPlanner';
import useAppTheme from '@/hooks/useAppTheme';
import usePlanner from '@/hooks/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { ScrollContainerProvider } from '@/providers/ScrollContainer';
import { useAtomValue } from 'jotai';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

const Today = () => {
  const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

  const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

  const { background } = useAppTheme();

  const {
    isEditingTitle,
    planner,
    OverflowIcon,
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onEditTitle,
    onToggleEditTitle
  } = usePlanner(todayDatestamp, eventStorage);

  return (
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
          backgroundPlatformColor={background}
        />
      }
    >
      <TodayPlanner
        eventStorage={eventStorage}
        eventIds={planner.eventIds}
        onUpdatePlannerEventIndexWithChronologicalCheck={onUpdatePlannerEventIndexWithChronologicalCheck}
      />
    </ScrollContainerProvider>
  )
};

export default Today;