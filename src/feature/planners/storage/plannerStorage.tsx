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
import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { ItemStatus } from '../../../foundation/sortedLists/enums';
import { uuid } from 'expo-modules-core';

const storage = new MMKV({ id: StorageIds.PLANNER_STORAGE });
export const getPlannerStorageKey = (plannerId: string) => `PLANNERS_${plannerId}`;

/**
 * Fetches the planner with the given ID from storage.
 * @param plannerId 
 */
export const getPlannerFromStorage = (plannerId: string): Event[] => {
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
    return calendarEvents.filter(event => !event.allDay).map(calendarEvent => ({
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
 * TODO: Fetches the first holiday for the given timestamp.
 * @param timestamp - YYYY-MM-DD
 */
export const getHolidays = async (timestamps: string[]): Promise<Record<string, string[]>> => {

    await getCalendarAccess();
    // Load in the primary calendar
    const calendars = await RNCalendarEvents.findCalendars();

    const holidayCalendar = calendars.find(calendar => calendar.title === 'US Holidays');

    if (!holidayCalendar) throw new Error('Holiday calendar does not exist!');

    // Find the overall date range
    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [holidayCalendar.id]);

    // Group events by date
    const holidayMap: Record<string, string[]> = timestamps.reduce((map, timestamp) => {
        const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
        map[timestamp] = calendarEvents
            .filter(event => new Date(event.startDate).toISOString().split('T')[0] === dateKey)
            .map(event => event.title);
        return map;
    }, {} as Record<string, string[]>);

    return holidayMap;
};

/**
 * Fetches the first birthday for the given timestamp.
 * @param timestamp - YYYY_MM_DD
 */
export const getBirthdays = async (timestamps: string[]): Promise<Record<string, string[]>> => {

    await getCalendarAccess();

    const calendars = await RNCalendarEvents.findCalendars();

    const birthdayCalendar = calendars.find(calendar => calendar.title === 'Birthdays');

    if (!birthdayCalendar) throw new Error('Birthday calendar does not exist!');

    // Find the overall date range
    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [birthdayCalendar.id]);

    // Group events by date
    const birthdayMap: Record<string, string[]> = timestamps.reduce((map, timestamp) => {
        const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
        map[timestamp] = calendarEvents
            .filter(event => new Date(event.startDate).toISOString().split('T')[0] === dateKey)
            .map(event => event.title);
        return map;
    }, {} as Record<string, string[]>);

    return birthdayMap;
};

// TODO: comment
// export const getAllDayEvents = async (timestamps: string[]): Promise<Record<string, string[]>> => {

//     await getCalendarAccess();
//     const primaryCalendarId = await getPrimaryCalendarId();

//     // Find the overall date range
//     const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
//     const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();

//     // Fetch all events in the date range
//     const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [primaryCalendarId]);

//     console.log(calendarEvents.length, '')

//     // Group events by date
//     const allDayMap: Record<string, string[]> = timestamps.reduce((map, timestamp) => {
//         const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
//         map[timestamp] = calendarEvents
//             .filter(event => event.allDay && new Date(event.startDate).toISOString().split('T')[0] === dateKey)
//             .map(event => event.title);
//         console.log(map)
//         return map;
//     }, {} as Record<string, string[]>);

//     return allDayMap;
// };
export const getAllDayEvents = async (timestamps: string[]): Promise<Record<string, string[]>> => {
    await getCalendarAccess();
    const primaryCalendarId = await getPrimaryCalendarId();

    // Find the overall date range
    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [primaryCalendarId]);

    // Group events by date
    const allDayMap: Record<string, string[]> = timestamps.reduce((map, timestamp) => {
        const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
        map[timestamp] = calendarEvents
            .filter(event => event.allDay && isEventOnDate(event, dateKey))
            .map(event => event.title);
        return map;
    }, {} as Record<string, string[]>);

    return allDayMap;
};

// Helper function to determine if an event falls on a specific date
const isEventOnDate = (event: CalendarEventReadable, dateKey: string): boolean => {
    const eventStart = new Date(event.startDate).toISOString().split('T')[0];

    // Adjust the end date for all-day events to make it exclusive
    let eventEnd = new Date(event.endDate);
    if (event.allDay) {
        eventEnd.setDate(eventEnd.getDate() - 1);
    }
    eventEnd = eventEnd.toISOString().split('T')[0];

    return dateKey >= eventStart && dateKey <= eventEnd;
};




/**
 * Syncs an existing planner with a calendar. Calendars have final say on the state of the events.
 * @param calendar - the events to sync within the existing planner
 * @param currentPlanner - the planner being updated
 * @param currentPlannerId
 * @returns - the new planner synced with the calendar
 */
const syncPlannerWithCalendar = (calendar: Event[], currentPlanner: Event[], currentPlannerId: string) => {

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
                plannerId: currentPlannerId,
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
const syncPlannerWithRecurring = (recurringPlanner: Event[], currentPlanner: Event[], currentPlannerId: string) => {

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
                plannerId: currentPlannerId,
            };
            updatedEvent.timeConfig = linkedEvent.timeConfig ?? recEvent.timeConfig;

            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTimestamp(updatedEvent, updatedPlanner);
            return updatedPlanner;

            // This event has been manually deleted -> keep it (it won't be displayed in the UI)
        } else if (linkedEvent && linkedEvent.recurringConfig?.deleted) {
            return [...accumulator, linkedEvent];

            // This recurring event hasn't been added to the planner yet -> add it 
        } else {
            const newEvent = {
                ...recEvent,
                id: uuid.v4(),
                plannerId: currentPlannerId
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

    return planner.filter(event => !event.recurringConfig?.deleted && !event.timeConfig?.allDay);
};

/**
 * Creates or updates an event. Persists to the device calendar if needed.
 * @param newEvent 
 * @returns - the newly generated event
 */
export const persistEvent = async (event: Event) => {
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
        newEvent.timeConfig = {
            ...newEvent.timeConfig,
            calendarEventId: await RNCalendarEvents.saveEvent(newEvent.value, calendarEventDetails)
        }
    }

    // Update the list with the new event
    const existingIndex = newPlanner.findIndex(existingEvent => existingEvent.id === event.id)
    if (existingIndex !== -1) {
        newPlanner.splice(existingIndex, 1, newEvent);
    } else {
        newPlanner.push(newEvent);
    }

    // Save the new planner
    savePlannerToStorage(newEvent.plannerId, newPlanner);
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