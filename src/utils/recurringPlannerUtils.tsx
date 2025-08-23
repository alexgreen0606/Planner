import { textfieldIdAtom } from "@/atoms/textfieldId";
import TimeValue from "@/components/text/TimeValue";
import { ERecurringPlannerKey } from "@/lib/enums/ERecurringPlannerKey";
import { EStorageId } from "@/lib/enums/EStorageId";
import { TListItemIconConfig } from "@/lib/types/listItems/core/TListItemIconConfig";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";
import { deleteRecurringEventFromStorage, getRecurringEventFromStorageById, getRecurringPlannerFromStorageById, saveRecurringEventToStorage, saveRecurringPlannerToStorage } from "@/storage/recurringPlannerStorage";
import { jotaiStore } from "app/_layout";
import { uuid } from "expo-modules-core";
import { isTimeEarlierOrEqual } from "./dateUtils";
import { extractTimeValueFromString } from "./plannerUtils";

// ====================
// 1. Helper Functions
// ====================

/**
 * Generates a new index for a recurring event position that maintains time logic within its planner.
 * 
 * @param recurringEvent - The recurring event to place.
 * @param recurringPlanner - The recurring planner with the current ordering of events.
 * @returns A new index for the event that maintains chronological ordering within the recurring planner.
 */
function generateChronologicalRecurringEventIndex(
    recurringEvent: IRecurringEvent,
    recurringPlanner: TRecurringPlanner
): number {
    const eventTime = recurringEvent.startTime;
    const initialIndex = recurringPlanner.eventIds.findIndex(id => id === recurringEvent.id);

    if (initialIndex === -1) {
        throw new Error(`generateChronologicalRecurringEventIndex: No event exists in planner ${recurringEvent.listId} with ID ${recurringEvent.id}`);
    }

    // TODO: wont this never happen? Hidden events arent on the UI evenr
    // Pre-Check 1: The event is unscheduled or hidden. Keep it at its current index.
    if (!eventTime || recurringPlanner.deletedWeekdayEventIds.includes(recurringEvent.id)) return initialIndex;

    const plannerEvents = recurringPlanner.eventIds.map(id => {
        if (id === recurringEvent.id) {
            return recurringEvent;
        }
        return getRecurringEventFromStorageById(id);
    });

    const plannerEventsWithoutEvent = [...plannerEvents].filter(e => e.id !== recurringEvent.id);
    const timedPlanner = [...plannerEvents].filter(existingEvent => existingEvent.startTime);

    const timedPlannerIndex = timedPlanner.findIndex(e => e.id === recurringEvent.id);

    const earlierEvent = timedPlanner[timedPlannerIndex - 1];
    const laterEvent = timedPlanner[timedPlannerIndex + 1];
    const earlierTime = earlierEvent.startTime;
    const laterTime = laterEvent.startTime;

    // Pre-Check 2: Check if the event conflicts at its current position.
    if (
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, eventTime)) &&
        (!laterTime || isTimeEarlierOrEqual(eventTime, laterTime))
    ) return initialIndex;

    // Traverse the list in reverse to find the last event that starts before or at the same time.
    const earlierEventIndex = plannerEventsWithoutEvent.findLastIndex(e => {
        const existingTime = e.startTime;
        if (!existingTime) return false;

        // Check if existing event starts before or at the same time as our event
        return isTimeEarlierOrEqual(existingTime, eventTime);
    });

    if (earlierEventIndex !== -1) {
        // Found an event that starts before or at the same time - place our event right after it.
        return earlierEventIndex + 1;
    }

    // No event found that starts before or at the same time - this must be the earliest event.
    // Place it at the front of the planner.
    return 0;
}

/**
 * Deletes a list of recurring weekday events from every recurring weekday planner.
 * 
 * @param eventsToDelete - The list of recurring weekday events to delete.
 */
function deleteRecurringWeekdayEvents(eventsToDelete: IRecurringEvent[]) {
    if (eventsToDelete.length === 0) return;

    // todo: simplify with reduce
    Object.values(ERecurringPlannerKey).forEach((day) => {
        if ([
            ERecurringPlannerKey.SATURDAY,
            ERecurringPlannerKey.SUNDAY
        ].includes(day)
        ) return;

        const recurringPlanner = getRecurringPlannerFromStorageById(day);
        const plannerEvents = recurringPlanner.eventIds.map(getRecurringEventFromStorageById);
        const newPlannerEvents = plannerEvents.filter(
            planEvent => !eventsToDelete.some(delEvent => delEvent.id === planEvent.weekdayEventId || delEvent.id === planEvent.id)
        );
        const newPlannerIds = newPlannerEvents.map(e => e.id);

        saveRecurringPlannerToStorage({ ...recurringPlanner, eventIds: newPlannerIds });
    });

    for (const event of eventsToDelete) {
        deleteRecurringEventFromStorage(event.id);
    }
}

// ====================
// 3. Update Functions
// ====================

/**
 * Updates a recurring event's position within its planner. The new position will be validated to ensure it does
 * not break chronological ordering within the list. If invalid, the event will be shifted to a valid position.
 * 
 * @param index - The desired index for the event.
 * @param event - The event to update.
 */
export function updateRecurringEventIndexWithChronologicalCheck(index: number, event: IRecurringEvent) {
    let recurringPlanner = getRecurringPlannerFromStorageById(event.listId);

    // Move the event ID to its desired position.
    recurringPlanner.eventIds = recurringPlanner.eventIds.filter(id => id !== event.id);
    recurringPlanner.eventIds.splice(index, 0, event.id);

    // Check if the desired position preserves chronological ordering.
    const newEventIndex = generateChronologicalRecurringEventIndex(event, recurringPlanner);
    if (newEventIndex === index) {
        saveRecurringPlannerToStorage(recurringPlanner);
        return;
    }

    // Move the event to a valid position.
    recurringPlanner.eventIds = recurringPlanner.eventIds.filter(id => id !== event.id);
    recurringPlanner.eventIds.splice(newEventIndex, 0, event.id);
    saveRecurringPlannerToStorage(recurringPlanner);
}

/**
 * Updates a recurring planner event's value, detecting any time value within the user input and converting it into a time 
 * configuration for the event. The recurring planner will be updated if the event position must change to preserve
 * chronological ordering. If the modofied event is linked to the recurring weekday planner, the record will be hidden and cloned.
 * 
 * @param userInput - The user input to scan.
 * @param event - The recurring event to update.
 * @returns The updated recurring event.
 */
export function updateRecurringEventValueWithCloningAndSmartTimeDetect(
    userInput: string,
    event: IRecurringEvent
): IRecurringEvent {
    let newEvent = { ...event, value: userInput };

    // Phase 1: Clone modified weekday events to allow customization.
    // The original event will be hidden and replaced with the clone.
    if (newEvent.weekdayEventId) {

        // Hide this recurring event record.
        const recurringPlanner = getRecurringPlannerFromStorageById(event.listId);
        saveRecurringPlannerToStorage({
            ...recurringPlanner,
            deletedWeekdayEventIds: [...recurringPlanner.deletedWeekdayEventIds, newEvent.weekdayEventId]
        });

        delete newEvent.weekdayEventId;
    }

    const itemTime = event.startTime;
    if (itemTime) return newEvent;

    const { timeConfig, updatedText } = extractTimeValueFromString(userInput, event.listId);
    if (!timeConfig) return newEvent;

    newEvent.value = updatedText;
    newEvent.startTime = timeConfig.startIso;

    // Update the event's position within its planner to preserve chronological ordering.
    const planner = getRecurringPlannerFromStorageById(newEvent.listId);
    const currentIndex = planner.eventIds.findIndex(e => e === newEvent.id);
    if (currentIndex === -1) {
        throw new Error(`updateRecurringEventValueWithSmartTimeDetect: No event exists in planner ${newEvent.listId} with ID ${newEvent.id}`);
    }

    updateRecurringEventIndexWithChronologicalCheck(currentIndex, newEvent);

    return newEvent;
}

/**
 * Updates or inserts a recurring weekday event into all recurring weekday planners.
 * 
 * @param weekdayEvent - The event to propagate into the recurring planners.
 */
export function updateWeekdayPlannersWithWeekdayEvent(
    weekdayEvent: IRecurringEvent
) {

    Object.values(ERecurringPlannerKey).forEach((day) => {
        if ([
            ERecurringPlannerKey.WEEKDAYS,
            ERecurringPlannerKey.SATURDAY,
            ERecurringPlannerKey.SUNDAY
        ].includes(day)) return;

        const recurringPlanner = getRecurringPlannerFromStorageById(day);
        if (recurringPlanner.deletedWeekdayEventIds.includes(weekdayEvent.id)) return;

        const eventExists = recurringPlanner.eventIds.find((id, index) => {
            const recEvent = getRecurringEventFromStorageById(id);
            if (recEvent.weekdayEventId === weekdayEvent.id) {

                const baseEvent: IRecurringEvent = {
                    ...recEvent,
                    value: weekdayEvent.value,
                };

                if (recEvent.startTime) {
                    baseEvent.startTime = weekdayEvent.startTime;
                }

                // Ensure the event does not break chronological ordering.
                updateRecurringEventIndexWithChronologicalCheck(index, baseEvent);

                saveRecurringEventToStorage(baseEvent);
                return true;
            }
            return false;
        });

        if (eventExists) return;

        const baseEvent: IRecurringEvent = {
            ...weekdayEvent,
            id: uuid.v4(),
            weekdayEventId: weekdayEvent.id,
            listId: day,
            storageId: EStorageId.RECURRING_PLANNER_EVENT
        };

        saveRecurringEventToStorage(baseEvent);

        // Insert the event in the back of the list and adjust to preserve chronological ordering.
        updateRecurringEventIndexWithChronologicalCheck(recurringPlanner.eventIds.length, baseEvent);
    });
}

// ===================
// 4. Delete Function
// ===================

/**
 * Deletes a list of recurring events from storage. Weekday events will be hidden.
 * 
 * @param eventsToDelete - The list of recurring events to delete.
 */
export async function deleteRecurringEventsFromStorageHideWeekday(
    eventsToDelete: IRecurringEvent[]
) {
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

        if (event.listId === ERecurringPlannerKey.WEEKDAYS) {
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

// ======================
// 5. Generate Functions
// ======================

export function generateEmptyRecurringPlanner(recurringPlannerId: string): TRecurringPlanner {
    return {
        id: recurringPlannerId,
        eventIds: [],
        deletedWeekdayEventIds: []
    };
}

/**
 * Generates the icon config representing a recurring event's time. Clicking the icon will open the textfield for the event.
 * 
 * @param event - The recurring event.
 * @param onBeginEdit - Callback to begin editing the event.
 * @returns Icon configuration for the recurring event's time.
 */
export function generateRecurringEventTimeIconConfig(
    event: IRecurringEvent,
    onBeginEdit: (event: IRecurringEvent) => void,
): TListItemIconConfig<IRecurringEvent> {
    return {
        hideIcon: !event.startTime,
        onClick: () => onBeginEdit(event),
        customIcon: (
            <TimeValue timeValue={event.startTime} concise />
        )
    };
}

/**
 * Generates a new recurring event for a given recurring planner. The new event will focus the textfield.
 * 
 * @param recurringPlannerId - The ID of the recurring planner.
 * @param index - The index of the new item within its recurring planner.
 */
export function generateNewRecurringEventAndSaveToStorage(recurringPlannerId: string, index: number) {
    const recurringPlanner = getRecurringPlannerFromStorageById(recurringPlannerId);

    const recurringEvent: IRecurringEvent = {
        id: uuid.v4(),
        value: "",
        listId: recurringPlannerId,
        storageId: EStorageId.RECURRING_PLANNER_EVENT
    };
    saveRecurringEventToStorage(recurringEvent);

    recurringPlanner.eventIds.splice(index, 0, recurringEvent.id);
    saveRecurringPlannerToStorage(recurringPlanner);

    jotaiStore.set(textfieldIdAtom, recurringEvent.id);
}
