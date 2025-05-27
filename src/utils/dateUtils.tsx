import { EItemStatus } from '@/enums/EItemStatus';
import { generateSortId, getParentSortId, sanitizeList } from '@/utils/listUtils';
import { IPlannerEvent, TTimeConfig } from '@/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { DateTime } from 'luxon';

/**
 * Generates an array of datestamps encompassing the given start date, end date, and all days in between.
 * @param start - Start of range YYYY-MM-DD
 * @param end - End of range YYYY-MM-DD
 * @returns - Array of datestamps from start to end.
 */
export function generateDatestampRange(start: string, end: string): string[] {
    const startDate = DateTime.fromISO(start);
    const endDate = DateTime.fromISO(end);

    if (!startDate.isValid || !endDate.isValid || endDate < startDate) {
        throw new Error('Invalid date range');
    }

    const dates: string[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        dates.push(currentDate.toISODate());
        currentDate = currentDate.plus({ days: 1 });
    }

    return dates;
}

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
 * Combines a generic hour/minute combo with a given generic timestamp and returns a valid ISO timestamp.
 * @param baseDate - YYYY-MM-DD
 * @param timeValue - HH:MM
 * @returns - ISO timestamp string in format YYYY-MM-DDTHH:MM:00.000Z
 */
export function timeValueToIso(baseDate: string, timeValue: string): string {
    const [hour, minute] = timeValue.split(':').map(Number);
    const dateTime = DateTime.fromISO(baseDate).set({ hour, minute });

    if (!dateTime.isValid) {
        throw new Error('Invalid date or time input');
    }

    return dateTime.toISO();
}

/**
 * Converts an ISO timestamp to YYYY-MM-DD format.
 * @param isoTimestamp - The ISO timestamp string (e.g., "2025-02-03T12:34:56Z").
 * @returns Formatted date in YYYY-MM-DD.
 */
export function isoToDatestamp(isoTimestamp: string): string {
    const date = DateTime.fromISO(isoTimestamp, { zone: 'utc' });

    if (!date.isValid) {
        throw new Error('Invalid ISO timestamp');
    }

    return date.toISODate();
}

/**
 * Calculates the number of days between today and a given ISO timestamp.
 * @param isoTimestamp - The ISO timestamp string.
 * @returns Number of days between today and the given date.
 */
export function daysBetweenToday(isoTimestamp: string): number {
    const today = DateTime.local().startOf('day');
    const target = DateTime.fromISO(isoTimestamp).startOf('day');

    if (!target.isValid) return 0;

    return Math.round(target.diff(today, 'days').days);
}

/**
 * ✅ Returns true if time1 is earlier than time2.
 * Assumes both time strings are in the same format (ISO or HH:MM).
 * If either of the times doesn't exist, default to true (consider time1 as earlier).
 * 
 * @param time1 - The first time string.
 * @param time2 - The second time string.
 * @returns True if time1 is earlier than time2, false otherwise.
 */
export function isTimeEarlierOrEqual(time1?: string, time2?: string): boolean {
    if (!time1 || !time2) return true;
    return time1.localeCompare(time2) < 0;
}

/**
 * Converts a timestamp to the day of the week for that date.
 * @param timestamp - YYYY-MM-DD
 * @returns - the day of the week as a string
 */
export function datestampToDayOfWeek(timestamp: string): string {
    const date = DateTime.fromISO(timestamp, { zone: 'utc' });

    if (!date.isValid) {
        throw new Error('Invalid timestamp format');
    }

    return date.toFormat('cccc');
}

/**
 * Converts a timestamp to the month and day of the month.
 * @param timestamp - YYYY-MM-DD
 * @returns - month and day in the format: January 5
 */
export function datestampToMonthDate(timestamp: string): string {
    const date = DateTime.fromISO(timestamp, { zone: 'utc' });

    if (!date.isValid) {
        throw new Error('Invalid timestamp format');
    }

    const month = date.toFormat('LLLL');
    return `${month} ${date.day}`;
}

/**
 * Generates the timestamp for yesterday's date in YYYY-MM-DD format.
 * @returns - yesterday's timestamp YYYY-MM-DD
 */
export function getYesterdayDatestamp(): string {
    return DateTime.utc().minus({ days: 1 }).toISODate();
}

/**
 * Generates the timestamp for today's date in YYYY-MM-DD format.
 * @returns - today's timestamp YYYY-MM-DD
 */
export function getTodayDatestamp(): string {
    return DateTime.utc().toISODate();
}

/**
 * Generates the timestamp for tomorrow's date in YYYY-MM-DD format.
 * @returns - tomorrow's timestamp YYYY-MM-DD
 */
export function getTomorrowDatestamp(): string {
    return DateTime.utc().plus({ days: 1 }).toISODate();
}

/**
 * ✅ Generates an iso timestamp representing the current time, rounded down to the
 * nearest 5 minutes.
 * 
 * @returns ISO timestamp rounded down to nearest 5 minutes
 */
export function getNowISORoundDown5Minutes(): string {
    const now = DateTime.now();

    return now.set({
        minute: Math.floor(now.minute / 5) * 5,
        second: 0,
        millisecond: 0,
    }).toISO();
}

/**
 * Gets the Date object for a given timestamp's start (midnight local time).
 * @param timestamp - YYYY-MM-DD string
 * @param dayOffset - Number of days to shift from the timestamp
 * @returns - Date object representing the midnight time of the computed date
 */
export function datestampToMidnightDate(timestamp: string, dayOffset: number = 0): Date {
    const date = DateTime.fromISO(timestamp, { zone: 'local' }).plus({ days: dayOffset });

    // Convert Luxon DateTime back to a native JavaScript Date at midnight
    return date.startOf('day').toJSDate();
}

/**
 * Generates the timestamp for the date 3 years into the future in YYYY-MM-DD format.
 * @returns - future timestamp YYYY-MM-DD
 */
export function getDatestampThreeYearsFromToday(): string {
    return DateTime.utc().plus({ years: 3 }).toISODate();
}

/**
 * Generates an array of datestamps for the next seven days from tomorrow to tomorrow + 6.
 * @returns - list of timestamps YYYY-MM-DD
 */
export function getNextEightDayDatestamps(): string[] {
    const tomorrow = DateTime.utc().toISODate();
    const sixDaysAfterTomorrow = DateTime.utc().plus({ days: 8 }).toISODate();

    return generateDatestampRange(tomorrow, sixDaysAfterTomorrow);
}

export function getEventTime(item: IPlannerEvent | IRecurringEvent | undefined): string | undefined {
    if (!item) return undefined;
    if ("timeConfig" in item) {
        return item.timeConfig?.multiDayEnd ? item.timeConfig.endTime : item.timeConfig?.startTime;
    } else if ("startTime" in item) {
        return item.startTime;
    } else {
        return undefined;
    }
};

/**
 * Parses the given text to find any time values. If one exists, it will be removed and a time object
 * will be generated representing this time of day.
 * @param text - user input
 * @returns - the text with the time value removed, and a time object representing the time value
 */
export function extractTimeValue(text: string, timestamp?: string): { timeConfig: TTimeConfig | undefined, updatedText: string } {
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
            allDay: false,
        };
    }
    return { timeConfig, updatedText };
};