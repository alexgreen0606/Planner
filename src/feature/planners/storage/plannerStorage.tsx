import { MMKV } from 'react-native-mmkv';
import { Event } from '../types';
import { StorageIds } from '../../../enums';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import {
    generateSortIdByTimestamp,
    timeValueToIso,
    isTimestampWeekday,
    isTimestampValid,
    generateTodayTimestamp,
    isoToTimeValue,
    generateTomorrowTimestamp
} from '../utils';
import RNCalendarEvents from "react-native-calendar-events";
import { ItemStatus } from '../../../foundation/sortedLists/enums';
import { uuid } from 'expo-modules-core';

const storage = new MMKV({ id: StorageIds.PLANNER_STORAGE });
export const getPlannerStorageKey = (plannerId: string) => `PLANNERS_${plannerId}`;

/**
 * Fetches the planner with the given ID from storage.
 * @param plannerId 
 */
const getPlannerFromStorage = (plannerId: string): Event[] => {
    const eventsString = storage.getString(getPlannerStorageKey(plannerId));
    if (eventsString)
        return JSON.parse(eventsString);

    return [];
};

/**
 * Sorts a planner and saves it to storage.
 * @param plannerId
 * @param newPlanner
 */
export const savePlannerToStorage = (plannerId: string, newPlanner: Event[]) => {
    newPlanner.sort((a, b) => a.sortId - b.sortId);
    if (newPlanner.some(event => event.plannerId !== plannerId)) throw new Error('All planner events must have the same plannerId.');

    storage.set(getPlannerStorageKey(plannerId), JSON.stringify(newPlanner));
};

/**
 * Deletes all the planners from before today's date.
 */
const deletePastPlanners = () => {
    const allStorageKeys = storage.getAllKeys();
    allStorageKeys.map(key => {
        const timestamp = key.replace('PLANNERS_', '');
        if (isTimestampValid(timestamp) && (new Date(timestamp) < new Date(generateTodayTimestamp()))) {
            storage.delete(key);
        }
    });
};

/**
 * Grants access to the device calendar.
 */
const getCalendarAccess = async () => {
    // Ensure access to the device calendar
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            throw new Error('Access denied to calendars.');
        }
    }
}

/**
 * Fetches the primary calendar for this device and returns its ID.
 * @returns - the ID of the primary calendar
 */
const getPrimaryCalendarId = async (): Promise<string> => {

    await getCalendarAccess();

    // Load in the primary calendar
    const calendars = await RNCalendarEvents.findCalendars();
    const primaryCalendar = calendars.find(calendar => calendar.isPrimary);
    if (!primaryCalendar) throw new Error('Primary calendar does not exist!');

    // Return the calendar's ID
    return primaryCalendar.id;
};

/**
 * Fetches a calendar from the device representing all events for the given planner ID.
 * @param plannerId 
 */
const getCalendarEvents = async (plannerId: string): Promise<Event[]> => {
    const startDate = new Date(`${plannerId}T00:00:00`).toISOString();
    const endDate = new Date(`${plannerId}T23:59:59`).toISOString();

    // Load in the calendar events and format them into a planner
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [await getPrimaryCalendarId()]);
    return calendarEvents.map(calendarEvent => ({
        id: calendarEvent.id,
        value: calendarEvent.title,
        sortId: 1, // temporary sort id -> will be overwritten
        plannerId,
        timeConfig: {
            calendarEventId: calendarEvent.id,
            startTime: isoToTimeValue(calendarEvent.startDate),
            endTime: isoToTimeValue(calendarEvent.endDate ?? endDate),
            isCalendarEvent: true,
            allDay: calendarEvent.allDay ?? false
        },
        status: ItemStatus.STATIC
    }));
};

/**
 * Fetches the first holiday for the given timestamp.
 * @param timestamp - YYYY-MM-DD
 */
export const getHoliday = async (timestamp: string): Promise<string | undefined> => {

    await getCalendarAccess();
    // Load in the primary calendar
    const calendars = await RNCalendarEvents.findCalendars();

    const holidayCalendar = calendars.find(calendar => calendar.title === 'US Holidays');

    if (!holidayCalendar) throw new Error('Holiday calendar does not exist!');

    const startDate = new Date(`${timestamp}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamp}T23:59:59`).toISOString();

    // Load in the calendar events and format them into a planner
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [holidayCalendar.id]);

    return calendarEvents[0]?.title;
};

/**
 * Fetches the first birthday for the given timestamp.
 * @param timestamp - YYYY_MM_DD
 */
export const getBirthday = async (timestamp: string): Promise<string | undefined> => {

    await getCalendarAccess();

    const calendars = await RNCalendarEvents.findCalendars();

    const birthdayCalendar = calendars.find(calendar => calendar.title === 'Birthdays');

    if (!birthdayCalendar) throw new Error('Birthday calendar does not exist!');

    const startDate = new Date(`${timestamp}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamp}T23:59:59`).toISOString();

    // Load in the calendar events and format them into a planner
    const birthdayEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [birthdayCalendar.id]);

    return birthdayEvents[0]?.title;
};

/**
 * Syncs an existing planner with a calendar. Calendars have final say on the state of the events.
 * @param calendar - the events to sync within the existing planner
 * @param currentPlanner - the planner being updated
 * @param currentPlannerId
 * @returns - the new planner synced with the calendar
 */
const syncPlannerWithCalendar = (calendar: Event[], currentPlanner: Event[], currentPlannerId: string) => {

    console.log('--------------------')
    console.log('Syncing with Calendar')
    console.log(currentPlanner, 'current planner')
    console.log(calendar, 'syncing with')
    // Loop over the existing planner, removing any calendar events that no longer exist
    // in the new device calendar. All existing linked events will also be updated to reflect the
    // calendar.
    const newPlanner = currentPlanner.reduce<Event[]>((accumulator, currentEvent) => {

        // This event isn't related to the calendar -> keep it
        if (!currentEvent.timeConfig?.isCalendarEvent) {
            console.log(currentEvent, 'keeping this event -> it is not a calendar event')
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
            console.log(updatedEvent, 'updating this event')
            return updatedPlanner;
        }

        // This event is linked to the calendar but has been removed -> delete it
        console.log(currentEvent, 'deleting this event -> no longer in linked planner')
        return [...accumulator];

    }, []);

    // Find any new events in the calendar and add these to the new planner
    calendar.forEach(calEvent => {
        if (!newPlanner.find(existingEvent => existingEvent.timeConfig?.calendarEventId === calEvent.id)) {

            // Generate a new record to represent the calendar event
            const newEvent = {
                ...calEvent,
                id: uuid.v4(),
                plannerId: currentPlannerId,
                timeConfig: calEvent.timeConfig
            };

            // Add the new event to the planner and generate its position within the list
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTimestamp(newEvent, newPlanner);
        }
    })

    console.log(newPlanner, 'updated planner')
    console.log('--------------------')
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
const syncPlannerWithRecurring = (recurringPlanner: Event[], currentPlanner: Event[], currentPlannerId: string) => {

    console.log('--------------------')
    console.log('Syncing with recurring.')
    console.log(currentPlanner, 'current planner')
    console.log(recurringPlanner, 'syncing with')

    // Loop over the existing planner, removing any recurring events that no longer exist. 
    // All linked events will also be updated to reflect the linked planner.
    const newPlanner = currentPlanner.reduce<Event[]>((accumulator, currentEvent) => {

        // This event isn't recurring -> keep it
        if (!currentEvent.recurringConfig || currentEvent.recurringConfig?.deleted) {
            console.log(currentEvent, 'keeping this event -> it is custom')
            return [...accumulator, currentEvent];
        }

        // This event is recurring and still exists -> update it
        const linkedEvent = recurringPlanner.find(recEvent =>
            recEvent.id === currentEvent.recurringConfig?.recurringId
        );
        if (linkedEvent) {

            // Generate an updated record of the recurring event
            const updatedEvent = {
                ...linkedEvent,
                plannerId: currentPlannerId,
            };

            // Persist the event's time if specified
            if (currentEvent.timeConfig) {
                updatedEvent.timeConfig = currentEvent.timeConfig;
            }

            // Add the updated event to the current planner
            const updatedPlanner = [...accumulator, updatedEvent];

            // Generate the updated event's new position in the list
            updatedEvent.sortId = generateSortIdByTimestamp(updatedEvent, updatedPlanner);
            console.log(updatedEvent, 'updating this event')
            return updatedPlanner;
        }

        // This event is linked to the planner and has been removed -> delete it
        console.log(currentEvent, 'deleting this event -> no longer in linked planner')
        return [...accumulator];

    }, []);

    // Find any new events in the linked planner and add these to the new planner
    recurringPlanner.forEach(recEvent => {
        if (!newPlanner.find(existingEvent => existingEvent.recurringConfig?.recurringId === recEvent.id)) {

            // Generate a new record of the recurring event
            const newEvent = {
                ...recEvent,
                id: uuid.v4(),
                plannerId: currentPlannerId,
            };

            // Add the new event to the planner and generate its position within the list
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTimestamp(newEvent, newPlanner);
        }
    })

    console.log(newPlanner, 'updated planner')
    console.log('--------------------')
    return newPlanner;
}

/**
 * Builds a planner for the given ID out of the storage, calendar, and recurring weekly planner.
 * @param plannerId 
 */
export const buildPlanner = async (plannerId: string): Promise<Event[]> => {

    // Keep the storage clean by deleting any past planners
    deletePastPlanners();

    let planner = getPlannerFromStorage(plannerId);

    // Return the recurring weekday planner
    if (plannerId === RECURRING_WEEKDAY_PLANNER)
        return planner;

    // Sync the planner with the recurring weekday planner
    if (isTimestampWeekday(plannerId) && plannerId === generateTomorrowTimestamp()) {
        const recurringPlanner = await buildPlanner(RECURRING_WEEKDAY_PLANNER);
        planner = syncPlannerWithRecurring(recurringPlanner, planner, plannerId);
    }

    // Sync the planner with the apple calendar
    const calendarEvents = await getCalendarEvents(plannerId);
    planner = syncPlannerWithCalendar(calendarEvents, planner, plannerId);

    // Sort the planner 
    planner.sort((a, b) => a.sortId - b.sortId);

    // Save the planner now that external events have been linked
    savePlannerToStorage(plannerId, planner);

    return planner;
};

/**
 * Creates or updates an event. Persists to the device calendar if needed.
 * @param newEvent 
 * @returns - the newly generated event
 */
export const persistEvent = async (event: Event): Promise<Event> => {
    let newPlanner = getPlannerFromStorage(event.plannerId);
    let newEvent = { ...event };

    // The event is a calendar event -> sync the calendar
    if (newEvent.timeConfig?.isCalendarEvent) {
        const calendarEventDetails = {
            calendarId: await getPrimaryCalendarId(),
            title: newEvent.value,
            startDate: timeValueToIso(event.plannerId, newEvent.timeConfig.startTime),
            endDate: timeValueToIso(newEvent.plannerId, newEvent.timeConfig.endTime),
            allDay: newEvent.timeConfig.allDay,
            id: newEvent.timeConfig.calendarEventId
        };
        newEvent = {
            ...newEvent,
            timeConfig: {
                ...newEvent.timeConfig,
                calendarEventId: await RNCalendarEvents.saveEvent(newEvent.value, calendarEventDetails)
            }
        }
    }

    // Update the list's event if it already exists
    const existingIndex = newPlanner.findIndex(existingEvent => existingEvent.id === event.id)
    if (existingIndex !== -1) {
        newPlanner.splice(existingIndex, 1, newEvent);
        savePlannerToStorage(newEvent.plannerId, newPlanner);
        return newEvent;
    }

    // Save the new event
    newPlanner.push(newEvent);
    savePlannerToStorage(newEvent.plannerId, newPlanner);
    return newEvent;
};

/**
 * Deletes an event. Removes it from the device calendar if needed.
 * @param eventToDelete 
 */
export const deleteEvent = async (eventToDelete: Event) => {
    let newPlanner = getPlannerFromStorage(eventToDelete.plannerId);

    // The event is an apple event in the future -> remove from the calendar
    if (
        eventToDelete.timeConfig?.isCalendarEvent &&
        eventToDelete.timeConfig.calendarEventId &&
        eventToDelete.plannerId !== generateTodayTimestamp()
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
            savePlannerToStorage(eventToDelete.plannerId, newPlanner);
            return;
        }
    }

    // Delete the event from storage
    const eventIndex = newPlanner.findIndex(existingEvent => existingEvent.id === eventToDelete.id);
    if (eventIndex !== -1)
        newPlanner.splice(eventIndex, 1);

    savePlannerToStorage(eventToDelete.plannerId, newPlanner);
};