import { useEffect } from 'react';
import { useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { TPlanner } from '@/lib/types/planners/TPlanner';
import { getPlannerEventFromStorageById } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp } from '@/utils/dateUtils';
import {
  createEmptyPlanner,
  updatePlannerEventIndexWithChronologicalCheck,
  upsertRecurringEventsIntoPlanner
} from '@/utils/plannerUtils';

const usePlanner = (datestamp: string) => {
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

  return {
    planner: planner ?? createEmptyPlanner(datestamp),
    onUpdatePlannerEventIndexWithChronologicalCheck:
      handleUpdatePlannerEventIndexWithChronologicalCheck
  };
};

export default usePlanner;
