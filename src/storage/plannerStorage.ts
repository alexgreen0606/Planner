import { PLANNER_STORAGE_ID } from "@/lib/constants/storage";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { getPrimaryCalendarId, hasCalendarAccess, loadCalendarData } from "@/utils/calendarUtils";
import { getTodayDatestamp, getYesterdayDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { cloneItem, isItemTextfield } from "@/utils/listUtils";
import { generatePlanner, getAffectedVisibleDatestamps, sanitizePlanner, timeConfigsAreEqual } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: PLANNER_STORAGE_ID });



// ------------- Simple Getters and Setters -------------

/**
 * ✅ Fetches a planner from storage.
 * 
 * @param datestamp - The storage key of the planner. (YYY-MM-DDD)
 * @returns - A planner from storage.
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
 * @param datestamp - The storage key for the planner. (YYY-MM-DDD)
 * @param planner - The planner to save.
 */
export function savePlannerToStorage(datestamp: string, planner: TPlanner) {
    storage.set(datestamp, JSON.stringify(planner));
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
    const yesterdayPlanner = getPlannerFromStorage(yesterdayDatestamp);

    // Delete all previous calendars.
    const allStorageKeys = storage.getAllKeys();
    allStorageKeys.forEach(datestamp => {
        if (isTimeEarlierOrEqual(datestamp, yesterdayDatestamp)) {
            storage.delete(datestamp);
        }
    });

    return yesterdayPlanner.events
        // Remove hidden and recurring events.
        .filter((event: IPlannerEvent) => {
            event.status !== EItemStatus.HIDDEN && !event.recurringId && !event.recurringCloneId
        })
        // Convert timed events to generic.
        .map((event: IPlannerEvent) => {
            delete event.calendarId;
            delete event.timeConfig;
            return event;
        });
}



// ------------- Advanced CRUD Utilities -------------

/**
 * Creates or updates a planner event.
 * Calendar events will be synced. 
 * Modified recurring events will be hidden and cloned.
 * Unscheduled events will be removed from the calendar.
 * Time logic will be enforced to ensure the event is placed correctly in the planner.
 * 
 * @param event - the event to update
 * @returns - The updated event in storage. If the item was removed from the planner, it will return undefined.
 */
export async function savePlannerEvent(event: IPlannerEvent): Promise<IPlannerEvent | null> {
    const newPlanner = getPlannerFromStorage(event.listId);

    const oldEvent = newPlanner.events.find(existingEvent => existingEvent.id === event.id);
    const oldId = oldEvent?.id;
    const oldCalendarId = oldEvent?.calendarId;

    let newEvent = { ...event, status: isItemTextfield(event) ? EItemStatus.STATIC : event.status };
    const newCalendarId = newEvent.calendarId;

    // Phase 1: Clone recurring events to allow customization. 
    // The original event will be hidden and the clone will be saved.
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
        // Mark the recurring event hidden
        newPlanner.events = sanitizePlanner(newPlanner.events, {
            ...oldEvent,
            status: EItemStatus.HIDDEN
        });

        // Clone the recurring event and remove its recurring status.
        newEvent = cloneItem<IPlannerEvent>(
            newEvent,
            ['recurringId'],
            { recurringCloneId: newEvent.recurringId }
        );

        // TODO: changing the recurring to have a time is keeping the original recurring event
    }

    // Phase 2: Handle calendar events.
    if (hasCalendarAccess()) {
        if (newCalendarId) {

            // Update the device calendar.
            if (newEvent.calendarId === 'NEW') {
                const primaryCalendarId = await getPrimaryCalendarId();
                const calendarEventId = await Calendar.createEventAsync(
                    primaryCalendarId,
                    {
                        title: newEvent.value,
                        startDate: newEvent.timeConfig!.startTime,
                        endDate: newEvent.timeConfig!.endTime,
                        allDay: newEvent.timeConfig!.allDay
                    }
                );

                // Sync the planner event ID with the calendar event ID. 

                // TODO: is this needed? Wait until time modal is refactored.
                newEvent.calendarId = calendarEventId;
                newEvent.id = calendarEventId;
            } else {
                await Calendar.updateEventAsync(
                    newCalendarId,
                    {
                        title: newEvent.value,
                        startDate: newEvent.timeConfig!.startTime,
                        endDate: newEvent.timeConfig!.endTime,
                        allDay: newEvent.timeConfig!.allDay
                    }
                );
            }

            // Track the planner events that have been affected by these new changes.
            const affectedEvents = [event];
            if (oldEvent) {
                affectedEvents.push(oldEvent);
                if (!oldCalendarId) {
                    // This event exists in the calendar and is not yet a calendar event.
                    // Remove it from the planner so the calendar event can take its place.
                    newPlanner.events = newPlanner.events.filter(existingEvent => existingEvent.id !== oldId);
                    savePlannerToStorage(newEvent.listId, newPlanner);
                }
            }

            // Reload the calendar data and allow the planner rebuild to handle the event.
            const datestampsToReload = getAffectedVisibleDatestamps(affectedEvents);
            await loadCalendarData(datestampsToReload);

            // TODO: does the newEvent have a correct sortId? Should I calculate one?
            return newEvent;

        } else if (oldCalendarId) {
            // Delete unscheduled event from the calendar.
            await Calendar.deleteEventAsync(oldCalendarId);

            // Reload the calendar for the planners the event was linked to.
            const datestampsToReload = getAffectedVisibleDatestamps([oldEvent]);
            await loadCalendarData(datestampsToReload); // TODO: test
        }
    } else {
        // Event calendar status must be revoked.
        // User does not have access to the calendar
        // delete newEvent.calendarId;

        // TODO: can I leave this commented out? Can events be marked as cal events still?
        // SHOULD I REMOVE ANY SETTINGS NOT ALLOWED FOR NON_CALENDAR EVENTS
    }

    newPlanner.events = sanitizePlanner(newPlanner.events, newEvent);
    savePlannerToStorage(newEvent.listId, newPlanner);
    return newEvent;
}

/**
 * ✅ Deletes a list of planner events and reloads the calendar data if needed.
 * 
 * If an event is recurring or a calendar event from today, it will be hidden.
 * All other events will be permanently deleted.
 * 
 * @param events - The list of planner events to delete.
 */
export async function deletePlannerEvents(events: IPlannerEvent[]) {
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

            // Mark the event for storage removal.
        } else {
            if (!eventsByList[event.listId]) {
                eventsByList[event.listId] = [];
            }
            eventsByList[event.listId].push(event);
        }
    }

    // Phase 2: Process each storage deletion in parallel.
    Object.entries(eventsByList).map(async ([listId, listEvents]) => {
        const newPlanner = getPlannerFromStorage(listId);
        const isTodayList = listId === todayDatestamp;

        newPlanner.events = newPlanner.events.reduce((acc, event) => {
            const matchingDeleteEvent = listEvents.find(e => e.id === event.id);

            if (!matchingDeleteEvent) {
                acc.push(event);
            } else if (matchingDeleteEvent.recurringId || (matchingDeleteEvent.calendarId && isTodayList)) {
                // Special case: recurring events or today's calendar events get hidden.
                acc.push({ ...event, status: EItemStatus.HIDDEN });
            }

            return acc;
        }, [] as IPlannerEvent[]);

        savePlannerToStorage(listId, newPlanner);
    });

    // Phase 3: Reload the calendar data if any of the deleted calendar events affect the mounted planners.
    const datestampsToReload = getAffectedVisibleDatestamps(deletedCalendarEvents);
    await loadCalendarData(datestampsToReload);
}



// ------------- Recurring Event Utilities -------------

/**
 * ✅ Resets all recurring events within a planner.
 * 
 * Hidden recurring events will be un-hidden and cloned recurring events will be reset.
 * 
 * @param datestamp - The key of the planner to update. (YYY-MM-DDD)
 */
export function resetRecurringEvents(datestamp: string) {
    const planner = getPlannerFromStorage(datestamp);

    // Strip all recurring events from the planner. The rebuild will add them back in.
    const strippedEvents = planner.events.filter(event => !event.recurringId && !event.recurringCloneId);

    savePlannerToStorage(datestamp, {
        ...planner,
        events: strippedEvents,
        hideRecurring: false
    });
}

/**
 * ✅ Hides or unhides all recurring events in a planner.
 * 
 * A flag will be toggled so the recurring events can be conditionally rendered.
 * 
 * @param datestamp - The key of the planner to update. (YYY-MM-DDD)
 */
export function toggleHideAllRecurringEvents(datestamp: string) {
    const planner = getPlannerFromStorage(datestamp);
    savePlannerToStorage(datestamp, {
        ...planner,
        hideRecurring: !planner.hideRecurring
    });
}

/**
 * ✅ Deletes all recurring events in a planner.
 * 
 * @param datestamp - The key of the planner to update. (YYY-MM-DDD)
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