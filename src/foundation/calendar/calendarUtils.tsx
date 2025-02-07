import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { ItemStatus, ListItem } from "../sortedLists/sortedListUtils";
import { generateSortIdByTime, isoToTimeValue, timeValueToIso } from "./dateUtils";
import { EventChipProps } from "./components/EventChip";
import { uuid } from "expo-modules-core";

export const PLANNER_STORAGE_ID = 'PLANNER_STORAGE';
export const RECURRING_WEEKDAY_PLANNER_KEY = 'RECURRING_WEEKDAY_PLANNER';

export type CalendarDetails = {
    id: string;
    color: string;
};
export type TimeConfig = {
    allDay: boolean;
    startTime: string; // ISO timestamp
    endTime: string; // ISO timestamp
    isCalendarEvent: boolean; // TODO remove
};

export interface PlannerEvent extends ListItem {
    color?: string;
    timeConfig?: TimeConfig;
    calendarId?: string;
    recurringId?: string;
};
export interface RecurringEvent extends ListItem {
    startTime?: string; // HH:MM
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
    return { id: primaryCalendar.id, color: primaryCalendar.color };
};

/**
 * Builds a map of all calendar IDs to calendar colors.
 */
export async function generateCalendarIdToColorMap(): Promise<Record<string, string>> {
    await getCalendarAccess();
    const calendars = await RNCalendarEvents.findCalendars();
    const idToColorMap: Record<string, string> = {};
    calendars.forEach(calendar => {
        idToColorMap[calendar.id] = calendar.color;
    });
    return idToColorMap;
};

/**
 * Fetches all primary events from the device calendar for the given date.
 * @param timestamp - YYYY-MM-DD
 */
export async function getCalendarEvents(timestamp: string): Promise<PlannerEvent[]> {
    const startDate = new Date(`${timestamp}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamp}T23:59:59`).toISOString();
    const calendarColorMap = await generateCalendarIdToColorMap();

    // Format all calendar events
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, Object.keys(calendarColorMap));
    return calendarEvents.map(calendarEvent => ({
        id: calendarEvent.id,
        value: calendarEvent.title,
        sortId: 1, // temporary sort id -> will be overwritten
        listId: timestamp,
        timeConfig: {
            startTime: calendarEvent.startDate,
            endTime: calendarEvent.endDate ?? endDate,
            isCalendarEvent: true,
            allDay: calendarEvent.allDay ?? false
        },
        status: ItemStatus.STATIC
    }));
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
    const calendarColorMap = await generateCalendarIdToColorMap();
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, Object.keys(calendarColorMap));
    const eventChipMap: Record<string, EventChipProps[]> = timestamps.reduce((map, timestamp) => {
        const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
        map[timestamp] = calendarEvents
            .filter(event => event.allDay && isEventOnDate(event, dateKey))
            .map(event => ({
                label: event.title,
                iconConfig: {
                    type: 'megaphone',
                    size: 10
                },
                color: calendarColorMap[event.calendar?.id!]
            }));
        return map;
    }, {} as Record<string, EventChipProps[]>);
    return eventChipMap;
};

/**
 * Helper function to determine if an event falls on a specific date.
 */
function isEventOnDate(event: CalendarEventReadable, dateKey: string): boolean {
    const eventStart = new Date(event.startDate).toISOString().split('T')[0];
    if (!event.endDate) return false;

    let eventEnd = new Date(event.endDate);
    if (event.allDay) {
        eventEnd.setDate(eventEnd.getDate() - 1);
    }
    eventEnd = new Date(eventEnd.toISOString().split('T')[0]);
    const dateKeyDate = new Date(dateKey);
    return dateKeyDate >= new Date(eventStart) && dateKeyDate <= eventEnd;
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
    console.info('syncPlannerWithCalendar: START', { calendar, planner, timestamp });

    // Loop over the existing planner, removing any calendar events that no longer exist
    // in the new device calendar. All existing linked events will also be updated to reflect the
    // calendar.
    const newPlanner = planner.reduce<PlannerEvent[]>((accumulator, planEvent) => {

        // This event isn't related to the calendar -> keep it
        if (!planEvent.timeConfig?.isCalendarEvent || planEvent.status === ItemStatus.HIDDEN) {
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

    console.info('syncPlannerWithCalendar: START', newPlanner);
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
    console.info('syncPlannerWithRecurring: START', { recurringPlanner, planner, timestamp })

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
                newEvent.timeConfig = getRecurringEventTimeConfig(recEvent);;
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

    console.info('syncPlannerWithRecurring: END', newPlanner);
    return newPlanner;
}