import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { Event, isoToTimeValue } from "./timeUtils";
import { ItemStatus } from "../../foundation/sortedLists/utils";

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
export async function getPrimaryCalendarId(): Promise<string> {
    await getCalendarAccess();
    const calendars = await RNCalendarEvents.findCalendars();
    const primaryCalendar = calendars.find(calendar => calendar.isPrimary);
    if (!primaryCalendar) throw new Error('Primary calendar does not exist!');
    return primaryCalendar.id;
};

/**
 * Fetches all primary events from the device calendar for the given date.
 * @param timestamp - YYYY-MM-DD
 */
export async function getCalendarEvents(timestamp: string): Promise<Event[]> {
    const startDate = new Date(`${timestamp}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamp}T23:59:59`).toISOString();

    // Load in the calendar events and format them into a planner
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [await getPrimaryCalendarId()]);
    return calendarEvents.filter(event => !event.allDay).map(calendarEvent => ({
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
 * Fetches all holidays from the device calendar for the given date range.
 * @param timestamp - YYYY-MM-DD
 */
export async function getHolidays(timestamps: string[]): Promise<Record<string, string[]>> {
    await getCalendarAccess();

    // Load in the US Holiday calendar
    const calendars = await RNCalendarEvents.findCalendars();
    const holidayCalendar = calendars.find(calendar => calendar.title === 'US Holidays');
    if (!holidayCalendar) throw new Error('Holiday calendar does not exist!');

    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();
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
 * Fetches all birthdays from the device calendar for the given date range.
 * @param timestamp - YYYY-MM-DD
 */
export async function getBirthdays(timestamps: string[]): Promise<Record<string, string[]>> {
    await getCalendarAccess();

    const calendars = await RNCalendarEvents.findCalendars();
    const birthdayCalendar = calendars.find(calendar => calendar.title === 'Birthdays');
    if (!birthdayCalendar) throw new Error('Birthday calendar does not exist!');

    // Fetch all birthdays and format
    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [birthdayCalendar.id]);
    const birthdayMap: Record<string, string[]> = timestamps.reduce((map, timestamp) => {
        const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
        map[timestamp] = calendarEvents
            .filter(event => new Date(event.startDate).toISOString().split('T')[0] === dateKey)
            .map(event => event.title);
        return map;
    }, {} as Record<string, string[]>);
    return birthdayMap;
};

/**
 * Fetches all full-day events from the device calendar for the given date range.
 * @param timestamp - YYYY-MM-DD
 */
export async function getFullDayEvents(timestamps: string[]): Promise<Record<string, string[]>> {
    await getCalendarAccess();
    const primaryCalendarId = await getPrimaryCalendarId();

    // Find the overall date range
    const startDate = new Date(`${timestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${timestamps[timestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range and format
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate, [primaryCalendarId]);
    const allDayMap: Record<string, string[]> = timestamps.reduce((map, timestamp) => {
        const dateKey = new Date(`${timestamp}T00:00:00`).toISOString().split('T')[0];
        map[timestamp] = calendarEvents
            .filter(event => event.allDay && isEventOnDate(event, dateKey))
            .map(event => event.title);
        return map;
    }, {} as Record<string, string[]>);
    return allDayMap;
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