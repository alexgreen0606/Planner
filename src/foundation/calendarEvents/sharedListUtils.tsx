import { isItemTextfield } from '../sortedLists/utils';
import { deleteEvents, saveEvent } from './storage/plannerStorage';
import { Planner, PlannerEvent } from './types';

export function getEventsFromPlanner(
    planner: Planner,
): PlannerEvent[] {
    return planner.events;
}

export function setEventsInPlanner(
    events: PlannerEvent[],
    planner: Planner,
) {
    return { planner, events };
}

/**
 * Toggles the time modal for a planner event
 * @param planEvent - The planner event to toggle
 * @param isItemTextfield - Function to check if the item is a textfield
 * @param toggleItemEdit - Function to toggle item edit
 * @param setTimeModalOpen - Function to set the time modal open state
 */
export async function toggleTimeModal(
    planEvent: PlannerEvent,
    toggleItemEdit: (event: PlannerEvent) => Promise<void>,
    setTimeModalOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
    if (!isItemTextfield(planEvent)) {
        await toggleItemEdit(planEvent);
    }
    setTimeModalOpen(curr => !curr);
}

/**
 * Handles saving a planner event
 * @param planEvent - The planner event to save
 * @param saveEvent - Function to save the event
 * @param reloadChips - Function to reload chips
 * @param getItems - Optional function to get all items (for weekly planner)
 */
export async function saveEventLoadChips(
    planEvent: PlannerEvent,
    reloadChips: () => Promise<void>,
    items: PlannerEvent[]
) {
    const eventCalendarId = await saveEvent(planEvent);
    if (planEvent.calendarId || (items.find(i => i.id === planEvent.id)?.calendarId)) {
        await reloadChips();
    }
    return eventCalendarId;
}

/**
 * Handles deleting a planner event.
 * @param planEvent - The planner event to delete
 * @param deleteEvent - Function to delete the event
 * @param reloadChips - Function to reload chips
 * @param getItems - Optional function to get all items (for weekly planner)
 */
export async function deleteEventsLoadChips(
    planEvents: PlannerEvent[],
    reloadChips: () => Promise<void>,
    items: PlannerEvent[]
) {
    await deleteEvents(planEvents);
    if (planEvents.some(item => item.calendarId) || (planEvents.some(planEvent => items.find(i => i.id === planEvent.id)?.calendarId))) {
        await reloadChips();
    }
}