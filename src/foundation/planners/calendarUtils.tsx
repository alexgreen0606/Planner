import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { ItemStatus } from "../../foundation/sortedLists/utils";
import { Event, isoToTimeValue } from "./timeUtils";
import { EventChipProps } from "./components/EventChip";
import { Color } from "../theme/colors";

/**
 * Grants access to the device calendar.
 */
async function getCalendarAccess() {
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            throw new Error('Access denied to calendars.'); // TODO: just skip calendars if denied?
        }
    }
}

/**
 * Fetches the primary calendar ID for this device.
 */
export async function getPrimaryCalendarDetails(): Promise<{ id: string, color: string }> {
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
export async function getCalendarEvents(timestamp: string): Promise<Event[]> {
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