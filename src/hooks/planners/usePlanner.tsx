import { uuid } from 'expo-modules-core';
import { useEffect } from 'react';
import { MMKV, useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planners/TPlanner';
import { getPlannerEventFromStorageById, savePlannerEventToStorage } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp } from '@/utils/dateUtils';
import {
  createEmptyPlanner,
  updatePlannerEventIndexWithChronologicalCheck,
  upsertRecurringEventsIntoPlanner
} from '@/utils/plannerUtils';

import useTextfieldItemAs from '../useTextfieldItemAs';

const usePlanner = (datestamp: string, plannerEventStorage: MMKV) => {
  const { onSetTextfieldId } = useTextfieldItemAs<IPlannerEvent>(plannerEventStorage);

  const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
  const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

  // Build the initial planner with recurring data.
  useEffect(() => {
    setPlanner((prev) => {
      const newPlanner = prev ?? createEmptyPlanner(datestamp);
      return upsertRecurringEventsIntoPlanner(newPlanner);
    });
  }, [datestamp]);

  // Upsert recurring events every time the day of week's recurring planner changes.
  const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
  useMMKVListener((key) => {
    if (key === getDayOfWeekFromDatestamp(datestamp)) {
      setPlanner((prev) => {
        const newPlanner = prev ?? createEmptyPlanner(datestamp);
        return upsertRecurringEventsIntoPlanner(newPlanner);
      });
    }
  }, recurringPlannerStorage);

  function handleUpdatePlannerEventIndexWithChronologicalCheck(
    from: number,
    to: number
  ) {
    setPlanner((prev) => {
      const prevPlanner = prev ?? createEmptyPlanner(datestamp);
      const eventId = prevPlanner.eventIds[from];
      const event = getPlannerEventFromStorageById(eventId);
      return updatePlannerEventIndexWithChronologicalCheck(prevPlanner, to, event);
    });
  }

  function handleCreateEventAndFocusTextfield(index: number) {
    // Create the new planner event.
    const plannerEvent: IPlannerEvent = {
      id: uuid.v4(),
      value: '',
      listId: datestamp,
      storageId: EStorageId.PLANNER_EVENT
    };
    savePlannerEventToStorage(plannerEvent);

    // Add the event to its planner.
    setPlanner((prev) => {
      const prevPlanner = prev ?? createEmptyPlanner(datestamp);
      prevPlanner.eventIds.splice(index, 0, plannerEvent.id);
      return prevPlanner
    });

    // Focus the textifeld on the event.
    onSetTextfieldId(plannerEvent.id);
  }

  return {
    planner: planner ?? createEmptyPlanner(datestamp),
    onUpdatePlannerEventIndexWithChronologicalCheck:
      handleUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield: handleCreateEventAndFocusTextfield
  };
};

export default usePlanner;
