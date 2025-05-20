import { saveEvent, deleteEvents } from '@/storage/plannerStorage';
import { isItemTextfield } from '../../feature/sortedList/utils';
import { generateSortIdByTime } from './timestampUtils';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TPlanner } from '@/types/planner/TPlanner';

export function getEventsFromPlanner(
    planner: TPlanner,
): IPlannerEvent[] {
    return planner.events;
}

export function setEventsInPlanner(
    events: IPlannerEvent[],
    planner: TPlanner,
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
    planEvent: IPlannerEvent,
    toggleItemEdit: (event: IPlannerEvent) => Promise<void>,
    openTimeModal: (item: IPlannerEvent, saveItem: (item: IPlannerEvent) => Promise<void>) => void,
    currentList: IPlannerEvent[],
    saveTextfieldAndCreateNew: (item: IPlannerEvent, referenceId?: number, isChildId?: boolean) => void
) {
    if (!isItemTextfield(planEvent)) {
        await toggleItemEdit(planEvent);
    }
    openTimeModal(planEvent, (newEvent) => handleTimeModalSave(newEvent, currentList, saveTextfieldAndCreateNew));
}

/**
 * Updates the current textfield with the new data entered in the time modal.
 * The item may be shifted in the list to maintain sorted time logic.
 * @param updatedEvent - New item to save
 * @param currentList - The current list of items
 * @param setCurrentTextfield - Function to save the current textfield
 */
async function handleTimeModalSave(
    updatedEvent: IPlannerEvent,
    currentList: IPlannerEvent[],
    saveTextfieldAndCreateNew: (item: IPlannerEvent, referenceId?: number, isChildId?: boolean) => void
) {
    const updatedList = [...currentList];
    const itemCurrentIndex = updatedList.findIndex(existingItem => existingItem.id === updatedEvent.id);
    if (itemCurrentIndex !== -1) {
        updatedList[itemCurrentIndex] = updatedEvent;
    } else {
        updatedList.push(updatedEvent);
    }
    updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedList);
    saveTextfieldAndCreateNew(updatedEvent, updatedEvent.sortId);
}

/**
 * Handles saving a planner event
 * @param planEvent - The planner event to save
 * @param reloadChips - Function to reload chips
 * @param items - The current list items
 */
export async function saveEventLoadChips(
    planEvent: IPlannerEvent,
    reloadChips: () => Promise<void>,
    items: IPlannerEvent[]
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
    planEvents: IPlannerEvent[],
    reloadChips: () => Promise<void>,
    items: IPlannerEvent[]
) {
    await deleteEvents(planEvents);
    if (planEvents.some(item => item.calendarId) || (planEvents.some(planEvent => items.find(i => i.id === planEvent.id)?.calendarId))) {
        await reloadChips();
    }
}