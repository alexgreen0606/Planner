import { MMKV } from 'react-native-mmkv';
import { Event } from '../types';
import { StorageIds } from '../../../enums';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import { getNextSevenDayTimestamps, isTimestampWeekday, isValidTimestamp } from '../utils';
import RNCalendarEvents from "react-native-calendar-events";
import { ItemStatus } from '../../../foundation/sortedLists/enums';
import { generateSortId } from '../../../foundation/sortedLists/utils';
import { uuid } from 'expo-modules-core';

// Initialize MMKV storage
const storage = new MMKV({ id: StorageIds.PLANNER_STORAGE });

export const getPlannerStorageKey = (timestamp: string) => {
    return `PLANNERS_${timestamp}`;
}

const getLocalPlanner = (plannerId: string): Event[] => {
    const eventsString = storage.getString(getPlannerStorageKey(plannerId));
    if (eventsString)
        return JSON.parse(eventsString);

    return [];
}

export const getPlanner = async (plannerId: string): Promise<Event[]> => {
    // TODO: delete any planners that exist in the past

    let planner: Event[] = getLocalPlanner(plannerId);

    // Return the recurring weekday planner
    if (plannerId === RECURRING_WEEKDAY_PLANNER)
        return planner;

    // Sync the planner with the recurring weekday planner
    if (isTimestampWeekday(plannerId)) {
        const recurringPlanner = await getPlanner(RECURRING_WEEKDAY_PLANNER);
        planner = syncPlanners(planner, recurringPlanner, false);
    }

    // Sync the planner with the apple calendar
    const calendarEvents = await getCalendarEvents(plannerId);
    planner = syncPlanners(planner, calendarEvents, true);

    // Sort the planner and return
    planner.sort((a, b) => a.sortId - b.sortId);
    return planner;
}

/**
 * Finds a spot in the list for a new event where it will be 
 * @param event 
 * @param planner 
 * @returns 
 */
const findTimedEventSortId = (event: Event, planner: Event[]) => {
    if (!event.timeConfig) return event.sortId;

    planner.sort((a, b) => a.sortId - b.sortId);

    // Find the first event whose startDate is after or equal to the event's startDate
    const newEventChildIndex = planner.findIndex(
        (existingEvent) =>
            event.timeConfig &&
            existingEvent.timeConfig?.startDate &&
            new Date(event.timeConfig.startDate) <= new Date(existingEvent.timeConfig.startDate)
    );

    if (newEventChildIndex !== -1) {
        let newParentSortId = -1;
        if (newEventChildIndex > 0)
            newParentSortId = planner[newEventChildIndex - 1].sortId;
        return generateSortId(newParentSortId, planner);
    }

    // If no such event exists, return the event's original sortId
    return event.sortId;
};


/**
 * Creates a new event with a specified time. 
 * @param newEvent 
 * @returns - the id of the new event
 */
export const createEvent = async (event: Event): Promise<Event> => {
    let newPlanner = await getPlanner(event.plannerId);
    let newEvent = { ...event };

    // The event has a specified time
    if (!!newEvent.timeConfig) {

        // The event is an apple event -> sync the calendar
        if (newEvent.timeConfig.isAppleEvent) {
            const calendarEventDetails = {
                calendarId: await getPrimaryCalendarId(),
                title: newEvent.value,
                startDate: newEvent.timeConfig.startDate,
                endDate: newEvent.timeConfig.endDate,
                allDay: newEvent.timeConfig.allDay,
                id: newEvent.timeConfig.appleId
            };
            const appleEventId = await RNCalendarEvents.saveEvent(newEvent.value, calendarEventDetails);
            newEvent = {
                ...newEvent,
                timeConfig: {
                    ...newEvent.timeConfig,
                    appleId: appleEventId
                }
            }
        }

        // Move the new event so it doesn't break the logic of the event times
        const newSortId = findTimedEventSortId(newEvent, newPlanner);
        newEvent.sortId = newSortId;
    }

    // Add the new event
    newPlanner.push(newEvent);

    // Sort
    newPlanner.sort((a, b) => a.sortId - b.sortId);

    // Save
    savePlanner(newEvent.plannerId, newPlanner);

    return newEvent;
}

const syncPlanners = (existingPlanner: Event[], linkedPlanner: Event[], isCalendar: boolean): Event[] => {
    // Sync the planner with the recurring weekday planner
    const newPlanner = existingPlanner.reduce<Event[]>((accumulator, currentEvent) => {
        const linkedEvent = linkedPlanner.find(event => (isCalendar ? event.timeConfig?.appleId : event.recurringConfig?.recurringId) === currentEvent.id);
        if (linkedEvent) { // the event is recurring and hasn't been customized
            return [...accumulator, { ...linkedEvent, sortId: currentEvent.sortId }];
        }

        // Exclude any events linked to a calendar that have now been deleted
        if (currentEvent.timeConfig?.isAppleEvent && isCalendar && !linkedEvent) {
            return [...accumulator];
        }

        // the event is custom, so keep it
        return [...accumulator, currentEvent];
    }, []);

    // Add any new events from the linked planner -> only for calendar events
    if (isCalendar)
        linkedPlanner.forEach(linkedEvent => {
            if (!newPlanner.find(event => event.timeConfig?.appleId === linkedEvent.id))
                newPlanner.push({
                    ...linkedEvent,
                    sortId: findTimedEventSortId(linkedEvent, newPlanner)
                });
        });

    return newPlanner;
};

const getCalendarEvents = async (timestamp: string): Promise<Event[]> => {
    if (!isValidTimestamp(timestamp)) return [];

    const localStart = new Date(`${timestamp}T00:00:00`).toISOString();
    const localEnd = new Date(`${timestamp}T23:59:59`).toISOString();

    const calendarEvents = await RNCalendarEvents.fetchAllEvents(localStart, localEnd, [await getPrimaryCalendarId()]);

    return calendarEvents.map(event => ({
        id: uuid.v4(),
        value: event.title,
        sortId: 1,
        plannerId: timestamp,
        timeConfig: {
            appleId: event.id,
            startDate: event.startDate ?? localStart,
            isAppleEvent: true,
            endDate: event.endDate ?? localEnd,
            allDay: event.allDay ?? false
        },
        status: ItemStatus.STATIC
    }))
}

export const savePlanner = (plannerId: string, newPlanner: Event[]) => {
    storage.set(getPlannerStorageKey(plannerId), JSON.stringify(newPlanner));
}

const getPrimaryCalendarId = async (): Promise<string> => {
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            throw new Error('Access denied to calendars.');
        }
    }

    const calendars = await RNCalendarEvents.findCalendars();
    const primaryCalendar = calendars.find(calendar => calendar.isPrimary);

    if (!primaryCalendar) throw new Error('Primary calendar does not exist!');

    return primaryCalendar.id;
}

export const deleteEvent = async (event: Event) => {
    let newPlanner = getLocalPlanner(event.plannerId);

    // The event is an apple event -> remove from the calendar
    if (event.timeConfig?.isAppleEvent && event.timeConfig.appleId) {


        // TODO: dont delete if the event is from today


        await getPrimaryCalendarId();
        await RNCalendarEvents.removeEvent(event.timeConfig.appleId);
    }

    //  The event is a recurring event -> remove from upcoming planners
    if (event.recurringConfig) {
        const nextSevenDays = getNextSevenDayTimestamps();
        nextSevenDays.map(plannerId => {
            let upcomingPlanner = getLocalPlanner(plannerId);
            const deprecatedEventIndex = upcomingPlanner.findIndex(event => event.recurringConfig?.recurringId === event.id);
            if (deprecatedEventIndex !== -1) {
                upcomingPlanner = upcomingPlanner.splice(deprecatedEventIndex, 1);
                savePlanner(plannerId, upcomingPlanner);
            }
        })
    }

    // Delete the event
    const eventIndex = newPlanner.findIndex(existingEvent => existingEvent.id === event.id);
    if (eventIndex !== -1)
        newPlanner = newPlanner.splice(eventIndex, 1);
    savePlanner(event.plannerId, newPlanner);
}





export const createRecurringEvent = () => {

}

export const updateRecurringEvent = () => {

}