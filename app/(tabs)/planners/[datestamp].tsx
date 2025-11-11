import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/DraggableListPage';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import usePlanner from '@/hooks/planners/usePlanner';
import usePlannerEventTimeParser from '@/hooks/planners/usePlannerEventTimeParser';
import useGetPlannerEventToggle from '@/hooks/planners/usePlannerEventToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import {
  createPlannerEventInStorageAndFocusTextfield,
  createPlannerEventTimeIcon,
  deletePlannerEventsFromStorageAndCalendar,
  updateDeviceCalendarEventByPlannerEvent
} from '@/utils/plannerUtils';

const PlannerPage = () => {
  const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
  const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

  const onUpdatePlannerEventValueWithTimeParsing = usePlannerEventTimeParser(
    datestamp,
    eventStorage
  );
  const {
    planner: { eventIds },
    onUpdatePlannerEventIndexWithChronologicalCheck
  } = usePlanner(datestamp);

  return (
    <DraggableListPage
      listId={datestamp}
      itemIds={eventIds}
      storage={eventStorage}
      toolbar={<PlannerEventToolbar />}
      storageId={EStorageId.PLANNER_EVENT}
      emptyPageLabel='No plans'
      onCreateItem={createPlannerEventInStorageAndFocusTextfield}
      onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
      onValueChange={onUpdatePlannerEventValueWithTimeParsing}
      onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
      onSaveToExternalStorage={updateDeviceCalendarEventByPlannerEvent}
      onGetRightIcon={createPlannerEventTimeIcon}
      onGetLeftIcon={useGetPlannerEventToggle}
    />
  );
};

export default PlannerPage;
