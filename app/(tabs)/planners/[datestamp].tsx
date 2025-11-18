import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { SortableListProps } from 'sortable-list';
import { NativeSyntheticEvent } from 'react-native';
import { DateTime } from 'luxon';

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

const PlannerPage = () => {
  const { datestamp } = useLocalSearchParams<{ datestamp: string }>();
  const plannerEventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

  const {
    planner: { eventIds },
    deletingEventIds,
    onUpdatePlannerEventIndexWithChronologicalCheck,
    onCreateEventAndFocusTextfield,
    onUpdatePlannerEventValueWithTimeParsing,
    onToggleScheduleEventDeletionCallback,
    onGetEventTextPlatformColorCallback
  } = usePlanner(datestamp);

  function handleOpenTimeModal({ nativeEvent: { id } }: NativeSyntheticEvent<{ id: string }>) {
    openEditEventModal(id, datestamp);
  }

  const eventTimeValuesMap = useMemo(() => {
    return eventIds.reduce((acc, id) => {
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
    }, {} as Record<string, Record<string, string>>)
  }, [eventIds]);

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
