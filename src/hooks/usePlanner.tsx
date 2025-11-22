import { uuid } from 'expo-modules-core';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMMKV, useMMKVListener, useMMKVObject } from 'react-native-mmkv';

import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import { NULL } from '@/lib/constants/generic';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planners/TPlanner';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { getPlannerEventFromStorageById, savePlannerEventToStorage } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp, parseTimeValueFromText } from '@/utils/dateUtils';
import {
  createEmptyPlanner,
  createPlannerEventTimeConfig,
  getChronologicalPlannerEventIndex,
  updatePlannerEventIndexWithChronologicalCheck,
  upsertRecurringEventsIntoPlanner
} from '@/utils/plannerUtils';

/**
 * Parses a planner event and returns its time. If no time exists, null will be returned.
 *
 * @param event - The event to parse.
 * @returns The event's time value if one exists, else null.
 */
function getPlannerEventTime(event?: IPlannerEvent): string | null {
  if (!event) return null;
  return event.timeConfig?.endEventId === event.id
    ? event.timeConfig.endIso
    : (event.timeConfig?.startIso ?? null);
}

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

  // Track the time values linked to each event.
  const [timeRefreshKey, setTimeRefreshKey] = useState(NULL);
  const eventTimeValuesMap = useMemo(() => {
    return planner?.eventIds.reduce((acc, id) => {
      const event = getPlannerEventFromStorageById(id);
      const eventTime = getPlannerEventTime(event);

      if (!eventTime) return acc;

      const values: Record<string, string> = {};

      const isEndEvent = event.timeConfig?.endEventId === event.id;
      const isStartEvent = event.timeConfig?.startEventId === event.id;
      const isoTimestamp = eventTime;

      let date: DateTime | null = null;

      if (isoTimestamp) {
        date = DateTime.fromISO(isoTimestamp);
      }

      if (!date || !date.isValid) return acc;

      const rawHour = date.hour;
      const rawMinute = date.minute;
      const isPM = rawHour >= 12;

      const adjustedHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
      const paddedMinute = `:${String(rawMinute).padStart(2, '0')}`;

      values["time"] = String(adjustedHour) + paddedMinute;
      values["indicator"] = isPM ? 'PM' : 'AM';

      if (isEndEvent || isStartEvent) {
        values["detail"] = isEndEvent ? 'END' : 'START';
      }

      acc[id] = values;
      return acc;
    }, {} as Record<string, Record<string, string>>) ?? {}
  }, [planner?.eventIds, timeRefreshKey]);

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

  // TODO: need to know if the item "from" was deleted during drag
  function handleUpdatePlannerEventIndexWithChronologicalCheck(from: number, to: number) {
    if (!planner) return;

    const newPlanner = { ...planner };

    // Sync the local storage with the Swift UI.
    const eventId = newPlanner.eventIds[from];
    newPlanner.eventIds = newPlanner.eventIds.filter((id) => id !== eventId);
    newPlanner.eventIds.splice(to, 0, eventId);
    setPlanner(newPlanner);

    // Validate new position after 1 second to ensure Swift UI animation is settled.
    setTimeout(() => {
      const event = getPlannerEventFromStorageById(eventId)
      const newEventIndex = getChronologicalPlannerEventIndex(event, newPlanner);
      if (newEventIndex !== to) {
        // Remove and insert at corrected index.
        newPlanner.eventIds = newPlanner.eventIds.filter((id) => id !== event.id);
        newPlanner.eventIds.splice(newEventIndex, 0, event.id);
        setPlanner(newPlanner)
      }
    }, 1000)
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

    setTimeout(() => setTimeRefreshKey((prev) => prev + '.'), 300);

    return newEvent;
  }

  return {
    planner: planner ?? createEmptyPlanner(datestamp),
    deletingEventIds,
    eventTimeValuesMap,
    onUpdatePlannerEventIndexWithChronologicalCheck:
      handleUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield: handleCreateEventAndFocusTextfield,
    onUpdatePlannerEventValueWithTimeParsing: handleUpdatePlannerEventValueWithTimeParsing,
    onToggleScheduleEventDeletionCallback: onToggleScheduleItemDeleteCallback,
    onGetEventTextPlatformColorCallback: handleGetEventTextPlatformColorCallback
  };
};

export default usePlanner;
