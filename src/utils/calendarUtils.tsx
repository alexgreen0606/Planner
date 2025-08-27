import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { TCalendarData } from "@/lib/types/calendar/TCalendarData";
import { TCalendarEventChip } from "@/lib/types/calendar/TCalendarEventChip";
import { jotaiStore } from "app/_layout";
import * as Calendar from 'expo-calendar';
import { Event as CalendarEvent } from 'expo-calendar';
import { DateTime } from "luxon";
import { hasCalendarAccess, hasContactsAccess } from "./accessUtils";
import { extractNameFromBirthdayText, openMessageForContact } from "./birthdayUtils";
import { datestampToMidnightJsDate } from "./dateUtils";
import { openPlannerTimeModal } from "./plannerUtils";

// ✅ 

// ====================
// 1. Helper Functions
// ====================

/**
 * Merges new calendar data with current calendar data and sets it in the Jotai store.
 * 
 * @param newCalendarData - The calendar data to save.
 */
async function saveCalendarDataToStore(newCalendarData: TCalendarData) {
    const currentCalendarData = jotaiStore.get(calendarEventDataAtom);
    jotaiStore.set(calendarEventDataAtom, {
        chipsMap: {
            ...currentCalendarData.chipsMap,
            ...newCalendarData.chipsMap
        },
        plannersMap: {
            ...currentCalendarData.plannersMap,
            ...newCalendarData.plannersMap
        }
    });
}

/**
 * Generates empty calendar data for the given dates.
 * 
 * @param datestamps - The list of datestamp keys.
 * @returns An object representing empty calendar data for the given dates.
 */
function generateEmptyCalendarData(datestamps: string[]): TCalendarData {
    const chipsMap: Record<string, TCalendarEventChip[][]> = {};
    const plannersMap: Record<string, CalendarEvent[]> = {};

    datestamps.forEach(datestamp => {
        chipsMap[datestamp] = [];
        plannersMap[datestamp] = [];
    });

    return { chipsMap, plannersMap };
}

/**
 * Validates if a calendar event should be displayed in the planner of the given datestamp.
 * 
 * @param event - The calendar event to analyze.
 * @param datestamp - The date to consider. (YYYY-MM-DD)
 * @returns True if the event should be in the given planner, else false.
 */
function isPlannerEvent(event: Calendar.Event, datestamp: string): boolean {
    if (event.allDay || !event.endDate) return false;

    const dateStart = datestampToMidnightJsDate(datestamp);
    const dateEnd = datestampToMidnightJsDate(datestamp, 1);
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

    return (
        eventStart >= dateStart && eventStart < dateEnd // Starts on this date OR
    ) || (
            eventEnd >= dateStart && eventEnd < dateEnd // Ends on this date
        );
}

/**
 * Determines if a calendar event should be displayed as an event chip for the given datestamp.
 * 
 * An event will be a chip if it is an all-day event for the given date or it is a multi-day event that 
 * starts on, ends on, or spans the given date.
 *
 * @param event - The calendar event to analyze.
 * @param datestamp - The date to consider. (YYYY-MM-DD)
 * @returns True if the event should be displayed on the given date as a chip, else false.
 */
function isEventChip(event: Calendar.Event, datestamp: string): boolean {
    if (!event.endDate || !event.startDate) return false;

    const dateStart = datestampToMidnightJsDate(datestamp);
    const dateEnd = datestampToMidnightJsDate(datestamp, 1);

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

    // TODO: USE LUXON

    if (event.allDay) {
        // For all-day events, compare dates without time
        const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
        const checkDate = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());

        return eventStartDate <= checkDate && eventEndDate >= checkDate;
    } else {
        return (
            // Starts on this date
            eventStart >= dateStart && eventStart < dateEnd &&
            // Ends after it
            eventEnd > dateEnd
        ) || (
                // Spans across this date
                eventStart < dateStart && eventEnd > dateStart
            );
    }
}

/**
 * Maps a calendar event to an event chip for a given planner.
 * 
 * @param event - The calendar event to map.
 * @param calendar - The calendar the event is from.
 * @param datestamp - The key of the planner where the chip will reside.
 * @returns A planner event chip representing the calendar event.
 */
function mapCalendarEventToPlannerChip(event: Calendar.Event, calendar: Calendar.Calendar, datestamp: string): TCalendarEventChip {
    const { title: calendarTitle, color } = calendar;

    const calendarEventChip: TCalendarEventChip = {
        event,
        color,
        iconConfig: {
            type: calendarIconMap[calendarTitle] ?? 'calendar'
        }
    };

    if (calendar.title === 'Birthdays') {
        calendarEventChip.onClick = () => openMessageForContact(extractNameFromBirthdayText(event.title), 'Happy Birthday!');
        calendarEventChip.hasClickAccess = hasContactsAccess();
    }

    if (calendar.isPrimary || calendar.title === 'Calendar') {
        calendarEventChip.onClick = () => openPlannerTimeModal(event.id, datestamp);
    }

    return calendarEventChip;
}

// ==========================
// 2. Calendar Load Function
// ==========================

/**
 * Loads in all calendar data for the given range of dates and saves it to the Jotai store.
 * 
 * @param range - range of dates to parse the calendar with
 */
export async function loadCalendarDataToStore(datestamps: string[]) {
    if (datestamps.length === 0) return;

    const newCalendarData = generateEmptyCalendarData(datestamps);

    if (!hasCalendarAccess()) {
        saveCalendarDataToStore(newCalendarData);
        return;
    }

    const allCalendarsMap = await generateCalendarIdToCalendarMap();

    const allCalendarIds = Object.keys(allCalendarsMap);
    const startDate = DateTime.fromISO(datestamps[0]).startOf('day').toJSDate();
    const endDate = DateTime.fromISO(datestamps[datestamps.length - 1]).endOf('day').toJSDate();

    const calendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);

    datestamps.forEach((datestamp) => {
        // Use a temporary map to group chips by calendar for this datestamp
        const calendarChipGroups: Record<string, TCalendarEventChip[]> = {};

        calendarEvents.forEach((calEvent) => {
            if (isEventChip(calEvent, datestamp)) {
                const calendarId = calEvent.calendarId;
                if (!calendarChipGroups[calendarId]) {
                    calendarChipGroups[calendarId] = [];
                }
                calendarChipGroups[calendarId].push(mapCalendarEventToPlannerChip(calEvent, allCalendarsMap[calendarId], datestamp));
            }

            if (isPlannerEvent(calEvent, datestamp)) {
                newCalendarData.plannersMap[datestamp].push(calEvent);
            }
        });

        // Push grouped calendar chips into a 2D array
        newCalendarData.chipsMap[datestamp] = Object.values(calendarChipGroups);
    });

    saveCalendarDataToStore(newCalendarData);
}

// ===================
// 3. Getter Function
// ===================

/**
 * Gets the device calendar ID for the primary calendar.
 * 
 * @returns The ID of the primary calendar.
 */
export async function getPrimaryCalendarId(): Promise<string> {
    const primaryCalendar = await Calendar.getDefaultCalendarAsync();
    return primaryCalendar.id;
}

// =======================
// 4. Generation Function
// =======================

/**
 * Generates a map of the device's calendar IDs to Calendar objects.
 * 
 * @returns A map of calendar IDs to Calendar objects.
 */
export async function generateCalendarIdToCalendarMap(): Promise<Record<string, Calendar.Calendar>> {
    const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarMap = allCalendars.reduce((acc, cal) => {
        acc[cal.id] = cal;
        return acc;
    }, {} as Record<string, Calendar.Calendar>);
    return calendarMap;
}