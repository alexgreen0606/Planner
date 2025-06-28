import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { hasCalendarAccess } from "@/utils/accessUtils";
import { getPrimaryCalendarId, loadCalendarData } from "@/utils/calendarUtils";
import { getTodayDatestamp, getYesterdayDatestamp, isTimeEarlier } from "@/utils/dateUtils";
import { cloneItem, isItemTextfield, sanitizeList } from "@/utils/listUtils";
import { generatePlanner, sanitizePlanner, timeConfigsAreEqual } from "@/utils/plannerUtils";
import * as Calendar from "expo-calendar";
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: EStorageId.PLANNER });



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
        if (isTimeEarlier(datestamp, yesterdayDatestamp)) {
            storage.delete(datestamp);
        }
    });

    console.log(yesterdayPlanner, 'initial yesterday')

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



// ------------- Advanced CRUD Utilities -------------

/**
 * Creates or updates a planner event.
 * 
 * Calendar events will be synced to the device.
 * Modified recurring events will be hidden and cloned.
 * Timed events will get a new sort ID to ensures the planner remains chronological.
 * 
 * @param event - The planner event to save.
 * @param prevState - An optional item to use as the event's previous state. Only required for event chips
 * as they do not exist in storage.
 */
export async function savePlannerEvent(event: IPlannerEvent, prevState?: IPlannerEvent) {
    const newPlanner = getPlannerFromStorage(event.listId);

    const prevEvent = newPlanner.events.find(existingEvent => existingEvent.id === event.id) ?? prevState;
    const prevCalendarId = prevEvent?.calendarId;

    let newEvent = { ...event, status: isItemTextfield(event) ? EItemStatus.STATIC : event.status };
    const newCalendarId = newEvent.calendarId;

    // Phase 1: Clone recurring events to allow customization. 
    // The recurring event will be hidden and the clone will be saved.
    if (
        prevEvent && newEvent.recurringId && (
            // The event is being added to the calendar
            newCalendarId ||
            // The event's title is changing
            prevEvent.value !== newEvent.value ||
            // The event time has changed
            !timeConfigsAreEqual(prevEvent.timeConfig, newEvent.timeConfig)
        )
    ) {
        // Mark the recurring event hidden
        newPlanner.events = sanitizePlanner(newPlanner.events, {
            ...prevEvent,
            status: EItemStatus.HIDDEN
        });

        // Clone the recurring event and remove its recurring status.
        newEvent = cloneItem<IPlannerEvent>(
            newEvent,
            ['recurringId'],
            { recurringCloneId: newEvent.recurringId }
        );
    }

    // Phase 2: Handle calendar events.
    if (newCalendarId && hasCalendarAccess()) {

        // Update the device calendar.
        if (newEvent.calendarId === 'NEW') {
            const primaryCalendarId = await getPrimaryCalendarId();
            newEvent.calendarId = await Calendar.createEventAsync(
                primaryCalendarId,
                {
                    title: newEvent.value,
                    startDate: newEvent.timeConfig!.startIso,
                    endDate: newEvent.timeConfig!.endIso,
                    allDay: newEvent.timeConfig!.allDay
                }
            );
        } else {
            await Calendar.updateEventAsync(
                newCalendarId,
                {
                    title: newEvent.value,
                    startDate: newEvent.timeConfig!.startIso,
                    endDate: newEvent.timeConfig!.endIso,
                    allDay: newEvent.timeConfig!.allDay
                }
            );
        }

        // Track the planner events that have been affected by this function call.
        const affectedEvents = [event];
        if (prevEvent) {
            affectedEvents.push(prevEvent);
            if (!prevCalendarId) {
                // The updating event exists in the calendar already and is not a calendar event.
                // Remove it from the planner so the calendar event can take its place.
                newPlanner.events = newPlanner.events.filter(existingEvent => existingEvent.id !== newEvent.id);
                savePlannerToStorage(newEvent.listId, newPlanner);
            }
        }

        // Reload the calendar data and allow the planner rebuild to handle the event.
        const datestampsToReload = getMountedLinkedDatestamps(affectedEvents);
        await loadCalendarData(datestampsToReload);
        // return;


        // TODO: save a placeholder
    }

    newPlanner.events = sanitizePlanner(newPlanner.events, newEvent);
    savePlannerToStorage(newEvent.listId, newPlanner);
    return;
}

/**
 * ✅ During the save process, if the event is recurring, hides the original event within the planner
 * and returns a clone of the event without its recurring reference.
 *
 * @param event - The event being saved, checked for recurrence.
 * @param planner - The planner that contains the event.
 * @param prevEvent - The event's previous state before this update.
 * @returns The sanitized event.
 */
export function sanitizeRecurringEventForSave(
    event: IPlannerEvent,
    planner: TPlanner,
    prevEvent: IPlannerEvent | undefined
) {
    // Ensure this event has been modified aside from its sort ID.
    if (
        prevEvent && event.recurringId && (
            // The event is being added to the calendar
            event.calendarId ||
            // The event's title is changing
            prevEvent.value !== event.value ||
            // The event time has changed
            !timeConfigsAreEqual(prevEvent.timeConfig, event.timeConfig)
        )
    ) {
        // Hide the recurring event.
        planner.events = sanitizePlanner(planner.events, {
            ...prevEvent,
            status: EItemStatus.HIDDEN
        });

        // Strip the recurring event into a generic one.
        return cloneItem<IPlannerEvent>(
            event,
            ['recurringId'],
            { recurringCloneId: event.recurringId }
        );
    }
    return event;
}

/**
 * ✅ Saves an event to its planner.
 * 
 * @param event - The event to save.
 * @param planner - The planner that contains the event.
 * @param staleStorageId - Optional ID of an event in storage to overwrite with the new event.
 * @returns The sort ID of the saved event.
 */
export function saveEventToPlanner(event: IPlannerEvent, planner?: TPlanner, staleStorageId?: string) {
    const storagePlanner = planner ?? getPlannerFromStorage(event.listId);
    const prevEventId = staleStorageId ?? event.id;
    storagePlanner.events = sanitizePlanner(storagePlanner.events, event, prevEventId);
    savePlannerToStorage(event.listId, storagePlanner);
    return event.sortId;
}

/**
 * ✅ Converts a timed event back to a generic event and saves it to storage.
 * 
 * If the event is a calendar event it will be deleted from the device.
 * 
 * @param event - The planner event to convert.
 */
export async function unschedulePlannerEvent(event: IPlannerEvent) {
    const unscheduledEvent = { ...event };
    delete unscheduledEvent.calendarId;
    delete unscheduledEvent.timeConfig;

    // Save the unscheduled event to storage.
    const planner = getPlannerFromStorage(event.listId);
    planner.events = sanitizeList(planner.events, unscheduledEvent);
    savePlannerToStorage(event.listId, planner);

    // If the event exists in the calendar, delete it and reload the affected planners.
    if (event.calendarId && hasCalendarAccess()) {
        await Calendar.deleteEventAsync(event.calendarId);
        const datestampsToReload = getMountedLinkedDatestamps([event]);
        await loadCalendarData(datestampsToReload);
    }
}

/**
 * ✅ Deletes a list of planner events and reloads the calendar data if needed.
 * 
 * If an event is recurring or a calendar event from today, it will be hidden.
 * All other events will be permanently deleted.
 * 
 * @param events - The list of planner events to delete.
 * @param excludeCalendarRefresh - Skips reloading the affected calendar data. Default is false.
 */
export async function deletePlannerEvents(events: IPlannerEvent[], excludeCalendarRefresh: boolean = false) {
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
    if (!excludeCalendarRefresh) {
        const datestampsToReload = getMountedLinkedDatestamps(deletedCalendarEvents);
        await loadCalendarData(datestampsToReload);
    }
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