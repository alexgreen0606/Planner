import { MMKV } from 'react-native-mmkv';
import RNCalendarEvents from "react-native-calendar-events";
import { uuid } from 'expo-modules-core';
import { isItemTextfield, ItemStatus } from '../../../foundation/sortedLists/utils';
import { 
    Event, 
    generateSortIdByTimestamp, 
    generateTodayTimestamp, 
    generateTomorrowTimestamp, 
    isTimestampValid, 
    isTimestampWeekday, 
    PLANNER_STORAGE_ID, 
    RECURRING_WEEKDAY_PLANNER_KEY, 
    timeValueToIso 
} from '../timeUtils';
import { getCalendarEvents, getPrimaryCalendarId } from '../calendarUtils';

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * Fetches the planner with the given ID from storage.
 */
function getPlannerFromStorage(plannerId: string): Event[] {
    const eventsString = storage.getString(plannerId);
    if (eventsString)
        return JSON.parse(eventsString);
    return [];
};

/**
 * Saves a planner to storage.
 */
function savePlannerToStorage(plannerId: string, newPlanner: Event[]) {
    storage.set(plannerId, JSON.stringify(newPlanner));
};

/**
 * Deletes all the planners from before today's date.
 */
function deletePastPlanners() {
    // TODO: grab yesterday's events and add them to today if any exist
    const allStorageKeys = storage.getAllKeys();
    allStorageKeys.map(timestamp => {
        if (isTimestampValid(timestamp) && (new Date(timestamp) < new Date(generateTodayTimestamp()))) {
            storage.delete(timestamp);
        }
    });
};

/**
 * Syncs an existing planner with a calendar. Calendars have final say on the state of the events.
 * @param calendar - the events to sync within the existing planner
 * @param currentPlanner - the planner being updated
 * @param currentPlannerId
 * @returns - the new planner synced with the calendar
 */
function syncPlannerWithCalendar(calendar: Event[], currentPlanner: Event[], currentPlannerId: string) {

    // Loop over the existing planner, removing any calendar events that no longer exist
    // in the new device calendar. All existing linked events will also be updated to reflect the
    // calendar.
    const newPlanner = currentPlanner.reduce<Event[]>((accumulator, currentEvent) => {

        // This event isn't related to the calendar -> keep it
        if (!currentEvent.timeConfig?.isCalendarEvent) {
            return [...accumulator, currentEvent];
        }

        // This event is linked to the calendar and still exists -> update it
        const linkedEvent = calendar.find(calEvent => calEvent.id === currentEvent.timeConfig?.calendarEventId);
        if (linkedEvent) {

            // Generate an updated record of the calendar event
            const updatedEvent = {
                ...currentEvent,
                timeConfig: linkedEvent.timeConfig,
                value: linkedEvent.value
            }

            // Add the updated event to the current planner
            const updatedPlanner = [...accumulator, updatedEvent];

            // Generate the updated event's new position in the list
            updatedEvent.sortId = generateSortIdByTimestamp(updatedEvent, updatedPlanner);
            return updatedPlanner;
        }

        // This event is linked to the calendar but has been removed -> delete it
        return [...accumulator];

    }, []);

    // Find any new events in the calendar and add these to the new planner
    calendar.forEach(calEvent => {
        if (!newPlanner.find(existingEvent => existingEvent.timeConfig?.calendarEventId === calEvent.id)) {

            // Generate a new record to represent the calendar event
            const newEvent = {
                ...calEvent,
                id: uuid.v4(),
                listId: currentPlannerId,
                timeConfig: calEvent.timeConfig
            };

            // Add the new event to the planner and generate its position within the list
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTimestamp(newEvent, newPlanner);
        }
    })

    return newPlanner;
}

/**
 * Syncs an existing planner with the recurring weekday planner. The recurring planner has
 * final say on the state of the events. If a recurring event is manually deleted from a planner, 
 * it will remain deleted.
 * @param recurringPlanner - the events to sync within the existing planner
 * @param currentPlanner - the planner being updated
 * @param currentPlannerId
 * @returns - the new planner synced with the recurring events
 */
function syncPlannerWithRecurring(recurringPlanner: Event[], currentPlanner: Event[], currentPlannerId: string) {

    // Build the new planner out of the recurring planner. All recurring events will prioritize the
    // recurring planner's values.
    const newPlanner = recurringPlanner.reduce<Event[]>((accumulator, recEvent) => {
        const linkedEvent = currentPlanner.find(curEvent =>
            curEvent.recurringConfig?.recurringId === recEvent.id
        );

        // This event is in the current planner -> update it
        if (linkedEvent && !linkedEvent.recurringConfig?.deleted) {
            const updatedEvent = {
                ...recEvent,
                id: linkedEvent.id,
                listId: currentPlannerId,
                status: linkedEvent.status
            };
            updatedEvent.timeConfig = linkedEvent.timeConfig ?? recEvent.timeConfig;

            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTimestamp(updatedEvent, updatedPlanner);
            return updatedPlanner;

        } else if (linkedEvent && linkedEvent.recurringConfig?.deleted) {
            // This event has been manually deleted -> keep it deleted
            return [...accumulator, linkedEvent];

            // This recurring event hasn't been added to the planner yet -> add it 
        } else {
            const newEvent = {
                ...recEvent,
                id: uuid.v4(),
                listId: currentPlannerId
            };
            const updatedPlanner = [...accumulator, newEvent];
            newEvent.sortId = generateSortIdByTimestamp(newEvent, updatedPlanner);
            return updatedPlanner;
        }
    }, []);

    // Add in any existing events that aren't recurring
    currentPlanner.forEach(curEvent => {
        // This existing event isn't recurring
        if (!newPlanner.find(newEvent => newEvent.id === curEvent.id)) {

            // This event was recurring but has been deleted from the recurring planner -> don't add it
            if (curEvent.recurringConfig) return;

            // Add the existing event
            const newEvent = {
                ...curEvent,
            }
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTimestamp(newEvent, newPlanner);
        }
    });
    return newPlanner;
}

/**
 * Builds a planner for the given ID out of the storage, calendar, and recurring weekday planner.
 */
export async function buildPlanner(plannerId: string, planner: Event[]): Promise<Event[]> {

    // Keep the storage clean by deleting any past planners
    deletePastPlanners();

    // Sync the planner with the recurring weekday planner
    if (isTimestampWeekday(plannerId) && plannerId === generateTomorrowTimestamp()) {
        const recurringPlanner = getPlannerFromStorage(RECURRING_WEEKDAY_PLANNER_KEY);
        planner = syncPlannerWithRecurring(recurringPlanner, planner, plannerId);
    }

    // Sync the planner with the apple calendar
    const calendarEvents = await getCalendarEvents(plannerId);
    planner = syncPlannerWithCalendar(calendarEvents, planner, plannerId);

    return planner.filter(event => !event.recurringConfig?.deleted && !event.timeConfig?.allDay);
};

/**
 * Creates or updates an event. Updates it in the device calendar if needed.
 * @returns - true if the item was persisted, else false
 */
export async function persistEvent(event: Event) {
    let newPlanner = getPlannerFromStorage(event.listId);
    let newEvent = { ...event, status: isItemTextfield(event) ? ItemStatus.STATIC : event.status };

    // The event is a calendar event -> sync the calendar
    if (newEvent.timeConfig?.isCalendarEvent) {
        const calendarEventDetails = {
            calendarId: await getPrimaryCalendarId(),
            title: newEvent.value,
            startDate: timeValueToIso(event.listId, newEvent.timeConfig.startTime),
            endDate: timeValueToIso(newEvent.listId, newEvent.timeConfig.endTime),
            allDay: newEvent.timeConfig.allDay,
            id: newEvent.timeConfig.calendarEventId
        };
        newEvent.timeConfig.calendarEventId = await RNCalendarEvents.saveEvent(newEvent.value, calendarEventDetails);

        // Remove the event if it is an all-day event
        if (event.timeConfig?.allDay) {
            const plannerWithoutEvent = newPlanner.filter(existingEvent => existingEvent.id !== event.id);
            savePlannerToStorage(newEvent.listId, plannerWithoutEvent);
        }
    }

    // Update the list with the new event
    const existingIndex = newPlanner.findIndex(existingEvent => existingEvent.id === event.id)
    if (existingIndex !== -1)
        newPlanner.splice(existingIndex, 1, newEvent);
    else
        newPlanner.push(newEvent);

    // Save the new planner
    savePlannerToStorage(newEvent.listId, newPlanner);
};

/**
 * Deletes an event. Removes it from the device calendar if needed.
 */
export async function deleteEvent(eventToDelete: Event) {
    let newPlanner = getPlannerFromStorage(eventToDelete.listId);

    // The event is an apple event in the future -> remove from the calendar
    if (
        eventToDelete.timeConfig?.isCalendarEvent &&
        eventToDelete.timeConfig.calendarEventId &&
        eventToDelete.listId !== generateTodayTimestamp()
    ) {
        await getPrimaryCalendarId();
        await RNCalendarEvents.removeEvent(eventToDelete.timeConfig.calendarEventId);
    }

    // The event is a recurring event -> mark it deleted
    if (eventToDelete.recurringConfig) {
        const existingEventIndex = newPlanner.findIndex(event => event.recurringConfig?.recurringId === eventToDelete.recurringConfig?.recurringId);
        if (existingEventIndex !== -1 && newPlanner[existingEventIndex].recurringConfig) {
            newPlanner[existingEventIndex].recurringConfig.deleted = true;
            newPlanner[existingEventIndex].status = ItemStatus.STATIC;
            savePlannerToStorage(eventToDelete.listId, newPlanner);
            return;
        }
    }

    // Delete the event from storage
    const eventIndex = newPlanner.findIndex(existingEvent => existingEvent.id === eventToDelete.id);
    if (eventIndex !== -1)
        newPlanner.splice(eventIndex, 1);

    savePlannerToStorage(eventToDelete.listId, newPlanner);
};