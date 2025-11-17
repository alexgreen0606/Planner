import { MMKV, useMMKV, useMMKVObject } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TRecurringPlanner } from '@/lib/types/planners/TRecurringPlanner';
import { getRecurringPlannerFromStorageById } from '@/storage/recurringPlannerStorage';
import { parseTimeValueFromText } from '@/utils/dateUtils';
import { updateRecurringEventIndexWithChronologicalCheck } from '@/utils/recurringPlannerUtils';

const useRecurringEventTimeParser = (recurringPlannerId: string, recurringEventStorage: MMKV) => {
  const recurringStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
  const [recurringPlanner, setRecurringPlanner] = useMMKVObject<TRecurringPlanner>(
    recurringPlannerId,
    recurringStorage
  );

  // Scan user input for an initial event time.
  // Delete weekday event and clone if needed.
  function handleUpdateRecurringEventValueWithTimeParsing(userInput: string) {
    // TODO: how to do this now? Use directly in List component.
    // onSetTextfieldItem((prev) => {
    //   if (!prev || !recurringPlanner) return prev;

    //   const newEvent = { ...prev, value: userInput };
    //   const newPlanner = { ...recurringPlanner };

    //   // Phase 1: If weekday recurring, delete the event so it can be customized.
    //   if (newEvent.weekdayEventId) {
    //     newPlanner.deletedWeekdayEventIds.push(newEvent.weekdayEventId);
    //     delete newEvent.weekdayEventId;
    //   }

    //   // Don't scan for time values if the event is already timed.
    //   if (newEvent.startTime) return newEvent;

    //   // Phase 2: Parse time from user input.
    //   const { timeValue, updatedText } = parseTimeValueFromText(userInput);
    //   if (!timeValue) return newEvent;

    //   newEvent.value = updatedText;
    //   newEvent.startTime = timeValue;

    //   // Phase 4: Check chronological order and update index if needed.
    //   const planner = getRecurringPlannerFromStorageById(newEvent.listId);
    //   const currentIndex = planner.eventIds.findIndex((e) => e === newEvent.id);
    //   if (currentIndex === -1) {
    //     throw new Error(
    //       `handleUpdateRecurringEventValueWithTimeParsing: No event exists in recurring planner ${newEvent.listId} with ID ${newEvent.id}`
    //     );
    //   }

    //   // Save the planner and event to storage.

    //   // TODO: focus the placeholder here

    //   setRecurringPlanner(
    //     updateRecurringEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent)
    //   );
    //   return newEvent;
    // });
  }

  return handleUpdateRecurringEventValueWithTimeParsing;
};

export default useRecurringEventTimeParser;
