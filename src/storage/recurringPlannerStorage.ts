import { EItemStatus } from "@/lib/enums/EItemStatus";
import { ERecurringPlannerKey } from "@/lib/enums/ERecurringPlannerKey";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { cloneListItemWithKeyRemovalAndUpdate } from "@/utils/listUtils";
import { sortPlannerChronologicalWithUpsert, upsertWeekdayEventToRecurringPlanner } from "@/utils/plannerUtils";
import { MMKV } from "react-native-mmkv";

// ✅ 

const storage = new MMKV({ id: EStorageId.RECURRING_EVENT });

function saveToStorage(key: string, newPlanner: IRecurringEvent[]) {
    storage.set(key, JSON.stringify(newPlanner));
}

// ====================
// 1. Upsert Functions
// ====================

export function upsertRecurringWeekdayEvent(weekdayEvent: IRecurringEvent) {
    weekdayEvent.status = EItemStatus.STATIC;

    Object.values(ERecurringPlannerKey).forEach((recPlannerKey) => {
        let updatedPlanner: IRecurringEvent[] | null;

        const planner = getRecurringPlannerFromStorage(recPlannerKey);

        if (recPlannerKey === ERecurringPlannerKey.WEEKDAYS) {
            updatedPlanner = sortPlannerChronologicalWithUpsert(planner, weekdayEvent);
        } else {
            updatedPlanner = upsertWeekdayEventToRecurringPlanner(recPlannerKey, planner, weekdayEvent);
            if (!updatedPlanner) return; // no change is needed, so exit
        }

        saveToStorage(recPlannerKey, updatedPlanner);
    });
}

/**
 * ✅ Saves a recurring event to storage.
 * 
 * If the event is from the weekday planner, and its title or time have changed,
 * the event will be cloned and the weekday event will be hidden within this planner.
 * 
 * @param recEvent - the recurring event to save
 */
export function upsertRecurringEvent(recEvent: IRecurringEvent) {
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
        const clonedEvent = cloneListItemWithKeyRemovalAndUpdate<IRecurringEvent>(newEvent, ['weekdayEventId']);
        newPlanner = sortPlannerChronologicalWithUpsert(newPlanner, clonedEvent);

        // Hide the weekday event
        newEvent.status = EItemStatus.HIDDEN;
    }

    newPlanner = sortPlannerChronologicalWithUpsert(newPlanner, newEvent);
    saveToStorage(newEvent.listId, newPlanner);
}

// =====================
// 2. Read Functions
// =====================

export function getRecurringPlannerFromStorage(key: string): IRecurringEvent[] {
    const eventsString = storage.getString(key);
    if (eventsString) {
        return JSON.parse(eventsString) as IRecurringEvent[];
    }
    return [];
}

// ====================
// 3. Delete Functions
// ====================

export function deleteRecurringWeekdayEvents(eventsToDelete: IRecurringEvent[]) {
    if (eventsToDelete.length === 0) return;

    Object.values(ERecurringPlannerKey).forEach((day) => {
        const planner = getRecurringPlannerFromStorage(day as ERecurringPlannerKey);
        const newPlanner = planner.filter(
            planEvent => !eventsToDelete.some(delEvent => delEvent.id === planEvent.weekdayEventId || delEvent.id === planEvent.id)
        );

        saveToStorage(day, newPlanner);
    });

}

export function deleteRecurringEventsHideWeekday(eventsToDelete: IRecurringEvent[]) {
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

    saveToStorage(listId, newPlanner);
}
