import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent, ITimeConfig } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { hasCalendarAccess } from "@/utils/accessUtils";
import { loadCalendarDataToStore } from "@/utils/calendarUtils";
import { getTodayDatestamp, getYesterdayDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { cloneListItemWithKeyRemovalAndUpdate } from "@/utils/listUtils";
import { generateEmptyPlanner, getAllMountedDatestampsLinkedToDateRanges, sortPlannerChronologicalWithUpsert, arePlannerEventTimesEqual } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { MMKV } from 'react-native-mmkv';

// ✅ 

const storage = new MMKV({ id: EStorageId.PLANNER });

export function savePlannerToStorage(datestamp: string, planner: TPlanner) {
    storage.set(datestamp, JSON.stringify(planner));
}

// ====================
// 1. Upsert Functions
// ====================

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
    const eventsString = storage.getString(datestamp);
    if (eventsString) {
        return JSON.parse(eventsString);
    }
    return generateEmptyPlanner(datestamp);
}

/**
 * ✅ Deletes past planners and returns any incomplete events from yesterday.
 * 
 * Recurring and hidden events will not be returned. Timed events will be stripped down to generic events 
 * and returned.
 * 
 * @returns - A list of incomplete planner events from yesterday.
 */
export function getCarryoverEventsAndCleanStorage(): IPlannerEvent[] {
    const yesterdayDatestamp = getYesterdayDatestamp();
    const yesterdayPlanner = getPlannerFromStorageByDatestamp(yesterdayDatestamp);

    // Delete all previous calendars.
    const allStorageKeys = storage.getAllKeys();
    allStorageKeys.forEach(datestamp => {
        if (isTimeEarlierOrEqual(datestamp, yesterdayDatestamp)) {
            storage.delete(datestamp);
        }
    });

    return yesterdayPlanner.events
        // Remove hidden and recurring events.
        .filter((event: IPlannerEvent) =>
            event.status !== EItemStatus.HIDDEN &&
            !event.recurringId &&
            !event.recurringCloneId &&
            !event.calendarId
        )
        // Convert timed events to generic.
        .map((event: IPlannerEvent) => {
            delete event.timeConfig;
            return event;
        });
}

// ====================
// 3. Delete Functions
// ====================

export async function deletePlannerEventsFromStorageAndCalendar(events: IPlannerEvent[], excludeCalendarRefresh: boolean = false) {
    const todayDatestamp = getTodayDatestamp();

    // Phase 1: Group events by date and handle calendar removals.
    // Deleted calendar events do not need to be deleted from storage. The planner rebuild will remove these events automatically.
    const eventsByList: Record<string, IPlannerEvent[]> = {};
    const deletedCalendarEvents = [];
    for (const event of events) {
        // Delete the event from the calendar.
        if (
            event.calendarId &&
            event.listId !== todayDatestamp &&
            hasCalendarAccess()
        ) {
            await Calendar.deleteEventAsync(event.calendarId);
            deletedCalendarEvents.push(event);
        }
        if (!eventsByList[event.listId]) {
            eventsByList[event.listId] = [];
        }
        eventsByList[event.listId].push(event);
    }

    // Phase 2: Process each storage deletion in parallel.
    Object.entries(eventsByList).map(async ([listId, listEvents]) => {
        const newPlanner = getPlannerFromStorageByDatestamp(listId);
        const isTodayList = listId === todayDatestamp;

        newPlanner.events = newPlanner.events.reduce((acc, event) => {
            const matchingDeleteEvent = listEvents.find(e => e.id === event.id);

            if (!matchingDeleteEvent) {
                acc.push(event);
            } else if (
                matchingDeleteEvent.recurringId ||
                matchingDeleteEvent.recurringCloneId ||
                (matchingDeleteEvent.calendarId && isTodayList)
            ) {
                // Special case: recurring events or today's calendar events get hidden.
                acc.push({ ...event, status: EItemStatus.HIDDEN });
            }

            return acc;
        }, [] as IPlannerEvent[]);

        savePlannerToStorage(listId, newPlanner);
    });

    // Phase 3: Reload the calendar data if any of the deleted calendar events affect the mounted planners.
    if (!excludeCalendarRefresh) {
        const datestampsToReload = getAllMountedDatestampsLinkedToDateRanges<ITimeConfig>(
            deletedCalendarEvents.map(event => event.timeConfig!)
        );
        await loadCalendarDataToStore(datestampsToReload);
    }
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
        planner.events = sortPlannerChronologicalWithUpsert(planner.events, {
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

export function toggleHideAllRecurringEventsInPlanner(datestamp: string) {
    const planner = getPlannerFromStorageByDatestamp(datestamp);
    savePlannerToStorage(datestamp, {
        ...planner,
        hideRecurring: !planner.hideRecurring
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