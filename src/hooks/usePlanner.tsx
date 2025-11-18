import { uuid } from 'expo-modules-core';
import { useCallback, useEffect, useMemo } from 'react';
import { useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';

import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planners/TPlanner';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { getPlannerEventFromStorageById, savePlannerEventToStorage } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp, parseTimeValueFromText } from '@/utils/dateUtils';
import {
  createEmptyPlanner,
  createPlannerEventTimeConfig,
  updatePlannerEventIndexWithChronologicalCheck,
  upsertRecurringEventsIntoPlanner
} from '@/utils/plannerUtils';
import { useAtomValue } from 'jotai';

const usePlanner = (datestamp: string) => {
  const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
  const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);
  const todayDatestamp = useAtomValue(todayDatestampAtom);

  // Track the item IDs that are pending deletion.
  const { onToggleScheduleItemDeleteCallback, onGetDeletingItemsByStorageIdCallback } = useDeleteSchedulerContext<IPlannerEvent>();
  const deletingEventIds = useMemo(() => {
    if (!planner) return new Set<string>();

    const allDeletingEvents = onGetDeletingItemsByStorageIdCallback(EStorageId.PLANNER_EVENT);

    return planner.eventIds.reduce((acc, eventId) => {
      const event = getPlannerEventFromStorageById(eventId);
      const isDeleting = allDeletingEvents.some(
        (deletingEvent) =>
          // The events have matching IDs
          (deletingEvent.id === event.id || // OR the events have matching calendar event IDs
            (deletingEvent.calendarEventId && deletingEvent.calendarEventId === event.calendarEventId)) && // AND
          // The item is from today
          (event.listId === todayDatestamp ||
            // OR the deleting item is NOT from today
            deletingEvent.listId !== todayDatestamp)
      );
      if (isDeleting) acc.add(eventId);

      return acc;
    }, new Set<string>());
  }, [planner?.eventIds, onGetDeletingItemsByStorageIdCallback, todayDatestamp]);

  const handleGetEventTextPlatformColorCallback = useCallback((event: IPlannerEvent) => {
    return deletingEventIds.has(event.id) ? 'tertiaryLabel' : 'label';
  }, [deletingEventIds]);

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

  function handleUpdatePlannerEventIndexWithChronologicalCheck(from: number, to: number) {
    // TODO: need to know if the item "from" was deleted during drag
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
  }

  function handleUpdatePlannerEventValueWithTimeParsing(userInput: string, event: IPlannerEvent) {
    if (!planner) return event;

    const newEvent = { ...event, value: userInput };
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

    setPlanner(updatePlannerEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent));

    return newEvent;
  }

  return {
    planner: planner ?? createEmptyPlanner(datestamp),
    deletingEventIds,
    onUpdatePlannerEventIndexWithChronologicalCheck:
      handleUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield: handleCreateEventAndFocusTextfield,
    onUpdatePlannerEventValueWithTimeParsing: handleUpdatePlannerEventValueWithTimeParsing,
    onToggleScheduleEventDeletionCallback: onToggleScheduleItemDeleteCallback,
    onGetEventTextPlatformColorCallback: handleGetEventTextPlatformColorCallback
  };
};

export default usePlanner;
