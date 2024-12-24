import { MMKV } from 'react-native-mmkv';
import { Event } from '../types';
import { StorageIds } from '../../../enums';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import { generateSortIdByTimestamp, getNextSevenDayTimestamps, handleTimestamp, isWeekday } from '../utils';
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
    storage.set(getPlannerStorageKey(plannerId), JSON.stringify(newPlanner));
};

/**
 * Fetches the primary calendar for this device and returns its ID.
 * @returns - the ID of the primary calendar
 */
const getPrimaryCalendarId = async (): Promise<string> => {

    // Ensure access to the device calendar
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            throw new Error('Access denied to calendars.');
        }
    }

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
        id: '1', // temporary id -> will be overwritten
        value: calendarEvent.title,
        sortId: 1, // temporary sort id -> will be overwritten
        plannerId,
        timeConfig: {
            appleId: calendarEvent.id,
            startDate: calendarEvent.startDate,
            isAppleEvent: true,
            endDate: calendarEvent.endDate ?? endDate,
            allDay: calendarEvent.allDay ?? false
        },
        status: ItemStatus.STATIC
    }));
};

/**
 * Builds a new event for the given planner ID representing a recurring weekday event.
 * @param recurringEvent 
 * @param plannerId 
 * @returns - the new event
 */
const generateRecurringEventRecord = (recurringEvent: Event, plannerId: string): Event => {
    const newEvent = {
        ...recurringEvent,
        id: uuid.v4(),
        plannerId,
        recurringConfig: {
            recurringId: recurringEvent.id
        },
        sortId: 1
    };
    if (recurringEvent.timeConfig) {
        const startTime = handleTimestamp(plannerId, recurringEvent.timeConfig.startDate);
        const endTime = handleTimestamp(plannerId, recurringEvent.timeConfig.endDate);
        const newTimeConfig = {
            allDay: false,
            startDate: startTime,
            endDate: endTime,
            isAppleEvent: false
        }
        newEvent.timeConfig = newTimeConfig;
    }
    return newEvent;
};

/**
 * Builds a new event for the given planner ID representing an event from the device calendar.
 * @param calendarEvent 
 * @param plannerId 
 * @returns 
 */
const generateCalendarEventRecord = (calendarEvent: Event, plannerId: string): Event => ({
    ...calendarEvent,
    id: uuid.v4(),
    plannerId,
    sortId: 1,
});

/**
 * Syncs a calendar 
 * @param linkedPlanner 
 * @param plannerId 
 * @returns 
 */
const syncPlanners = (linkedPlanner: Event[], currentPlanner: Event[], plannerId: string) => {
    const isCalendar = plannerId !== RECURRING_WEEKDAY_PLANNER;

    // Loop over the existing planner, removing any linked events that no longer exist
    // in the new linked planner. All linked events will also be updated to reflect the
    // linked planner.
    const newPlanner = currentPlanner.reduce<Event[]>((accumulator, currentEvent) => {

        // This event isn't related to the linked planner -> keep it
        if (
            (isCalendar && !currentEvent.timeConfig?.isAppleEvent) ||
            (!isCalendar && !currentEvent.recurringConfig)
        ) {
            return [...accumulator, currentEvent];
        }

        // This event is linked to the planner and still exists -> update it
        const newRecurringEvent = linkedPlanner.find(event =>
            (!isCalendar && event.id === currentEvent.recurringConfig?.recurringId) ||
            (isCalendar && event.timeConfig?.appleId === currentEvent.timeConfig?.appleId)
        );
        if (newRecurringEvent) {
            return [...accumulator, { ...newRecurringEvent, sortId: currentEvent.sortId, id: currentEvent.id }];
        }

        // This event is linked to the planner and has been removed -> delete it
        return [...accumulator];

    }, []);

    // Find any new events in the linked planner and add these to the new planner
    linkedPlanner.forEach(linkedEvent => {
        if (!newPlanner.find(existingNewEvent =>
            (!isCalendar && existingNewEvent.recurringConfig?.recurringId === linkedEvent.id) ||
            (isCalendar && existingNewEvent.timeConfig?.appleId === linkedEvent.id)
        )) {
            const newEvent = isCalendar ?
                generateCalendarEventRecord(linkedEvent, plannerId) :
                generateRecurringEventRecord(linkedEvent, plannerId);
            newEvent.sortId = generateSortIdByTimestamp(linkedEvent, newPlanner);
            newPlanner.push(newEvent);
        }
    })
    return newPlanner;
}

/**
 * Builds a planner for the given ID out of the storage, calendar, and recurring weekly planner.
 * @param plannerId 
 */
export const buildPlanner = async (plannerId: string): Promise<Event[]> => {
    // TODO: delete any planners that exist in the past

    let planner = getPlannerFromStorage(plannerId);

    // Return the recurring weekday planner
    if (plannerId === RECURRING_WEEKDAY_PLANNER)
        return planner;

    // Sync the planner with the recurring weekday planner
    if (isWeekday(plannerId)) {
        const recurringPlanner = await buildPlanner(RECURRING_WEEKDAY_PLANNER);
        planner = syncPlanners(recurringPlanner, planner, plannerId);
    }

    // Sync the planner with the apple calendar
    const calendarEvents = await getCalendarEvents(plannerId);
    planner = syncPlanners(calendarEvents, planner,  plannerId);

    // Sort the planner and return
    planner.sort((a, b) => a.sortId - b.sortId);
    return planner;
};

/**
 * Creates or updates an event. Persists to the device calendar if needed.
 * @param newEvent 
 * @returns - the newly generated event
 */
export const persistEvent = async (event: Event): Promise<Event> => {
    let newPlanner = await buildPlanner(event.plannerId);
    let newEvent = { ...event };

    // The event is a calendar event -> sync the calendar
    if (newEvent.timeConfig?.isAppleEvent) {
        const calendarEventDetails = {
            calendarId: await getPrimaryCalendarId(),
            title: newEvent.value,
            startDate: newEvent.timeConfig.startDate,
            endDate: newEvent.timeConfig.endDate,
            allDay: newEvent.timeConfig.allDay,
            id: newEvent.timeConfig.appleId
        };
        newEvent = {
            ...newEvent,
            timeConfig: {
                ...newEvent.timeConfig,
                appleId: await RNCalendarEvents.saveEvent(newEvent.value, calendarEventDetails)
            }
        }
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

    // The event is an apple event -> remove from the calendar
    if (eventToDelete.timeConfig?.isAppleEvent && eventToDelete.timeConfig.appleId) {


        // TODO: dont delete if the event is from today


        await getPrimaryCalendarId();
        await RNCalendarEvents.removeEvent(eventToDelete.timeConfig.appleId);
    }

    //  The event is a recurring event -> remove from upcoming planners
    if (eventToDelete.plannerId === RECURRING_WEEKDAY_PLANNER) {
        const nextSevenDays = getNextSevenDayTimestamps();
        nextSevenDays.map(plannerId => {
            let upcomingPlanner = getPlannerFromStorage(plannerId);
            const deprecatedEventIndex = upcomingPlanner.findIndex(event => eventToDelete.id === event.id);
            if (deprecatedEventIndex !== -1) {
                upcomingPlanner = upcomingPlanner.splice(deprecatedEventIndex, 1);
                savePlannerToStorage(plannerId, upcomingPlanner);
            }
        })
    }

    // Delete the event
    const eventIndex = newPlanner.findIndex(existingEvent => existingEvent.id === eventToDelete.id);
    if (eventIndex !== -1)
        newPlanner = newPlanner.splice(eventIndex, 1);
    savePlannerToStorage(eventToDelete.plannerId, newPlanner);
};