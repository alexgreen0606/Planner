import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { NativeSyntheticEvent } from 'react-native';

import DraggableListPage from '@/components/SortableListPage';
import usePlanner from '@/hooks/usePlanner';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { getPlannerEventFromStorageById } from '@/storage/plannerStorage';
import {
  deletePlannerEventsFromStorageAndCalendar,
  openEditEventModal
} from '@/utils/plannerUtils';

const PlannerPage = () => {
  const { datestamp } = useLocalSearchParams<{ datestamp: string }>();

  const {
    planner: { eventIds },
    deletingEventIds,
    eventTimeValuesMap,
    snapToIdTrigger,
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield,
    onUpdatePlannerEvent,
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
      valueRefreshKey={snapToIdTrigger}
      snapToIdTrigger={snapToIdTrigger}
      selectedItemIds={Array.from(deletingEventIds)}
      emptyPageLabel='No plans'
      listProps={{
        onOpenTimeModal: handleOpenTimeModal,
        itemTimeValuesMap: eventTimeValuesMap
      }}
      onToggleSelectItem={onToggleScheduleEventDeletionCallback}
      onGetItem={getPlannerEventFromStorageById}
      onCreateItem={onCreateEventAndFocusTextfield}
      onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
      onValueChange={onUpdatePlannerEvent}
      onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
      onGetItemTextPlatformColorCallback={onGetEventTextPlatformColorCallback}
      hasExternalData
    />
  );
};

export default PlannerPage;
