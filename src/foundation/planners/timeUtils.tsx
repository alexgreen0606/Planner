import { generateSortId, getParentSortId, ListItem } from "../sortedLists/utils";

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const PLANNER_STORAGE_ID = 'PLANNER_STORAGE';
export const RECURRING_WEEKDAY_PLANNER_KEY = 'RECURRING_WEEKDAY_PLANNER';

// Links an event to one within the recurring weekday planner
export interface RecurringConfig {
    recurringId?: string;
    deleted?: boolean;
}

// Links an event to one within the device calendar
export interface TimeConfig {
    calendarEventId?: string;
    allDay: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    isCalendarEvent: boolean;
};

export interface Event extends ListItem {
    timeConfig?: TimeConfig;
    recurringConfig?: RecurringConfig;
};

export interface TimeSelectorOptions {
    indicator: string[];
    hour: number[];
    minute: number[];
}

/**
 * Determines if the given string is a valid timestamp.
 * @param timestamp - YYYY-MM-DD
 * @returns - true if valid, else false
 */
export function isTimestampValid(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
}

/**
 * Determines if the given timestamp represents a weekday.
 * @param timestamp - YYYY-MM-DD
 * @returns - true if a weekday, else false
 */
export function isTimestampWeekday(timestamp: string): boolean {
    if (!isTimestampValid(timestamp)) return false;
    return WEEKDAYS.includes(timestampToDayOfWeek(timestamp));
}

/**
 * Combines a generic hour/minute combo with a given generic timestamp and returns a valid timestamp.
 * @param baseDate - YYYY-MM-DD
 * @param timeValue - HH:MM
 * @returns - YYYY-MM-DDT00:00:00
 */
export function timeValueToIso(baseDate: string, timeValue: string): string {
    const [year, month, day] = baseDate.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute);
    return localDate.toISOString();
};

/**
 * Extracts the hour and minute from a given ISO timestamp in local time.
 * @param isoTimestamp - YYYY-MM-DDTHH:mm:ss.sssZ
 * @returns - HH:MM (in local time)
 */
export function isoToTimeValue(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Compares two time values in HH:MM format.
 * @param time1 - The first time value (HH:MM).
 * @param time2 - The second time value (HH:MM).
 * @returns - A negative number if time1 is earlier, 0 if equal, positive if time1 is later.
 */
export function compareTimeValues(time1: string, time2: string): number {
    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);
    const totalMinutes1 = hour1 * 60 + minute1;
    const totalMinutes2 = hour2 * 60 + minute2;
    return totalMinutes1 - totalMinutes2;
};

/**
 * Converts a timestamp to the day of the week for that date.
 * @param timestamp - YYYY-MM-DD
 * @returns - the day of the week as a string
 */
export function timestampToDayOfWeek(timestamp: string): string {
    const date = new Date(timestamp + 'T00:00:00');
    return DAYS_OF_WEEK[date.getDay()];
}

/**
 * Converts a timestamp to the month and day of the month.
 * @param timestamp - YYYY-MM-DD
 * @returns - month and day of the format:  January 5
 */
export function timestampToMonthDate(timestamp: string): string {
    const date = new Date(timestamp + 'T00:00:00');
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Generates the timestamp for today's date in YYYY-MM-DD format.
 * @returns - today's timestamp YYYY-MM-DD
 */
export function generateTodayTimestamp(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Generates the timestamp for tomorrow's date in YYYY-MM-DD format.
 * @returns - tomorrow's timestamp YYYY-MM-DD
 */
export function generateTomorrowTimestamp(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Move to the next day
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Builds a list of timestamps for the next seven days from tomorrow to tomorrow + 6.
 * @returns - list of timestamps YYYY-MM-DD
 */
export function generateNextSevenDayTimestamps(): string[] {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
}

/**
 * Generate a new sort ID for the event that maintains time logic within the planner.
 * @param event - the event to place
 * @param planner - the planner (MUST contain the event)
 * @returns - the new sort ID for the event
 */
export function generateSortIdByTimestamp(event: Event, planner: Event[], fallbackSortId?: number): number {
    const existingPlannerEvents = planner.filter(event => !event.recurringConfig?.deleted && !event.timeConfig?.allDay);
    const plannerWithoutEvent = existingPlannerEvents.filter(curr => curr.id !== event.id);

    // Handler for situations where the item can remain in its position.
    function persistEventPosition() {
        if (event.sortId === -1) {

            // Event will be at the top of the list
            return generateSortId(-1, plannerWithoutEvent);
        } else if (plannerWithoutEvent.find(item => item.sortId === event.sortId)) {

            // Event has a duplicate sort ID. Generate a new one.
            return generateSortId(getParentSortId(event, existingPlannerEvents), plannerWithoutEvent);
        } else {

            // Use the event's current position.
            return event.sortId;
        }
    };

    // The event does not need to account for a timestamp
    if (!event.timeConfig || event.timeConfig.allDay) return persistEventPosition();

    existingPlannerEvents.sort((a, b) => a.sortId - b.sortId);

    // Check if the event conflicts at its current position
    const eventsWithTimes = existingPlannerEvents.filter(existingEvent => !!existingEvent.timeConfig || (existingEvent.id === event.id));
    const currentIndex = eventsWithTimes.findIndex(e => e.id === event.id);
    if (currentIndex !== -1) {

        // Ensure the event at the current position does not conflict
        const prevEvent = eventsWithTimes[currentIndex - 1];
        const nextEvent = eventsWithTimes[currentIndex + 1];
        const hasNoConflict =
            (!prevEvent || (prevEvent.timeConfig && compareTimeValues(event.timeConfig.startTime, prevEvent.timeConfig.startTime) >= 0)) &&
            (!nextEvent || (nextEvent.timeConfig && compareTimeValues(event.timeConfig.startTime, nextEvent.timeConfig.startTime) < 0));

        if (hasNoConflict) return persistEventPosition();
    } else {
        throw new Error(`Event ${event.value} does not exist in the given planner.`);
    }

    if (fallbackSortId) return fallbackSortId;

    // Find the first event that starts after or during the new event
    const eventThatStartsAfterIndex = existingPlannerEvents.findIndex(existingEvent => {
        if (!existingEvent.timeConfig || !event.timeConfig || existingEvent.id === event.id) return false;
        return compareTimeValues(event.timeConfig.startTime, existingEvent.timeConfig.startTime) <= 0;
    });

    // Place the new event before the event that starts after it
    if (eventThatStartsAfterIndex !== -1) {
        const newParentSortId = eventThatStartsAfterIndex > 0
            ? existingPlannerEvents[eventThatStartsAfterIndex - 1].sortId
            : -1;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    // Find the last event that starts before the current event
    let eventThatStartsBeforeIndex = -1;
    for (let i = existingPlannerEvents.length - 1; i >= 0; i--) {
        const existingEvent = existingPlannerEvents[i];
        if (!existingEvent.timeConfig || existingEvent.id === event.id) continue;

        // This event starts before the current event
        if (compareTimeValues(event.timeConfig.startTime, existingEvent.timeConfig.startTime) > 0) {
            eventThatStartsBeforeIndex = i;
            break;
        }
    }

    // Place the new event after the event that starts before it
    if (eventThatStartsBeforeIndex !== -1) {
        const newParentSortId = existingPlannerEvents[eventThatStartsBeforeIndex].sortId;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    throw new Error('An error occurred during sort ID generation.')
};

/**
 * Generates an object with arrays for indicators, hours, and minutes.
 * @returns - an object with arrays for indicators, hours, and minutes
 */
export function generateTimeSelectorOptions(): TimeSelectorOptions {
    const timeObject: TimeSelectorOptions = {
        indicator: ["AM", "PM"],
        hour: [], // Hours from 0 to 11
        minute: [], // Minutes in 5-minute intervals (0 to 55)
    };
    for (let hour = 0; hour <= 11; hour++) {
        timeObject.hour.push(hour);
    };
    for (let minute = 0; minute < 60; minute += 5) {
        timeObject.minute.push(minute);
    };
    return timeObject;
};

/**
 * Parses the given text to find any time values. If one exists, it will be removed and a time object
 * will be generated representing this time of day.
 * @param text - user input
 * @returns - the text with the time value removed, and a time object representing the time value
 */
export function extractTimeValue(text: string): { timeConfig: TimeConfig | undefined, updatedText: string } {
    let timeConfig = undefined;
    let updatedText = text;

    // Use regex to find a time value typed in (HH:MM (PM or AM))
    const timeRegex = /\b(1[0-2]|[1-9])(?::(0[0-5]|[1-5][0-9]))?\s?(AM|PM|am|pm|Am|aM|pM|Pm)\b/;
    const match = text.match(timeRegex);
    if (match) {
        // Extract the matched time and remove it from the text
        const timeValue = match[0];
        updatedText = text.replace(timeValue, "").trim();

        // Convert timeValue to 24-hour format (HH:MM)
        let hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3].toUpperCase();
        if (period === "PM" && hours !== 12) {
            hours += 12;
        } else if (period === "AM" && hours === 12) {
            hours = 0;
        }
        const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        // Build the object representing this time
        timeConfig = {
            startTime: formattedTime,
            endTime: "23:55",
            isCalendarEvent: false,
            allDay: false,
        };
    }
    return { timeConfig, updatedText };
}