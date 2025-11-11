import { MMKV } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TRecurringPlanner } from '@/lib/types/planners/TRecurringPlanner';
import { createEmptyRecurringPlanner } from '@/utils/recurringPlannerUtils';

const recurringPlannerStorage = new MMKV({ id: EStorageId.RECURRING_PLANNER });
const recurringPlannerEventStorage = new MMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

// ================
//  Save Functions
// ================

export function saveRecurringPlannerToStorage(recurringPlanner: TRecurringPlanner) {
  recurringPlannerStorage.set(recurringPlanner.id, JSON.stringify(recurringPlanner));
}

export function saveRecurringEventToStorage(event: IRecurringEvent) {
  recurringPlannerEventStorage.set(event.id, JSON.stringify(event));
}

// ================
//  Read Functions
// ================

export function getRecurringPlannerFromStorageById(recurringPlannerId: string): TRecurringPlanner {
  const eventsString = recurringPlannerStorage.getString(recurringPlannerId);
  if (eventsString) {
    return JSON.parse(eventsString);
  }
  return createEmptyRecurringPlanner(recurringPlannerId);
}

export function getRecurringEventFromStorageById(id: string): IRecurringEvent {
  const eventsString = recurringPlannerEventStorage.getString(id);
  if (!eventsString) {
    throw new Error(`getRecurringEventFromStorageById: No event found in storage with ID ${id}`);
  }
  return JSON.parse(eventsString);
}

// =================
//  Delete Function
// =================

export function deleteRecurringEventFromStorageById(recurringEventId: string) {
  recurringPlannerEventStorage.delete(recurringEventId);
}
