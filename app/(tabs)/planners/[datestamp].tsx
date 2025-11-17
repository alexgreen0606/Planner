import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/SortableListPage';
import usePlanner from '@/hooks/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { getPlannerEventFromStorageById } from '@/storage/plannerStorage';
import {
  deletePlannerEventsFromStorageAndCalendar,
  updateDeviceCalendarEventByPlannerEvent
} from '@/utils/plannerUtils';

const PlannerPage = () => {
  const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
  const plannerEventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

  const {
    planner: { eventIds },
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield,
    onUpdatePlannerEventValueWithTimeParsing,
    onGetIsEventDeletingCallback,
    onToggleScheduleEventDeletionCallback,
    onGetEventTextPlatformColorCallback
  } = usePlanner(datestamp);

  return (
    <DraggableListPage<IPlannerEvent>
      listId={datestamp}
      itemIds={eventIds}
      storage={plannerEventStorage}
      emptyPageLabel='No plans'
      onToggleSelectItem={onToggleScheduleEventDeletionCallback}
      onGetIsItemSelectedCallback={onGetIsEventDeletingCallback}
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
