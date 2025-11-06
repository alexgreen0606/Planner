import { MMKV } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TRecurringPlanner } from '@/lib/types/planner/TRecurringPlanner';
import { createEmptyRecurringPlanner } from '@/utils/recurringPlannerUtils';

// ✅

const recurringPlannerStorage = new MMKV({ id: EStorageId.RECURRING_PLANNER });
const recurringEventStorage = new MMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

// ==================
// 1. Save Functions
// ==================

export function saveRecurringPlannerToStorage(recurringPlanner: TRecurringPlanner) {
  recurringPlannerStorage.set(recurringPlanner.id, JSON.stringify(recurringPlanner));
}

export function saveRecurringEventToStorage(event: IRecurringEvent) {
  recurringEventStorage.set(event.id, JSON.stringify(event));
}

// ==================
// 2. Read Functions
// ==================

export function getRecurringPlannerFromStorageById(recurringPlannerId: string): TRecurringPlanner {
  const eventsString = recurringPlannerStorage.getString(recurringPlannerId);
  if (eventsString) {
    return JSON.parse(eventsString);
  }

  return createEmptyRecurringPlanner(recurringPlannerId);
}

export function getRecurringEventFromStorageById(id: string): IRecurringEvent {
  const eventsString = recurringEventStorage.getString(id);
  if (!eventsString) {
    throw new Error(`getRecurringEventFromStorageById: No event found in storage with ID ${id}`);
  }

  return JSON.parse(eventsString);
}

// ===================
// 3. Delete Function
// ===================

export function deleteRecurringEventFromStorageById(recurringEventId: string) {
  recurringEventStorage.delete(recurringEventId);
}
