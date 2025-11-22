import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { NativeSyntheticEvent } from 'react-native';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/SortableListPage';
import usePlanner from '@/hooks/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { getPlannerEventFromStorageById } from '@/storage/plannerStorage';
import {
  deletePlannerEventsFromStorageAndCalendar,
  openEditEventModal,
  updateDeviceCalendarEventByPlannerEvent
} from '@/utils/plannerUtils';

const PlannerPage = () => {
  const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
  const plannerEventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

  const {
    planner: { eventIds },
    deletingEventIds,
    eventTimeValuesMap,
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield,
    onUpdatePlannerEventValueWithTimeParsing,
    onToggleScheduleEventDeletionCallback,
    onGetEventTextPlatformColorCallback
  } = usePlanner(datestamp);

  function handleOpenTimeModal({ nativeEvent: { id } }: NativeSyntheticEvent<{ id: string }>) {
    openEditEventModal(id, datestamp);
  }

  return (
    <DraggableListPage<IPlannerEvent>
      listId={datestamp}
      itemIds={eventIds}
      selectedItemIds={Array.from(deletingEventIds)}
      storage={plannerEventStorage}
      emptyPageLabel='No plans'
      listProps={{
        onOpenTimeModal: handleOpenTimeModal,
        itemTimeValuesMap: eventTimeValuesMap
      }}
      onToggleSelectItem={onToggleScheduleEventDeletionCallback}
      onGetItem={getPlannerEventFromStorageById}
      onCreateItem={onCreateEventAndFocusTextfield}
      onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
      onValueChange={onUpdatePlannerEventValueWithTimeParsing}
      onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
      onSaveToExternalStorage={updateDeviceCalendarEventByPlannerEvent}
      onGetItemTextPlatformColorCallback={onGetEventTextPlatformColorCallback}
      hasExternalData
    />
  );
};

export default PlannerPage;
