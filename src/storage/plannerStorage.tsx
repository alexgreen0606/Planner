import { PLANNER_STORAGE_ID } from "@/lib/constants/storage";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { getCalendarAccess } from "@/utils/calendarUtils";
import { getTodayDatestamp, getYesterdayDatestamp } from "@/utils/dateUtils";
import { cloneItem, isItemTextfield } from "@/utils/listUtils";
import { generatePlanner, sanitizePlanner, timeConfigsAreEqual } from "@/utils/plannerUtils";
import RNCalendarEvents from "react-native-calendar-events";
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * ✅ Fetches the planner for the given datestamp from storage.
 * 
 * @param datestamp - the key of the planner in storage
 * @returns - a planner for the given date
 */
export function getPlannerFromStorage(datestamp: string): TPlanner {
    const eventsString = storage.getString(datestamp);
    if (eventsString) {
        return JSON.parse(eventsString);
    }
    return generatePlanner(datestamp);
}

/**
 * ✅ Saves a planner to storage.
 * 
 * @param datestamp - the key of the planner in storage
 * @param newPlanner - the planner to save
 */
export function savePlannerToStorage(datestamp: string, newPlanner: TPlanner) {
    storage.set(datestamp, JSON.stringify(newPlanner));
}

/**
 * ✅ Deletes all planners older than today's, and returns a subset of events
 * from yesterday's planner to carry over to today.
 * Recurring items and hidden items will be ignored.
 * Timed items will be stripped down to generic events.
 * 
 * @returns - a list of events to merge into today's planner
 */
export function getCarryoverEventsAndCleanStorage(): IPlannerEvent[] {
    const yesterdayTimestamp = getYesterdayDatestamp();
    const todayTimestamp = getTodayDatestamp();
    const yesterdayPlanner = getPlannerFromStorage(yesterdayTimestamp);

    // Delete all previous calendars
    const allStorageKeys = storage.getAllKeys();
    allStorageKeys.forEach(datestamp => {
        if (datestamp.localeCompare(todayTimestamp) < 0) {
            storage.delete(datestamp);
        }
    });

    return yesterdayPlanner.events
        // Remove hidden items and recurring items
        .filter((event: IPlannerEvent) => {
            event.status !== EItemStatus.HIDDEN && !event.recurringId
        })
        // Convert timed events to generic
        .map((event: IPlannerEvent) => {
            delete event.calendarId;
            delete event.timeConfig;
            return event;
        });
}

/**
 * ✅ Creates or updates a planner event.
 * Calendar events will be synced. 
 * Modified recurring events will be hidden and cloned.
 * Unscheduled events will be removed from the calendar.
 * Time logic will be enforced to ensure the event is placed correctly in the planner.
 * 
 * @param event - the event to update
 * @returns - The updated event in storage. If the item was removed from the planner, it will return undefined.
 */
export async function saveEvent(event: IPlannerEvent): Promise<IPlannerEvent | null> {
    const newPlanner = getPlannerFromStorage(event.listId);
    let newEvent = { ...event, status: isItemTextfield(event) ? EItemStatus.STATIC : event.status };
    const oldEvent = newPlanner.events.find(existingEvent => existingEvent.id === event.id);

    const newCalendarId = newEvent.calendarId;
    const oldCalendarId = oldEvent?.calendarId;

    // Ensure calendar events replace the original item, if it exists
    let replaceId = oldEvent?.id ?? newEvent.id;

    // Phase 1: Clone recurring events to allow customization. 
    // The original event will be hidden and replaced with the clone.
    if (
        oldEvent && newEvent.recurringId && (
            // The event is being added to the calendar
            newCalendarId ||
            // The event's title is changing
            oldEvent.value !== newEvent.value ||
            // The event time has changed
            !timeConfigsAreEqual(oldEvent.timeConfig, newEvent.timeConfig)
        )
    ) {
        // Strip the recurring event down and hide it
        newPlanner.events = sanitizePlanner(newPlanner.events, {
            ...oldEvent,
            status: EItemStatus.HIDDEN
        });

        // Continue on to save the cloned event
        newEvent = cloneItem<IPlannerEvent>(
            newEvent,
            ['recurringId'],
            { recurringCloneId: newEvent.recurringId }
        );
        replaceId = newEvent.id;
    }

    // Phase 2: Handle calendar events.
    if (newCalendarId) {
        // Update the device calendar with the new data.
        await getCalendarAccess();
        const calendarEventId = await RNCalendarEvents.saveEvent(
            newEvent.value,
            {
                startDate: newEvent.timeConfig!.startTime,
                endDate: newEvent.timeConfig!.endTime,
                allDay: newEvent.timeConfig!.allDay,
                id: newEvent.calendarId === 'NEW' ? undefined : newEvent.calendarId
            }
        );

        // Sync the planner event ID with the calendar event ID.
        newEvent.calendarId = calendarEventId;
        newEvent.id = calendarEventId;

        if (event.timeConfig?.allDay) {
            // Remove this event from the planner.
            newPlanner.events = newPlanner.events.filter(existingEvent => existingEvent.id !== event.id);
            savePlannerToStorage(newEvent.listId, newPlanner);
            return null;
        }
    } else if (oldCalendarId) {
        // Delete unscheduled event from the calendar. 
        await getCalendarAccess();
        await RNCalendarEvents.removeEvent(oldCalendarId);
    }

    newPlanner.events = sanitizePlanner(newPlanner.events, newEvent, replaceId);
    savePlannerToStorage(newEvent.listId, newPlanner);
    return newEvent;
}

/**
 * ✅ Deletes a list of planner events.
 * All affected planners will be updated.
 * If an event is a recurring event or a calendar event from today, it will be hidden.
 * Otherwise the events will be permanently deleted.
 * 
 * @param eventsToDelete - the list of planner events to delete
 */
export async function deleteEvents(eventsToDelete: IPlannerEvent[]) {
    const eventsByList: Record<string, IPlannerEvent[]> = {};
    const todayDatestamp = getTodayDatestamp();

    // Phase 1: Group events by date and handle calendar removals
    for (const eventToDelete of eventsToDelete) {
        if (!eventsByList[eventToDelete.listId]) {
            eventsByList[eventToDelete.listId] = [];
        }
        eventsByList[eventToDelete.listId].push(eventToDelete);

        // Remove calendar events from the device if they are not from today
        if (
            eventToDelete.calendarId &&
            eventToDelete.listId !== todayDatestamp
        ) {
            await getCalendarAccess();
            await RNCalendarEvents.removeEvent(eventToDelete.calendarId);
        }
    }

    // Phase 2: Process each list deletion in parallel
    Object.entries(eventsByList).map(async ([listId, listEvents]) => {
        const newPlanner = getPlannerFromStorage(listId);

        // Separate regular deletions from special case deletions.
        // Calendar events from today OR recurring events will be marked hidden, not deleted.
        const recurringOrTodayCalendarIds = new Set<string>();
        const regularDeleteIds = new Set<string>();
        for (const event of listEvents) {
            if (event.recurringId || (event.calendarId && event.listId === todayDatestamp)) {
                recurringOrTodayCalendarIds.add(event.id);
            } else {
                regularDeleteIds.add(event.id);
            }
        }

        // Execute the cleaning of the planner.
        // Calendar events from today OR recurring events will be marked hidden, not deleted.
        newPlanner.events = newPlanner.events.reduce((acc, event) => {
            if (regularDeleteIds.has(event.id)) return acc;

            if (recurringOrTodayCalendarIds.has(event.id)) {
                acc.push({ ...event, status: EItemStatus.HIDDEN });
            } else {
                acc.push(event);
            }

            return acc;
        }, [] as IPlannerEvent[]);

        savePlannerToStorage(listId, newPlanner);
    });
}

/**
 * ✅ Hide the recurring events in the planner. 
 * The flag will be set so the recurring events can be hidden elsewhere.
 * 
 * @param datestamp - the date of the planner to edit
 */
export function toggleHideAllRecurringEvents(datestamp: string) {
    const planner = getPlannerFromStorage(datestamp);
    savePlannerToStorage(datestamp, {
        ...planner,
        hideRecurring: !Boolean(planner.hideRecurring)
    });
}

/**
 * ✅ Deletes all recurring events in the planner with the given datestamp.
 * Events will all be marked "hidden".
 * 
 * @param datestamp - the date of the planner to edit
 */
export function deleteAllRecurringEvents(datestamp: string) {
    const planner = getPlannerFromStorage(datestamp);

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

/**
 * ✅ Resets all recurring events within the planner for the given date.
 * All hidden recurring events will be un-hidden. 
 * Cloned recurring events will be reset.
 * The recurring events will be marked visible within the planner.
 * 
 * @param datestamp - the date of the planner to reset
 */
export function resetRecurringEvents(datestamp: string) {
    const planner = getPlannerFromStorage(datestamp);

    const newEvents = planner.events
        .filter(event => !event.recurringCloneId)
        .map(event => {
            if (event.recurringCloneId || event.recurringId) {
                return { ...event, status: EItemStatus.STATIC };
            } else {
                return event;
            }
        });

    savePlannerToStorage(datestamp, {
        ...planner,
        events: newEvents,
        hideRecurring: false
    });
}