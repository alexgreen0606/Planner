import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { hasCalendarAccess } from "@/utils/accessUtils";
import { loadCalendarDataToStore } from "@/utils/calendarUtils";
import { getYesterdayDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { cloneListItemWithKeyRemovalAndUpdate } from "@/utils/listUtils";
import { arePlannerEventTimesEqual, generateEmptyPlanner, sortPlannerChronologicalWithUpsert } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { MMKV } from 'react-native-mmkv';

//

const plannerStorage = new MMKV({ id: EStorageId.PLANNER });
const eventStorage = new MMKV({ id: EStorageId.EVENT });

export function savePlannerToStorage(planner: TPlanner) {
    plannerStorage.set(planner.datestamp, JSON.stringify(planner));
}

export function savePlannerEventToStorage(event: IPlannerEvent) {
    eventStorage.set(event.id, JSON.stringify(event));
}

// ====================
// 1. Upsert Functions
// ====================

// DEPRECATED
export function upsertEventToStorage(
    event: IPlannerEvent,
    planner?: TPlanner,
    staleStorageId?: string
): IPlannerEvent {
    const storagePlanner = planner ?? getPlannerFromStorageByDatestamp(event.listId);
    const prevEventId = staleStorageId ?? event.id;
    storagePlanner.events = sortPlannerChronologicalWithUpsert(storagePlanner.events, event, prevEventId);
    savePlannerToStorage(event.listId, storagePlanner);
    return event;
}

// DEPRECATED
export async function upsertEventToStorageAndCalendarCheckRecurring(event: IPlannerEvent) {
    const planner = getPlannerFromStorageByDatestamp(event.listId);
    const prevEvent = planner.events.find(e => e.id === event.id);

    const sanitizedEvent = hideAndCloneRecurringEventInPlanner(event, planner, prevEvent);
    sanitizedEvent.status = EItemStatus.STATIC;

    // Update the device calendar if the event is linked to it.
    const eventValueChanged = sanitizedEvent.value !== prevEvent?.value;
    if (sanitizedEvent.calendarId && eventValueChanged && hasCalendarAccess()) {
        await Calendar.updateEventAsync(sanitizedEvent.calendarId, { title: sanitizedEvent.value });
        loadCalendarDataToStore([sanitizedEvent.listId]);
        return;
    }

    upsertEventToStorage(sanitizedEvent, planner);
}

// ==================
// 2. Read Functions
// ==================

export function getPlannerFromStorageByDatestamp(datestamp: string): TPlanner {
    const eventsString = plannerStorage.getString(datestamp);
    if (!eventsString) {
        return generateEmptyPlanner(datestamp);
    }

    return JSON.parse(eventsString);
}

export function getPlannerEventFromStorageById(id: string): IPlannerEvent {
    const eventsString = eventStorage.getString(id);
    if (!eventsString) {
        throw new Error(`getPlannerEventFromStorageById: No event found in storage with ID ${id}`);
    }

    return JSON.parse(eventsString);
}

// ====================
// 3. Delete Functions
// ====================

export async function deletePlannerEventFromStorage(eventId: string) {
    eventStorage.delete(eventId);
}

export async function deleteAllPastPlanners() {
    const yesterdayDatestamp = getYesterdayDatestamp();

    const allStorageKeys = plannerStorage.getAllKeys();
    allStorageKeys.forEach(datestamp => {
        if (isTimeEarlierOrEqual(datestamp, yesterdayDatestamp)) {
            plannerStorage.delete(datestamp);
        }
    });
}

// =============================
// 4. Recurring Event Utilities
// =============================

export function hideAndCloneRecurringEventInPlanner(
    event: IPlannerEvent,
    planner: TPlanner,
    prevEvent: IPlannerEvent | undefined
): IPlannerEvent {
    // Ensure this event has been modified aside from its sort ID.
    if (
        prevEvent && event.recurringId && (
            // The event is being added to the calendar
            event.calendarId ||
            // The event's title is changing
            prevEvent.value !== event.value ||
            // The event time has changed
            !arePlannerEventTimesEqual(prevEvent.timeConfig, event.timeConfig)
        )
    ) {
        // Hide the recurring event.
        planner.eventIds = sortPlannerChronologicalWithUpsert(planner.eventIds, {
            ...prevEvent,
            status: EItemStatus.HIDDEN
        });

        // Strip the recurring event into a generic one.
        return cloneListItemWithKeyRemovalAndUpdate<IPlannerEvent>(
            event,
            ['recurringId'],
            { recurringCloneId: event.recurringId }
        );
    }
    return event;
}

export function resetRecurringEventsInPlanner(datestamp: string) {
    const planner = getPlannerFromStorageByDatestamp(datestamp);

    // Strip all recurring events from the planner. The rebuild will add them back in.
    const strippedEvents = planner.events.filter(event => !event.recurringId && !event.recurringCloneId);

    savePlannerToStorage(datestamp, {
        ...planner,
        events: strippedEvents,
        hideRecurring: false
    });
}

export function deleteAllRecurringEventsFromPlanner(datestamp: string) {
    const planner = getPlannerFromStorageByDatestamp(datestamp);

    const hiddenRecurringPlanner = planner.events.map(event => {
        if (event.recurringId || event.recurringCloneId) {
            return { ...event, status: EItemStatus.HIDDEN };
        } else {
            return event;
        }
    });

    savePlannerToStorage(datestamp, {
        ...planner,
        events: hiddenRecurringPlanner
    });
}