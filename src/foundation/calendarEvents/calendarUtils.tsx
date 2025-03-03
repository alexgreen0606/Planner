import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { datestampToMidnightDate, generateSortIdByTime, timeValueToIso } from "./timestampUtils";
import { EventChipProps } from "./components/EventChip";
import { uuid } from "expo-modules-core";
import { CalendarDetails, PlannerEvent, RecurringEvent } from "./types";
import { ItemStatus } from "../sortedLists/types";

function getCalendarIcon(calendarName: string) {
    switch (calendarName) {
        case 'US Holidays':
            return 'globe';
        case 'Birthdays':
            return 'birthday';
        case 'Deadlines':
            return 'alert';
        default:
            return 'megaphone';
    }
}

/**
 * TODO comment
 * @param event 
 * @param datestamp 
 * @returns 
 */
function validateEventChip(event: CalendarEventReadable, datestamp: string): boolean {
    if (!event.endDate) throw new Error('Event has no end date!');
    const dateStart = datestampToMidnightDate(datestamp);
    const eventEnd = new Date(event.endDate);
    return dateStart <= eventEnd;
};

/**
 * TODO comment
 * @param event 
 * @param datestamp 
 * @returns 
 */
function validateEvent(event: CalendarEventReadable, datestamp: string): boolean {
    if (event.allDay) return false;
    if (!event.endDate) throw new Error('Event has no end date!');
    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    return dateStart < eventStart || dateEnd > eventEnd;
};

/**
 * TODO comment
 * @param event 
 * @param datestamp 
 * @returns 
 */
function sanitizeCalendarEvent(event: CalendarEventReadable, datestamp: string): PlannerEvent {
    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate!);
    const isEndEvent = dateEnd > eventEnd && eventStart < dateStart;

    return {
        id: event.id,
        value: event.title,
        sortId: 1, // temporary sort id -> will be overwritten
        listId: datestamp,
        timeConfig: {
            startTime: event.startDate,
            endTime: event.endDate!,
            allDay: false,
            isEndEvent
        },
        status: ItemStatus.STATIC
    };
};

/**
 * Grants access to the device calendar.
 */
export async function getCalendarAccess() {
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            throw new Error('Access denied to calendars.'); // TODO: just skip calendars if denied?
        }
    }
};

/**
 * Fetches the primary calendar ID for this device.
 */
export async function getPrimaryCalendarDetails(): Promise<CalendarDetails> {
    await getCalendarAccess();
    const calendars = await RNCalendarEvents.findCalendars();
    const primaryCalendar = calendars.find(calendar => calendar.isPrimary);
    if (!primaryCalendar) throw new Error('Primary calendar does not exist!');
    return { id: primaryCalendar.id, color: primaryCalendar.color, iconType: 'megaphone' };
};

/**
 * Builds a map of all calendar IDs to calendar colors.
 */
export async function generateCalendarDetailsMap(): Promise<Record<string, CalendarDetails>> {
    await getCalendarAccess();
    const calendars = await RNCalendarEvents.findCalendars();
    const idToColorMap: Record<string, CalendarDetails> = {};
    calendars.forEach(calendar => {
        idToColorMap[calendar.id] = { id: calendar.id, color: calendar.color, iconType: getCalendarIcon(calendar.title) };
    });
    return idToColorMap;
};

/**
 * Fetches all events from the device calendar for the given date.
 * TODO: validate the events as needed
 * @param datestamp - YYYY-MM-DD
 */
export async function getCalendarEvents(datestamp: string): Promise<PlannerEvent[]> {
    const startDate = new Date(`${datestamp}T00:00:00`).toISOString();
    const endDate = new Date(`${datestamp}T23:59:59`).toISOString();
    const calendarColorMap = await generateCalendarDetailsMap();

    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, Object.keys(calendarColorMap));
    return calendarEvents
        .filter(calEvent => validateEvent(calEvent, datestamp))
        .map(calendarEvent => sanitizeCalendarEvent(calendarEvent, datestamp));
};

/**
 * Map each timestamp to a list of event chip configs for that day.
 * Any event that is all day will be convertted into a chip.
 * @param timestamp - YYYY-MM-DD
 */
export async function generateEventChips(timestamps: string[]): Promise<Record<string, EventChipProps[]>> {
    await getCalendarAccess();

    // Find the overall date range
    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range and format
    const calendarColorMap = await generateCalendarDetailsMap();
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, Object.keys(calendarColorMap));
    const eventChipMap: Record<string, EventChipProps[]> = timestamps.reduce((map, datestamp) => {
        map[datestamp] = calendarEvents
            .filter(event => validateEventChip(event, datestamp))
            .map(event => {
                const calendarDetails = calendarColorMap[event.calendar?.id!];
                return {
                    label: event.title,
                    iconConfig: {
                        type: calendarDetails.iconType,
                    },
                    color: calendarDetails.color
                }
            });
        return map;
    }, {} as Record<string, EventChipProps[]>);
    return eventChipMap;
};

/**
 * Syncs an existing planner with a calendar. Calendars have final say on the state of the events.
 * @param calendar - the events to sync within the existing planner
 * @param planner - the planner being updated
 * @param timestamp
 * @returns - the new planner synced with the calendar
 */
export function syncPlannerWithCalendar(
    calendar: PlannerEvent[],
    planner: PlannerEvent[],
    timestamp: string
) {
    // console.info('syncPlannerWithCalendar: START', { calendar, planner, timestamp });

    // Loop over the existing planner, removing any calendar events that no longer exist
    // in the new device calendar. All existing linked events will also be updated to reflect the
    // calendar.
    const newPlanner = planner.reduce<PlannerEvent[]>((accumulator, planEvent) => {

        // This event isn't related to the calendar -> keep it
        if (!planEvent.calendarId || planEvent.status === ItemStatus.HIDDEN) {
            return [...accumulator, planEvent];
        }

        // This event is linked to the calendar and still exists -> update it
        const calEvent = calendar.find(calEvent => calEvent.id === planEvent.calendarId);
        if (calEvent) {
            // Generate an updated record of the calendar event
            const updatedEvent = {
                ...planEvent,
                timeConfig: calEvent.timeConfig,
                value: calEvent.value,
            }

            // Add the updated event to the current planner
            const updatedPlanner = [...accumulator, updatedEvent];

            // Generate the updated event's new position in the list
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
            return updatedPlanner;
        } else {
            // This event is linked to the calendar but has been removed -> delete it
            return [...accumulator];
        }
    }, []);

    // Find any new events in the calendar and add these to the new planner
    calendar.forEach(calEvent => {
        if (!newPlanner.find(planEvent => planEvent.calendarId === calEvent.id)) {

            // Generate a new record to represent the calendar event
            const newEvent = {
                ...calEvent,
                id: uuid.v4(),
                listId: timestamp,
                calendarId: calEvent.id
            };

            // Add the new event to the planner and generate its position within the list
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTime(newEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithCalendar: START', newPlanner);
    return newPlanner;
}

/**
 * Syncs an existing planner with the recurring weekday planner. The recurring planner has
 * final say on the state of the events. If a recurring event is manually deleted from a planner, 
 * it will remain deleted.
 * @param recurringPlanner - the events to sync within the existing planner
 * @param planner - the planner being updated
 * @param timestamp
 * @returns - the new planner synced with the recurring events
 */
export function syncPlannerWithRecurring(
    recurringPlanner: RecurringEvent[],
    planner: PlannerEvent[],
    timestamp: string
) {
    // console.info('syncPlannerWithRecurring: START', { recurringPlanner, planner, timestamp })

    function getRecurringEventTimeConfig(recEvent: RecurringEvent) {
        return {
            startTime: timeValueToIso(timestamp, recEvent.startTime!),
            allDay: false,
            endTime: timeValueToIso(timestamp, '23:55'),
            isCalendarEvent: false
        }
    };

    // Build the new planner out of the recurring planner. All recurring events will prioritize the
    // recurring planner's values.
    const newPlanner = recurringPlanner.reduce<RecurringEvent[]>((accumulator, recEvent) => {
        const planEvent = planner.find(planEvent => planEvent.recurringId === recEvent.id);

        if (planEvent?.status === ItemStatus.HIDDEN) {
            // This event has been manually deleted -> keep it deleted
            return [...accumulator, planEvent];
        }

        if (planEvent) {
            // This recurring event is in the current planner -> update it
            const updatedEvent: PlannerEvent = {
                id: planEvent.id,
                listId: timestamp,
                status: planEvent.status,
                sortId: planEvent.sortId,
                recurringId: recEvent.id,
                value: recEvent.value,
            };

            // Add event time
            if (planEvent.timeConfig) {
                updatedEvent.timeConfig = planEvent.timeConfig;
            } else if (recEvent.startTime) {
                updatedEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Add calendar link
            if (planEvent.calendarId) {
                updatedEvent.calendarId = planEvent.calendarId;
            }

            // Add sort position
            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);

            return updatedPlanner;
        } else {
            // This recurring event hasn't been added to the planner yet -> add it 
            const newEvent: PlannerEvent = {
                id: uuid.v4(),
                listId: timestamp,
                recurringId: recEvent.id,
                value: recEvent.value,
                sortId: recEvent.sortId,
                status: recEvent.status
            };

            // Add event time
            if (recEvent.startTime) {
                newEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Add sort position
            const updatedPlanner = [...accumulator, newEvent];
            newEvent.sortId = generateSortIdByTime(newEvent, updatedPlanner);

            return updatedPlanner;
        }
    }, []);

    // Add in any existing events that aren't recurring
    planner.forEach(existingPlanEvent => {
        if (!newPlanner.find(planEvent => planEvent.id === existingPlanEvent.id)) {
            newPlanner.push(existingPlanEvent);
            existingPlanEvent.sortId = generateSortIdByTime(existingPlanEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithRecurring: END', newPlanner);
    return newPlanner;
}