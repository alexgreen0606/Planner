import { textfieldIdAtom } from "@/atoms/textfieldId";
import TimeValue from "@/components/text/TimeValue";
import { ERecurringPlannerId } from "@/lib/enums/ERecurringPlannerKey";
import { EStorageId } from "@/lib/enums/EStorageId";
import { TListItemIconConfig } from "@/lib/types/listItems/core/TListItemIconConfig";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";
import { deleteRecurringEventFromStorage, getRecurringEventFromStorageById, getRecurringPlannerFromStorageById, saveRecurringEventToStorage, saveRecurringPlannerToStorage } from "@/storage/recurringPlannerStorage";
import { jotaiStore } from "app/_layout";
import { uuid } from "expo-modules-core";
import { isTimeEarlierOrEqual } from "./dateUtils";
import { mapWeekdayEventToRecurringEvent } from "./map/mapWeekdayEventToRecurringEvent";

// ✅ 

// ====================
// 1. Helper Functions
// ====================

/**
 * Calculates a valid index for a recurring planner event that maintains chronological ordering within its planner.
 * 
 * @param recurringEvent - The recurring event to place.
 * @param recurringPlanner - The recurring planner with the current ordering of events.
 * @returns A new index for the event that maintains chronological ordering within the recurring planner.
 */
function calculateChronologicalRecurringEventIndex(
    recurringEvent: IRecurringEvent,
    recurringPlanner: TRecurringPlanner
): number {
    const eventTime = recurringEvent.startTime;
    const prevIndex = recurringPlanner.eventIds.findIndex(id => id === recurringEvent.id);

    if (prevIndex === -1) {
        throw new Error(`calculateChronologicalRecurringEventIndex: No event exists in recurring planner ${recurringEvent.listId} with ID ${recurringEvent.id}`);
    }

    // Pre-Check 1: The event is unscheduled. Keep it at its current index.
    if (!eventTime) return prevIndex;

    const plannerEvents = recurringPlanner.eventIds.map(id => {
        if (id === recurringEvent.id) {
            return recurringEvent;
        }
        return getRecurringEventFromStorageById(id);
    });

    const plannerEventsWithoutEvent = plannerEvents.filter(e => e.id !== recurringEvent.id);
    const timedPlanner = plannerEvents.filter(existingEvent => existingEvent.startTime);

    const timedPlannerIndex = timedPlanner.findIndex(e => e.id === recurringEvent.id);
    const earlierTime = timedPlanner[timedPlannerIndex - 1]?.startTime;
    const laterTime = timedPlanner[timedPlannerIndex + 1]?.startTime;

    // Pre-Check 2: Check if the event conflicts at its current position.
    if (
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, eventTime)) &&
        (!laterTime || isTimeEarlierOrEqual(eventTime, laterTime))
    ) return prevIndex;

    // Traverse the list in reverse to find the last event that starts before or at the same time.
    const earlierEventIndex = plannerEventsWithoutEvent.findLastIndex(e => {
        const existingTime = e.startTime;
        if (!existingTime) return false;
        return isTimeEarlierOrEqual(existingTime, eventTime);
    });

    if (earlierEventIndex !== -1) {
        // Found an event that starts before or at the same time - place our event right after it.
        return earlierEventIndex + 1;
    }

    // No event found that starts before or at the same time - this must be the earliest event.
    // Place it at the front of the recurring planner.
    return 0;
}

/**
 * Deletes a list of recurring weekday events from every recurring weekday planner.
 * 
 * @param eventsToDelete - The list of recurring weekday events to delete.
 */
function deleteRecurringWeekdayEvents(eventsToDelete: IRecurringEvent[]) {
    if (eventsToDelete.length === 0) return;

    const deleteIds = new Set(eventsToDelete.map(e => e.id));

    Object.values(ERecurringPlannerId)
        .filter(day => ![
            ERecurringPlannerId.WEEKDAYS,
            ERecurringPlannerId.SATURDAY,
            ERecurringPlannerId.SUNDAY
        ].includes(day))
        .forEach((day) => {
            const recurringPlanner = getRecurringPlannerFromStorageById(day);

            // Filter out all the weekday events that are deleting.
            const eventIds = recurringPlanner.eventIds.reduce<string[]>((acc, id) => {
                const event = getRecurringEventFromStorageById(id);
                if (!event.weekdayEventId || !deleteIds.has(event.weekdayEventId)) {
                    acc.push(event.id);
                }
                return acc;
            }, []);

            saveRecurringPlannerToStorage({ ...recurringPlanner, eventIds });
        });

    for (const event of eventsToDelete) {
        deleteRecurringEventFromStorage(event.id);
    }
}

// =============================================
// 2. Upsert Weekday Events To Weekday Planners
// =============================================

/**
 * Updates or inserts a recurring event into all recurring weekday planners.
 * 
 * @param weekdayEvent - The event to propagate into the recurring planners.
 */
export function upsertEventToWeekdayPlanners(weekdayEvent: IRecurringEvent) {

    Object.values(ERecurringPlannerId)
        .filter(day => ![
            ERecurringPlannerId.WEEKDAYS,
            ERecurringPlannerId.SATURDAY,
            ERecurringPlannerId.SUNDAY
        ].includes(day))
        .forEach((recurringPlannerId) => {
            const recurringPlanner = getRecurringPlannerFromStorageById(recurringPlannerId);
            if (recurringPlanner.deletedWeekdayEventIds.includes(weekdayEvent.id)) return;

            const eventExists = recurringPlanner.eventIds.find((id, index) => {
                const existingEvent = getRecurringEventFromStorageById(id);
                if (existingEvent.weekdayEventId !== weekdayEvent.id) return false;

                const updatedEvent = mapWeekdayEventToRecurringEvent(recurringPlannerId, weekdayEvent, existingEvent.id);

                // Save the updated event and planner.
                saveRecurringEventToStorage(updatedEvent);
                saveRecurringPlannerToStorage(
                    updateRecurringEventIndexWithChronologicalCheck(recurringPlanner, index, updatedEvent)
                );

                return true;
            });

            if (eventExists) return;


            // Save the new event.
            const newRecurringEvent = mapWeekdayEventToRecurringEvent(recurringPlannerId, weekdayEvent);
            saveRecurringEventToStorage(newRecurringEvent);

            // Insert the event in the back of the planner and adjust to preserve chronological ordering.
            saveRecurringPlannerToStorage(
                updateRecurringEventIndexWithChronologicalCheck(
                    recurringPlanner,
                    recurringPlanner.eventIds.length,
                    newRecurringEvent
                )
            );
        });
}

// ====================
// 3. Create Functions
// ====================

/**
 * Creates a new recurring event for a given recurring planner. The new event will focus the textfield.
 * 
 * @param recurringPlannerId - The ID of the recurring planner.
 * @param index - The index of the new item within its recurring planner.
 */
export function createRecurringEventInStorageAndFocusTextfield(recurringPlannerId: string, index: number) {

    // Create recurring event and save to storage.
    const recurringEvent: IRecurringEvent = {
        id: uuid.v4(),
        value: "",
        listId: recurringPlannerId,
        storageId: EStorageId.RECURRING_PLANNER_EVENT
    };
    saveRecurringEventToStorage(recurringEvent);

    // Add to recurring planner.
    const recurringPlanner = getRecurringPlannerFromStorageById(recurringPlannerId);
    recurringPlanner.eventIds.splice(index, 0, recurringEvent.id);
    saveRecurringPlannerToStorage(recurringPlanner);

    // Focus the textfield.
    jotaiStore.set(textfieldIdAtom, recurringEvent.id);
}

/**
 * Creates an empty recurring planner for the given ID.
 * 
 * @param recurringPlannerId - The ID of the recurring planner.
 * @returns A new recurring planner object with no events.
 */
export function createEmptyRecurringPlanner(recurringPlannerId: string): TRecurringPlanner {
    return {
        id: recurringPlannerId,
        eventIds: [],
        deletedWeekdayEventIds: []
    }
}

/**
 * Generates the icon config representing a recurring event's time. Clicking the icon will open the 
 * textfield for the event.
 * 
 * @param event - The recurring event to represent.
 * @returns The icon configuration for the recurring event's time.
 */
export function createRecurringEventTimeIconConfig(
    event: IRecurringEvent
): TListItemIconConfig<IRecurringEvent> {
    return {
        hideIcon: !event.startTime,
        onClick: () => jotaiStore.set(textfieldIdAtom, event.id),
        customIcon: (
            <TimeValue timeValue={event.startTime} concise />
        )
    }
}

// ====================
// 4. Update Functions
// ====================

/**
 * Updates a recurring planner event's position within its recurring planner. 
 * 
 * @param planner - The recurring planner with the current ordering of events.
 * @param index - The desired index of the event.
 * @param event - The recurring event to place.
 * @returns The updated recurring planner with the new positions of events.
 */
export function updateRecurringEventIndexWithChronologicalCheck(
    planner: TRecurringPlanner,
    index: number,
    event: IRecurringEvent
): TRecurringPlanner {

    // Add the event to its desired position.
    planner.eventIds = planner.eventIds.filter(id => id !== event.id);
    planner.eventIds.splice(index, 0, event.id);

    // Verify chronological order.
    const newEventIndex = calculateChronologicalRecurringEventIndex(event, planner);
    if (newEventIndex !== index) {
        // Remove again and insert at corrected index.
        planner.eventIds = planner.eventIds.filter(id => id !== event.id);
        planner.eventIds.splice(newEventIndex, 0, event.id);
    }

    return planner;
}

// ===================
// 5. Delete Function
// ===================

/**
 * Deletes a list of recurring events from storage.
 * 
 * @param eventsToDelete - The list of recurring events to delete.
 */
export async function deleteRecurringEventsFromStorageHideWeekday(eventsToDelete: IRecurringEvent[]) {
    if (eventsToDelete.length === 0) return;

    const plannersToUpdate: Record<string, TRecurringPlanner> = {};
    const eventIdsToDelete: Set<string> = new Set();
    const weekdayEventsToDelete: IRecurringEvent[] = [];

    // Phase 1: Process all events.
    for (const event of eventsToDelete) {

        // Load in the planners to update.
        if (!plannersToUpdate[event.listId]) {
            const planner = getRecurringPlannerFromStorageById(event.listId);
            plannersToUpdate[event.listId] = planner;
        }

        // Mark this weekday event as deleted within its planner.
        if (event.weekdayEventId) {
            plannersToUpdate[event.listId].deletedWeekdayEventIds.push(event.weekdayEventId);
        }

        // Determine how to delete this event.
        if (event.listId === ERecurringPlannerId.WEEKDAYS) {
            weekdayEventsToDelete.push(event);
        } else {
            eventIdsToDelete.add(event.id);
        }
    }

    // Phase 2: Update all planners in storage.
    for (const recurringPlanner of Object.values(plannersToUpdate)) {
        saveRecurringPlannerToStorage({
            ...recurringPlanner,
            eventIds: recurringPlanner.eventIds.filter(id => !eventIdsToDelete.has(id))
        });
    }

    // Phase 3: Update all weekday planners in storage.
    deleteRecurringWeekdayEvents(weekdayEventsToDelete);

    // Phase 4: Delete events from storage.
    for (const eventId of eventIdsToDelete) {
        deleteRecurringEventFromStorage(eventId);
    }
}
