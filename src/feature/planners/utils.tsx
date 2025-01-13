import { generateSortId } from "../../foundation/sortedLists/utils";
import { Event, TimeConfig } from "./types";

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Determines if the given timestamp is valid.
 * @param timestamp - YYYY-MM-DD
 * @returns - true if valid, else false
 */
export const isTimestampValid = (timestamp: string) => {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
}

/**
 * Determines if the given timestamp represents a weekday.
 * @param timestamp - YYYY-MM-DD
 * @returns - true if a weekday, else false
 */
export const isTimestampWeekday = (timestamp: string) => {
    if (!isTimestampValid(timestamp)) return false;
    return WEEKDAYS.includes(timestampToDayOfWeek(timestamp));
}


/**
 * Combines a generic hour/minute combo with a given generic timestamp and returns a valid timestamp.
 * @param baseDate - YYYY-MM-DD
 * @param timeValue - HH:MM
 * @returns - YYYY-MM-DDT00:00:00
 */
export const timeValueToIso = (baseDate: string, timeValue: string): string => {
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
export const isoToTimeValue = (isoTimestamp: string): string => {
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
export const compareTimeValues = (time1: string, time2: string): number => {
    console.log(`${time1} and ${time2}`, 'comparing time values')
    const [hour1, minute1] = time1.split(':').map(Number);
    const [hour2, minute2] = time2.split(':').map(Number);

    const totalMinutes1 = hour1 * 60 + minute1;
    const totalMinutes2 = hour2 * 60 + minute2;

    console.log(totalMinutes1 - totalMinutes2, 'result')

    return totalMinutes1 - totalMinutes2;
};


/**
 * Converts a timestamp to the day of the week for that date.
 * @param timestamp - YYYY-MM-DD
 * @returns - the day of the week
 */
export const timestampToDayOfWeek = (timestamp: string) => {
    const date = new Date(timestamp + 'T00:00:00');
    return DAYS_OF_WEEK[date.getDay()];
}

/**
 * Converts a timestamp to the month and day of the month.
 * @param timestamp - YYYY-MM-DD
 * @returns - month and day of the format:  January 5
 */
export const timestampToMonthDate = (timestamp: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(timestamp + 'T00:00:00');
    return `${months[date.getMonth()]} ${date.getDate()}`;
}


/**
 * Generates the timestamp for today's date in YYYY-MM-DD format.
 * @returns - today's timestamp YYYY-MM-DD
 */
export const generateTodayTimestamp = () => {
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
export const generateTomorrowTimestamp = () => {
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
export const generateNextSevenDayTimestamps = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return Array.from({ length: 14 }, (_, i) => {
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
 * @param planner - the planner containing the event
 * @returns - the new sort ID for the event
 */
export const generateSortIdByTimestamp = (event: Event, planner: Event[]) => {
    const plannerWithoutEvent = planner.filter(curr => curr.id !== event.id);
    if (!event.timeConfig) return event.sortId === -1 ?
        generateSortId(-1, plannerWithoutEvent) :
        event.sortId;

    console.log('**********')
    console.log(event, 'adding event with new time sort')

    planner.sort((a, b) => a.sortId - b.sortId);

    console.log([...planner], 'current planner')

    // Check if the event conflicts at its current position
    const eventsWithTimes = planner.filter(existingEvent => !!existingEvent.timeConfig || (existingEvent.id === event.id));
    const currentIndex = eventsWithTimes.findIndex(e => e.id === event.id);
    if (currentIndex !== -1) {

        // Ensure the event at the current position does not conflict
        const prevEvent = eventsWithTimes[currentIndex - 1];
        const nextEvent = eventsWithTimes[currentIndex + 1];
        const hasNoConflict =
            (!prevEvent || (prevEvent.timeConfig && compareTimeValues(event.timeConfig.startTime, prevEvent.timeConfig.startTime) >= 0)) &&
            (!nextEvent || (nextEvent.timeConfig && compareTimeValues(event.timeConfig.startTime, nextEvent.timeConfig.startTime) < 0));

        console.log(hasNoConflict, 'has no conflict')
        if (hasNoConflict) return event.sortId === -1 ? generateSortId(-1, plannerWithoutEvent) : event.sortId;
    } else {
        throw new Error('generateSortIdByTimestamp: Event does not exist in the planner.');
    }

    // Find the first event that starts after or during the new event
    const eventThatStartsAfterIndex = planner.findIndex(existingEvent => {
        if (!existingEvent.timeConfig || !event.timeConfig || existingEvent.id === event.id) return false;
        return compareTimeValues(event.timeConfig.startTime, existingEvent.timeConfig.startTime) <= 0;
    });

    // Place the new event before the event that starts after it
    if (eventThatStartsAfterIndex !== -1) {
        console.log(eventThatStartsAfterIndex, 'Placing it before the first event that starts after it')
        const newParentSortId = eventThatStartsAfterIndex > 0
            ? planner[eventThatStartsAfterIndex - 1].sortId
            : -1;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    // Find the last event that starts before the current event
    let eventThatStartsBeforeIndex = -1;
    for (let i = planner.length - 1; i >= 0; i--) {
        const existingEvent = planner[i];
        if (!existingEvent.timeConfig || existingEvent.id === event.id) continue;

        // This event starts before the current event
        if (compareTimeValues(event.timeConfig.startTime, existingEvent.timeConfig.startTime) > 0) {
            eventThatStartsBeforeIndex = i;
            break;
        }
    }

    // Place the new event after the event that starts before it
    if (eventThatStartsBeforeIndex !== -1) {
        console.log(eventThatStartsBeforeIndex, 'Placing it after the last event that starts before it')
        const newParentSortId = planner[eventThatStartsBeforeIndex].sortId;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    throw new Error('An error occurred during sort ID generation.')
};

export interface TimeObject {
    indicator: string[];
    hour: number[];
    minute: number[];
}

/**
 * TODO: fix comments Generates an object with arrays for indicators, hours, and minutes.
 * @returns - an object with arrays for indicators, hours, and minutes
 */
export const generateTimeArrays = (): TimeObject => {
    const timeObject: TimeObject = {
        indicator: ["AM", "PM"], // Two possible values: "AM" and "PM"
        hour: [], // Hours from 1 to 12
        minute: [], // Minutes in 5-minute intervals
    };

    // Populate the hour array with values from 12 to 12, padded with zeros
    for (let hour = 0; hour <= 11; hour++) {
        timeObject.hour.push(hour);
    }

    // Populate the minute array with 5-minute intervals (00, 05, 10, ..., 55), padded with zeros
    for (let minute = 0; minute < 60; minute += 5) {
        timeObject.minute.push(minute);
    }

    return timeObject;
};

export const extractTimeValue = (text: string) => {
    // Use regex to find a time value typed in (HH:MM (PM or AM))
    const timeRegex = /\b(1[0-2]|[1-9])(?::(0[0-5]|[1-5][0-9]))?\s?(AM|PM|am|pm|Am|aM|pM|Pm)\b/;
    const match = text.match(timeRegex);

    let timeConfig = null;
    let updatedText = text;

    if (match) {
        // Extract the matched time and remove it from the text
        const timeValue = match[0];
        updatedText = text.replace(timeValue, "").trim();

        console.log(match)

        // Convert timeValue to 24-hour format (HH:MM)
        let hours = parseInt(match[1], 10); // Group 1: Hours
        const minutes = match[2] ? parseInt(match[2], 10) : 0; // Group 2: Minutes (default to 0 if not present)
        const period = match[3].toUpperCase(); // Group 3: AM/PM

        if (period === "PM" && hours !== 12) {
            hours += 12; // Convert PM hours to 24-hour format
        } else if (period === "AM" && hours === 12) {
            hours = 0; // Convert 12 AM to 0
        }

        // Format hours and minutes as HH:MM
        const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        // Create a timeConfig object
        timeConfig = {
            startTime: formattedTime,
            endTime: "23:55",
            isCalendarEvent: false,
            allDay: false,
        };
    }

    return {timeConfig, updatedText};
}