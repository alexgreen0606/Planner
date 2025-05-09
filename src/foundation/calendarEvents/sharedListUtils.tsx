import { isItemTextfield } from '../sortedLists/utils';
import { deleteEvents, saveEvent } from './storage/plannerStorage';
import { generateSortIdByTime } from '../../utils/timestampUtils';
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
 * @param toggleItemEdit - Function to toggle item edit
 * @param setTimeModalOpen - Function to set the time modal open state
 */
export async function openTimeModal(
    planEvent: PlannerEvent,
    toggleItemEdit: (event: PlannerEvent) => Promise<void>,
    openTimeModal: (item: PlannerEvent, saveItem: (item: PlannerEvent) => Promise<void>) => void,
    currentList: PlannerEvent[],
    setCurrentTextfield: React.Dispatch<PlannerEvent>
) {
    if (!isItemTextfield(planEvent)) {
        await toggleItemEdit(planEvent);
    }
    openTimeModal(planEvent, (newEvent) => handleTimeModalSave(newEvent, currentList, setCurrentTextfield));
}

/**
 * Updates the current textfield with the new data entered in the time modal.
 * The item may be shifted in the list to maintain sorted time logic.
 * @param updatedEvent - New item to save
 * @param currentList - The current list of items
 * @param setCurrentTextfield - Function to save the current textfield
 */
async function handleTimeModalSave(
    updatedEvent: PlannerEvent,
    currentList: PlannerEvent[],
    setCurrentTextfield: React.Dispatch<PlannerEvent>
) {
    const updatedList = [...currentList];
    const itemCurrentIndex = updatedList.findIndex(existingItem => existingItem.id === updatedEvent.id);
    if (itemCurrentIndex !== -1) {
        updatedList[itemCurrentIndex] = updatedEvent;
    } else {
        updatedList.push(updatedEvent);
    }
    updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedList);
    setCurrentTextfield(updatedEvent);
}

/**
 * Handles saving a planner event
 * @param planEvent - The planner event to save
 * @param reloadChips - Function to reload chips
 * @param items - The current list items
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