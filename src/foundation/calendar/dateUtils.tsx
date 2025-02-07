import { PlannerEvent, RecurringEvent, TimeConfig } from "./calendarUtils";
import { generateSortId, getParentSortId, ItemStatus } from "../sortedLists/sortedListUtils";

enum MONTHS {
    January = "January",
    February = "February",
    March = "March",
    April = "April",
    May = "May",
    June = "June",
    July = "July",
    August = "August",
    September = "September",
    October = "October",
    November = "November",
    December = "December",
};
enum DAYS_OF_WEEK {
    Sunday = "Sunday",
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
};
enum WEEKDAYS {
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
};

/**
 * Determines if the given string is a valid timestamp.
 * @param timestamp - YYYY-MM-DD
 * @returns - true if valid, else false
 */
export function isTimestampValid(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
};

/**
 * Determines if the given timestamp represents a weekday.
 * @param timestamp - YYYY-MM-DD
 * @returns - true if a weekday, else false
 */
export function isTimestampWeekday(timestamp: string): boolean {
    if (!isTimestampValid(timestamp)) return false;
    return (Object.values(WEEKDAYS) as string[]).includes(timestampToDayOfWeek(timestamp));
};

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
 * Converts an ISO timestamp to YYYY-MM-DD format.
 * @param isoTimestamp - The ISO timestamp string (e.g., "2025-02-03T12:34:56Z").
 * @returns - Formatted date in YYYY-MM-DD.
 */
export function isoToTimestamp(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Calculates the number of days between today and a given date in YYYY-MM-DD format.
 * @param dateStr - The date string in YYYY-MM-DD format.
 * @returns - Number of days between today and the given date.
 */
export function daysBetweenToday(targetDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}


/**
 * Compares two time values.
 * @param time1 - The first time (either ISO or HH:MM).
 * @param time2 - The second time (either ISO or HH:MM).
 * @returns - A negative number if time1 is earlier, 0 if equal, positive if time1 is later.
 */
export function compareTimes(time1: string, time2: string): number {
    if (isTimestampValid(time1)) {
        const date1 = new Date(time1).getTime();
        const date2 = new Date(time2).getTime();
        return date1 - date2;
    } else {
        const [hour1, minute1] = time1.split(':').map(Number);
        const [hour2, minute2] = time2.split(':').map(Number);
        const totalMinutes1 = hour1 * 60 + minute1;
        const totalMinutes2 = hour2 * 60 + minute2;
        return totalMinutes1 - totalMinutes2;
    }
};

/**
 * Converts a timestamp to the day of the week for that date.
 * @param timestamp - YYYY-MM-DD
 * @returns - the day of the week as a string
 */
export function timestampToDayOfWeek(timestamp: string): DAYS_OF_WEEK {
    const date = new Date(timestamp + 'T00:00:00');
    return DAYS_OF_WEEK[Object.keys(DAYS_OF_WEEK)[date.getDay()] as keyof typeof DAYS_OF_WEEK];
}

/**
 * Converts a timestamp to the month and day of the month.
 * @param timestamp - YYYY-MM-DD
 * @returns - month and day of the format:  January 5
 */
export function genericTimestampToMonthDate(timestamp: string): string {
    const date = new Date(timestamp + 'T00:00:00');
    return `${Object.values(MONTHS)[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Converts a timestamp to the month and day of the month.
 * @param timestamp - YYYY-MM-DD
 * @returns - month and day of the format:  January 5
 */
export function isoTimestampToMonthDate(timestamp: string): string {
    const date = new Date(timestamp);
    return `${Object.values(MONTHS)[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Generates the timestamp for yesterday's date in YYYY-MM-DD format.
 * @returns - yesterday's timestamp YYYY-MM-DD
 */
export function getYesterdayGenericTimestamp(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Move to the previous day
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Generates the timestamp for today's date in YYYY-MM-DD format.
 * @returns - today's timestamp YYYY-MM-DD
 */
export function getTodayGenericTimestamp(): string {
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
export function getTomorrowGenericTimestamp(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Move to the next day
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Gets the Date object for a given timestamp's start (midnight local time).
 * @param timestamp - YYYY-MM-DD string
 * @param dayShift - Number of days to shift from the timestamp
 * @returns - Date object representing the midnight time of the computed date
 */
export function genericTimestampToMidnightDate(timestamp: string): Date {
    const baseDate = new Date(timestamp + 'T00:00:00'); // Ensures consistent parsing in local time
    baseDate.setDate(baseDate.getDate());
    baseDate.setHours(0, 0, 0, 0);
    return baseDate;
};

/**
 * Generates the timestamp for the date 10 years into the future in YYYY-MM-DD format.
 * @returns - future timestamp YYYY-MM-DD
 */
export function getGenericTimestampTenYearsFromToday(): string {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Builds a list of timestamps for the next seven days from tomorrow to tomorrow + 6.
 * @returns - list of timestamps YYYY-MM-DD
 */
export function getNextSevenDayTimestamps(): string[] {
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
};

/**
 * Generate a new sort ID for the event that maintains time logic within the planner.
 * @param event - the event to place
 * @param planner - the planner (MUST contain the event)
 * @returns - the new sort ID for the event
 */
export function generateSortIdByTime(
    event: PlannerEvent | RecurringEvent,
    planner: (PlannerEvent | RecurringEvent)[]
): number {
    console.info('generateSortIdByTime START', { event, planner });

    const plannerWithoutEvent = planner.filter(curr => curr.id !== event.id);

    // Handler for situations where the item can remain in its position.
    function persistEventPosition() {
        if (event.sortId === -1) {
            // Event will be at the top of the list
            return generateSortId(-1, plannerWithoutEvent);
        } else if (plannerWithoutEvent.find(item => item.sortId === event.sortId)) {
            // Event has a duplicate sort ID. Generate a new one.
            return generateSortId(getParentSortId(event, planner), plannerWithoutEvent);
        } else {
            // Use the event's current position.
            return event.sortId;
        }
    };

    function getEventTime(item: PlannerEvent | RecurringEvent | undefined): string | undefined {
        if (!item) return undefined;
        if ("timeConfig" in item) {
            return item.timeConfig?.startTime;
        } else if ("startTime" in item) {
            return item.startTime;
        } else {
            return undefined;
        }
    };

    const eventTime = getEventTime(event);

    // The event does not need to account for a timestamp
    if (!eventTime || event.status === ItemStatus.HIDDEN) return persistEventPosition();

    planner.sort((a, b) => a.sortId - b.sortId);

    // Check if the event conflicts at its current position
    const eventsWithTimes = planner.filter(existingEvent => getEventTime(existingEvent));
    const currentIndex = eventsWithTimes.findIndex(e => e.id === event.id);
    if (currentIndex !== -1) {

        // Ensure the event at the current position does not conflict
        const prevEvent = eventsWithTimes[currentIndex - 1];
        const nextEvent = eventsWithTimes[currentIndex + 1];
        const prevEventTime = getEventTime(prevEvent);
        const nextEventTime = getEventTime(nextEvent);
        const hasNoConflict =
            (!prevEvent || (prevEventTime && compareTimes(eventTime, prevEventTime) >= 0)) &&
            (!nextEvent || (nextEventTime && compareTimes(eventTime, nextEventTime) < 0));

        if (hasNoConflict) return persistEventPosition();
    } else {
        throw new Error(`generateSortIdByTime: Event ${event.value} does not exist in the given planner.`);
    }

    // Find the first event that starts after or during the new event
    const eventThatStartsAfterIndex = planner.findIndex(existingEvent => {
        const existingEventTime = getEventTime(existingEvent);
        if (!existingEventTime || existingEvent.id === event.id) return false;
        return compareTimes(eventTime, existingEventTime) <= 0;
    });

    // Place the new event before the event that starts after it
    if (eventThatStartsAfterIndex !== -1) {
        const newParentSortId = eventThatStartsAfterIndex > 0
            ? planner[eventThatStartsAfterIndex - 1].sortId
            : -1;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    // Find the last event that starts before the current event
    let eventThatStartsBeforeIndex = -1;
    for (let i = planner.length - 1; i >= 0; i--) {
        const existingEvent = planner[i];
        const existingEventTime = getEventTime(existingEvent);
        if (!existingEventTime || existingEvent.id === event.id) continue;

        // This event starts before the current event
        if (compareTimes(eventTime, existingEventTime) > 0) {
            eventThatStartsBeforeIndex = i;
            break;
        }
    }

    // Place the new event after the event that starts before it
    if (eventThatStartsBeforeIndex !== -1) {
        const newParentSortId = planner[eventThatStartsBeforeIndex].sortId;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    throw new Error('generateSortIdByTime: An error occurred during timed sort ID generation.');
};

/**
 * Parses the given text to find any time values. If one exists, it will be removed and a time object
 * will be generated representing this time of day.
 * @param text - user input
 * @returns - the text with the time value removed, and a time object representing the time value
 */
export function extractTimeValue(text: string, timestamp?: string): { timeConfig: TimeConfig | undefined, updatedText: string } {
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
            startTime: timestamp ? timeValueToIso(timestamp, formattedTime) : formattedTime,
            endTime: timestamp ? timeValueToIso(timestamp, "23:55") : "23:55",
            isCalendarEvent: false,
            allDay: false,
        };
    }
    return { timeConfig, updatedText };
};