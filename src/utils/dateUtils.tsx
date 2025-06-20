import { DateTime } from 'luxon';

/**
 * ✅ Generates an array of datestamps encompassing the given start date, end date, and all days in between.
 * 
 * @param start - start of range YYYY-MM-DD
 * @param end - end of range YYYY-MM-DD
 * @returns - array of datestamps from start to end.
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
 * ✅ Determines if the given string is a valid datestamp.
 * 
 * @param datestamp - YYYY-MM-DD
 * @returns - true if valid, else false
 */
export function isDatestampValid(datestamp: string): boolean {
    const date = new Date(datestamp);
    return !isNaN(date.getTime());
}

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

    return dateTime.toUTC().toISO();
}

/**
 * ✅ Converts an ISO timestamp to a datestamp. (YYYY-MM-DD)
 * 
 * @param isoTimestamp - The ISO timestamp to convert.
 * @returns - Formatted datestamp. (YYYY-MM-DD)
 */
export function isoToDatestamp(isoTimestamp: string): string {
    return DateTime.fromISO(isoTimestamp).toISODate()!;
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
 * Returns true if time1 is earlier than time2.
 * Assumes both time strings are in the same format (ISO or HH:MM).
 * If either of the times doesn't exist, default to true (consider time1 as earlier).
 * 
 * @param time1 - The first time string.
 * @param time2 - The second time string.
 * @param equalMeansEarlier - Signifies if equal times means time1 can be considered earlier. Default is true.
 * @returns True if time1 is earlier or during time2, false otherwise.
 */
export function isTimeEarlier(
    time1: string | null,
    time2?: string | null,
    equalMeansEarlier = true
): boolean {
    if (!time1 || !time2) return true;
    const comp = time1.localeCompare(time2);
    return equalMeansEarlier ? comp <= 0 : comp < 0;
}

/**
 * ✅ Converts a datestamp to the day of the week for that local date.
 * 
 * @param datestamp - The timestamp (YYYY-MM-DD) to assess. 
 * @returns - The day of the week as a string. (e.g., 'Monday')
 */
export function datestampToDayOfWeek(datestamp: string): string {
    return DateTime.fromISO(datestamp).toFormat('cccc');
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
    return DateTime.local().minus({ days: 1 }).toISODate();
}

/**
 * Generates the timestamp for today's date in YYYY-MM-DD format.
 * @returns - today's timestamp YYYY-MM-DD
 */
export function getTodayDatestamp(): string {
    return DateTime.local().toISODate();
}

/**
 * Generates the timestamp for tomorrow's date in YYYY-MM-DD format.
 * @returns - tomorrow's timestamp YYYY-MM-DD
 */
export function getTomorrowDatestamp(): string {
    return DateTime.local().plus({ days: 1 }).toISODate();
}

/**
 * ✅ Generates an ISO timestamp in UTC format, using the current local time
 * (rounded down to the nearest 5 minutes) and an optional datestamp.
 *
 * @param datestamp - Optional datestamp (YYYY-MM-DD) to use for the date.
 * @returns ISO timestamp in UTC format rounded down to the nearest 5 minutes.
 */
export function getIsoRoundedDown5Minutes(datestamp?: string): string {
    const now = DateTime.local();
    const baseDate = datestamp ? DateTime.fromISO(datestamp) : now;

    const roundedTime = now.set({
        minute: Math.floor(now.minute / 5) * 5,
        second: 0,
        millisecond: 0,
    });

    const combined = baseDate.set({
        hour: roundedTime.hour,
        minute: roundedTime.minute,
        second: 0,
        millisecond: 0,
    });

    return combined.toUTC().toISO()!;
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
    const tomorrow = getTomorrowDatestamp();
    const eightDaysAfterTomorrow = DateTime.local().plus({ days: 8 }).toISODate();

    return generateDatestampRange(tomorrow, eightDaysAfterTomorrow);
}