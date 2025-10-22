import { DateTime } from 'luxon';

// ✅ 

// ==============================
// 1. Parse Time Value From Text
// ==============================

type ParsedTimeResult = {
    timeValue: string | null;
    updatedText: string;
};

/**
 * Parses user input for a time (HH:MM AM/PM) and converts it to a time value (HH:MM).
 * Returns the formatted time and the updated text with the time removed.
 *
 * @param text - The user input string.
 * @returns An object containing the updated text and extracted time value (or null if none was found).
 */
export function parseTimeValueFromText(text: string): ParsedTimeResult {
    const timeRegex = /\b(1[0-2]|[1-9])(?::([0-5][0-9]))?\s?(AM|PM|am|pm)\b/;
    const match = text.match(timeRegex);

    if (!match) return { timeValue: null, updatedText: text };

    const timeText = match[0];
    const updatedText = text.replace(timeText, "").trim();

    // Convert to time value
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const timeValue = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    return { timeValue, updatedText };
}

// ===========================================================
// 1. Conversion Functions (Datestamp/JS Date/ISO/Time Value)
// ===========================================================

/**
 * Converts a datestamp and time value into a UTC formatted ISO timestamp.
 * 
 * @param datestamp - The datestamp to use in the conversion. (YYYY-MM-DD)
 * @param timeValue - The time value to use in the conversion. (HH:MM)
 * @returns An ISO timestamp in UTC format.
 */
export function timeValueToIso(datestamp: string, timeValue: string): string {
    const [hour, minute] = timeValue.split(':').map(Number);
    const dateTime = DateTime.fromISO(datestamp).set({ hour, minute });

    if (!dateTime.isValid) {
        throw new Error('Invalid date or time input');
    }

    return dateTime.toUTC().toISO();
}

/**
 * Converts an ISO timestamp to a datestamp.
 * 
 * @param isoTimestamp - The ISO timestamp to convert.
 * @returns A datestamp representing the ISO timestamp in local time. (YYYY-MM-DD)
 */
export function isoToDatestamp(isoTimestamp: string): string {
    return DateTime.fromISO(isoTimestamp).toISODate()!;
}

/**
 * Converts a datestamp into a JS Date object at the start of the day (midnight).
 * 
 * Optionally, the date may be shifted a given number of days.
 * 
 * @param datestamp - The datestamp to use in the conversion. (YYYY-MM-DD)
 * @param dayOffset - Number of days to shift from the datestamp.
 * @returns A JS Date object representing the midnight time of the computed date.
 */
export function datestampToMidnightJsDate(datestamp: string, dayOffset: number = 0): Date {
    const date = DateTime.fromISO(datestamp).plus({ days: dayOffset });
    return date.startOf('day').toJSDate();
}

// ==============================
// 2. Datestamp Getter Functions
// ===============================

/**
 * Gets the datestamp for yesterday's date.
 * 
 * @returns The yesterday datestamp. (YYYY-MM-DD)
 */
export function getYesterdayDatestamp(): string {
    return DateTime.local().minus({ days: 1 }).toISODate();
}

/**
 * Gets the datestamp for today's date.
 * 
 * @returns The today datestamp. (YYYY-MM-DD)
 */
export function getTodayDatestamp(): string {
    return DateTime.local().toISODate();
}

/**
 * Gets the datestamp for tomorrow's date.
 * 
 * @returns The tomorrow datestamp. (YYYY-MM-DD)
 */
export function getTomorrowDatestamp(): string {
    return DateTime.local().plus({ days: 1 }).toISODate();
}

/**
 * Gets the timestamp for the date 1 year into the future.
 * 
 * @returns Datestamp for the date 1 year in the future. (YYYY-MM-DD)
 */
export function getDatestampOneYearFromToday(): string {
    return DateTime.local().plus({ years: 1 }).toISODate();
}

/**
 * Gets the timestamp for the date 1 year into the past.
 * 
 * @returns Datestamp for the date 1 year ago. (YYYY-MM-DD)
 */
export function getDatestampOneYearAgo(): string {
    return DateTime.local().minus({ years: 1 }).toISODate();
}

/**
 * Gets the datestamp shifted by the given number of days.
 *
 * @param datestamp - The starting datestamp. (YYYY-MM-DD)
 * @param days - Number of days to shift (negative for past, positive for future).
 * @returns Datestamp shifted by the specified number of days. (YYYY-MM-DD)
 */
export function getDayShiftedDatestamp(datestamp: string, days: number): string {
    return DateTime.fromISO(datestamp).plus({ days }).toISODate()!;
}

/**
 * Gets a list of datestamps from today through the next 7 days.
 * 
 * @returns A list of 8 datestamps. (YYYY-MM-DD)
 */
export function getNextEightDayDatestamps(): string[] {
    const today = getTodayDatestamp();
    const eightDaysAfterTomorrow = DateTime.local().plus({ days: 7 }).toISODate();
    return getDatestampRange(today, eightDaysAfterTomorrow);
}

// ====================
// 3. Getter Functions
// ====================

/**
 * Gets a list of datestamps from the start date through the end date.
 * 
 * @param startDatestamp - The start of the range. (YYYY-MM-DD)
 * @param endDatestamp - The end of the range. (YYYY-MM-DD)
 * @returns A list of datestamps in chronological order. (YYYY-MM-DD)
 */
export function getDatestampRange(startDatestamp: string, endDatestamp: string): string[] {
    const startDate = DateTime.fromISO(startDatestamp);
    const endDate = DateTime.fromISO(endDatestamp);

    const dates: string[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        dates.push(currentDate.toISODate()!);
        currentDate = currentDate.plus({ days: 1 });
    }

    return dates;
}

/**
 * Gets the day of the week for a datestamp.
 * 
 * @param datestamp - The datestamp to assess. (YYYY-MM-DD)
 * @returns The day of the week as a string. (ex: `Monday`)
 */
export function getDayOfWeekFromDatestamp(datestamp: string): string {
    return DateTime.fromISO(datestamp).toFormat('cccc');
}

/**
 * Gets the month and day for a datestamp.
 * 
 * @param datestamp - The datestamp to assess. (YYYY-MM-DD)
 * @returns The month and day as a string. (ex: `January 12`)
 */
export function getMonthDateFromDatestamp(datestamp: string): string {
    return DateTime.fromISO(datestamp).toFormat('LLLL d');
}

/**
 * Gets the number of days between today and a given ISO timestamp.
 * 
 * @param isoTimestamp - The ISO timestamp.
 * @returns The number of days between today and the given date.
 */
export function getDaysUntilIso(isoTimestamp: string): number {
    const today = DateTime.local().startOf('day');
    const target = DateTime.fromISO(isoTimestamp).startOf('day');
    return Math.ceil(target.diff(today, 'days').days);
}

/**
 * Generates an ISO timestamp using the current time rounded down to the nearest 5 minutes
 * and an optional datestamp for the date. Default is today's date.
 *
 * @param datestamp - Datestamp to use for the date. (YYYY-MM-DD)
 * @returns An ISO timestamp in UTC format.
 */
export function getIsoFromNowTimeRoundedDown5Minutes(datestamp?: string): string {
    const now = DateTime.local();
    const date = datestamp ? DateTime.fromISO(datestamp) : now;

    const roundedTime = now.set({
        minute: Math.floor(now.minute / 5) * 5,
        second: 0,
        millisecond: 0,
    });

    const combined = date.set({
        hour: roundedTime.hour,
        minute: roundedTime.minute,
        second: 0,
        millisecond: 0,
    });

    return combined.toUTC().toISO()!;
}

// ========================
// 4. Validation Functions
// ========================

/**
 * Validates if one time is earlier than another.
 * 
 * @param time1 - The first time string.
 * @param time2 - The second time string.
 * @returns True if time1 is earlier than time2, else false.
 */
export function isTimeEarlier(time1: string, time2: string): boolean {
    return time1.localeCompare(time2) < 0;
}

/**
 * Validates if one time is earlier than or equal to another.
 * 
 * @param time1 - The first time string.
 * @param time2 - The second time string.
 * @returns True if time1 is earlier than or equal to time2, else false.
 */
export function isTimeEarlierOrEqual(time1: string, time2: string): boolean {
    return time1.localeCompare(time2) <= 0;
}