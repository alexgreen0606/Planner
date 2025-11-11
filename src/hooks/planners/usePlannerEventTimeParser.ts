import { MMKV, useMMKV, useMMKVObject } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { parseTimeValueFromText } from '@/utils/dateUtils';
import {
  createPlannerEventTimeConfig,
  updatePlannerEventIndexWithChronologicalCheck
} from '@/utils/plannerUtils';

import useTextfieldItemAs from '../useTextfieldItemAs';

const usePlannerEventTimeParser = (datestamp: string, eventStorage: MMKV) => {
  const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
  const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

  const { onSetTextfieldItem: onSetFocusedEvent } = useTextfieldItemAs<IPlannerEvent>(eventStorage);
  function handleUpdatePlannerEventValueWithTimeParsing(userInput: string) {
    onSetFocusedEvent((prev) => {
      if (!prev || !planner) return prev;

      const newEvent = { ...prev, value: userInput };
      const newPlanner = { ...planner };

      // Phase 1: If recurring, delete the event so it can be customized.
      if (newEvent.recurringId) {
        newPlanner.eventIds = newPlanner.eventIds.filter((id) => id !== newEvent.id);
        newPlanner.deletedRecurringEventIds.push(newEvent.recurringId);
        delete newEvent.recurringId;
      }

      // Don't scan for time values if the event is already timed.
      if (newEvent.timeConfig) return newEvent;

      // Phase 2: Parse time from user input.
      const { timeValue, updatedText } = parseTimeValueFromText(userInput);
      if (!timeValue) return newEvent;

      // Phase 3: Apply planner-specific time config.
      newEvent.value = updatedText;
      newEvent.timeConfig = createPlannerEventTimeConfig(newEvent.listId, timeValue);

      // Phase 4: Check chronological order and update index if needed.
      const currentIndex = newPlanner.eventIds.findIndex((e) => e === newEvent.id);
      if (currentIndex === -1) {
        throw new Error(
          `handleUpdatePlannerEventValueWithTimeParsing: No event exists in planner ${newEvent.listId} with ID ${newEvent.id}`
        );
      }

      // Save the planner and the event to storage.
      // onFocusPlaceholder();
      // TODO: focus placeholder

      setPlanner(updatePlannerEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent));
      return newEvent;
    });
  }

  return handleUpdatePlannerEventValueWithTimeParsing;
};

export default usePlannerEventTimeParser;
