import { EItemStatus } from "@/lib/enums/EItemStatus";
import { ERecurringPlannerKey } from "@/lib/enums/ERecurringPlannerKey";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EWeekday } from "@/lib/enums/EWeekday";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { cloneItem } from "@/utils/listUtils";
import { sanitizePlanner, syncRecurringPlannerWithWeekdayEvent } from "@/utils/plannerUtils";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: EStorageId.RECURRING_EVENT });

/**
 * ✅ Fetches the recurring planner with the given key from storage.
 * The key will always be a day of the week, or 'Weekdays'.
 * 
 * @param key - the key of the planner in storage
 * @returns - a list of recurring planner events for the given key
 */
export function getRecurringPlannerFromStorage(key: string): IRecurringEvent[] {
    const eventsString = storage.getString(key);
    if (eventsString) {
        return JSON.parse(eventsString) as IRecurringEvent[];
    }
    return [];
}

/**
 * ✅ Saves a recurring planner to storage.
 * 
 * @param key - the key of the planner in storage
 * @param newPlanner - a list of recurring planner events to save
 */
export function saveRecurringPlannerToStorage(key: string, newPlanner: IRecurringEvent[]) {
    storage.set(key, JSON.stringify(newPlanner));
}

// ------------- Weekday Planner -------------

/**
 * Updates or creates a recurring weekday event.
 * All affected recurring planners will also be updated.
 * 
 * @param weekdayEvent - the newly updated event
 */
export function saveRecurringWeekdayEvent(weekdayEvent: IRecurringEvent) {
    weekdayEvent.status = EItemStatus.STATIC;

    // Phase 1: Update all recurring planners with the event.
    Object.values(EWeekday).forEach((day) => {
        const planner = getRecurringPlannerFromStorage(day);

        const updatedPlanner = syncRecurringPlannerWithWeekdayEvent(day, planner, weekdayEvent);
        if (!updatedPlanner) return; // no change is needed, so exit

        saveRecurringPlannerToStorage(day, updatedPlanner);
    });

    // Phase 2: Save the event to the recurring weekday planner.
    const weekdayPlanner = getRecurringPlannerFromStorage(ERecurringPlannerKey.WEEKDAYS);
    const newPlanner = sanitizePlanner(weekdayPlanner, weekdayEvent);
    saveRecurringPlannerToStorage(ERecurringPlannerKey.WEEKDAYS, newPlanner);
}

/**
 * Deletes a list of recurring weekday events.
 * All affected recurring planners will also be updated.
 * 
 * @param eventsToDelete - the list of recurring events to delete
 */
export function deleteRecurringWeekdayEvents(eventsToDelete: IRecurringEvent[]) {
    if (eventsToDelete.length === 0) return;

    // Phase 1: Remove the events from all the recurring planners.
    Object.values(EWeekday).forEach((day) => {
        const planner = getRecurringPlannerFromStorage(day);
        const newPlanner = planner.filter(
            planEvent => !eventsToDelete.some(delEvent => delEvent.id === planEvent.weekdayEventId)
        );

        saveRecurringPlannerToStorage(day, newPlanner);
    });

    // Phase 2: Delete the event from the recurring weekday planner.
    const weekdayPlanner = getRecurringPlannerFromStorage(ERecurringPlannerKey.WEEKDAYS);
    const newPlanner = weekdayPlanner.filter(planEvent => !eventsToDelete.some(delEvent => delEvent.id === planEvent.id));
    saveRecurringPlannerToStorage(ERecurringPlannerKey.WEEKDAYS, newPlanner);
}

// ------------- Day of Week Planners -------------

/**
 * ✅ Saves a recurring event to storage.
 * If the event is from the weekday planner, and its title or time have changed,
 * the event will be cloned and the weekday event will be hidden within this planner.
 * 
 * @param recEvent - the recurring event to save
 */
export function saveRecurringEvent(recEvent: IRecurringEvent) {
    let newPlanner = getRecurringPlannerFromStorage(recEvent.listId);
    const oldEvent = newPlanner.find(existingEvent => existingEvent.id === recEvent.id);
    const newEvent = { ...recEvent, status: EItemStatus.STATIC };

    // Phase 1: Clone modified weekday events to allow customization.
    // The original event will be hidden and replaced with the clone.
    if (oldEvent && newEvent.weekdayEventId && (
        // The event title has changed
        newEvent.value !== oldEvent.value ||
        // The event time has changed
        newEvent.startTime !== oldEvent.startTime
    )) {
        // Clone the event and add it to the planner
        const clonedEvent = cloneItem<IRecurringEvent>(newEvent, ['weekdayEventId']);
        newPlanner = sanitizePlanner(newPlanner, clonedEvent);

        // Hide the weekday event
        newEvent.status = EItemStatus.HIDDEN;
    }

    newPlanner = sanitizePlanner(newPlanner, newEvent);
    saveRecurringPlannerToStorage(newEvent.listId, newPlanner);
}

/**
 * ✅ Deletes a list of events from a recurring planner.
 * If an event is a weekday event, it will be hidden.
 * Otherwise the events will be permanently deleted.
 * 
 * @param eventsToDelete - the list of recurring events to delete
 */
export function deleteRecurringEvents(eventsToDelete: IRecurringEvent[]) {
    if (eventsToDelete.length === 0) return;

    const listId = eventsToDelete[0].listId;
    const existingPlanner = getRecurringPlannerFromStorage(listId);

    // Phase 1: Build the updated planner out of the old one.
    // Weekday events will be hidden, and all others will be deleted.
    const newPlanner = existingPlanner.reduce((acc, recEvent) => {
        const delEvent = eventsToDelete.find(e => e.id === recEvent.id);
        const isDeleting = Boolean(delEvent);

        // Keep the event since it isn't deleting.
        if (!isDeleting) {
            acc.push(recEvent);
        }

        // Hide the weekday event.
        else if (delEvent!.weekdayEventId) {
            acc.push({
                ...delEvent!,
                status: EItemStatus.HIDDEN
            });
        }

        // Otherwise the event is deleting and not a weekday event. Don't add it to the planner.

        return acc;
    }, [] as IRecurringEvent[]);

    saveRecurringPlannerToStorage(listId, newPlanner);
}
