import { plannerChipsAtom } from "@/atoms/plannerChips";
import { textfieldIdAtom } from "@/atoms/textfieldId";
import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { TPlannerChipMap } from "@/lib/types/externalData/TPlannerChipMap";
import { TPlannerChip } from "@/lib/types/planner/TPlannerChip";
import { jotaiStore } from "app/_layout";
import * as Calendar from 'expo-calendar';
import { Event as CalendarEvent } from 'expo-calendar';
import { router } from "expo-router";
import { DateTime } from "luxon";
import { hasCalendarAccess } from "./accessUtils";
import { extractNameFromBirthdayText, openMessageForContact } from "./birthdayUtils";
import { getDatestampOneYearFromToday, getDayShiftedDatestamp, getTodayDatestamp, isoToDatestamp, isTimeEarlier, isTimeEarlierOrEqual } from "./dateUtils";
import { openPlannerTimeModal, upsertCalendarEventsIntoPlanner } from "./plannerUtils";
import { upcomingDatesMapAtom, calendarMapAtom } from "@/atoms/calendarAtoms";

// ✅ 

// ====================
// 1. Helper Functions
// ====================

/**
 * Merges new planner chip data with current data and sets it in the Jotai store.
 * 
 * @param chipMap - The planner chip data to save.
 */
function savePlannerChipsToStore(chipMap: TPlannerChipMap) {
    const prevChipMap = jotaiStore.get(plannerChipsAtom);
    jotaiStore.set(plannerChipsAtom, {
        ...prevChipMap,
        ...chipMap
    });
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

    const nextDayDatestamp = getDayShiftedDatestamp(datestamp, 1);

    const eventStartsOnThisDay = isTimeEarlierOrEqual(datestamp, event.startDate as string) &&
        isTimeEarlier(event.startDate as string, nextDayDatestamp);

    const eventEndsOnThisDay = isTimeEarlierOrEqual(datestamp, event.endDate as string) &&
        isTimeEarlier(event.endDate as string, nextDayDatestamp)

    return (eventStartsOnThisDay || eventEndsOnThisDay);
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

    if (event.allDay) {
        const eventStartDatestamp = isoToDatestamp(event.startDate as string);
        const eventEndDatestamp = isoToDatestamp(event.endDate as string);

        return (
            isTimeEarlierOrEqual(eventStartDatestamp, datestamp) &&
            isTimeEarlierOrEqual(datestamp, eventEndDatestamp)
        )
    } else {
        const nextDayDatestamp = getDayShiftedDatestamp(datestamp, 1);

        return (
            isTimeEarlier(event.startDate as string, nextDayDatestamp) &&
            isTimeEarlier(datestamp, event.endDate as string)
        )
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
function mapCalendarEventToPlannerChip(event: Calendar.Event, calendar: Calendar.Calendar, datestamp: string): TPlannerChip {
    const { title: calendarTitle, color } = calendar;

    const calendarEventChip: TPlannerChip = {
        title: event.title,
        id: event.id,
        color,
        iconConfig: {
            name: calendarIconMap[calendarTitle] ?? 'calendar'
        }
    };

    if (calendar.title === 'Birthdays') {
        calendarEventChip.onClick = () => openMessageForContact(extractNameFromBirthdayText(event.title), 'Happy Birthday!');
    }

    if (calendar.isPrimary || calendar.title === 'Calendar') {
        calendarEventChip.onClick = () => openPlannerTimeModal(event.id, datestamp);
    }

    if (false && calendar.title === 'UpcomingDates') {
        calendarEventChip.onClick = () => {

            // TODO: change this to just open a modal if possible.
            router.push('/planners/upcomingDates');
        };
    }

    return calendarEventChip;
}

/**
 * Fetches all future and current all-day events from all calendars on the device.
 * 
 * @returns All all-day calendar events from all device calendars from today until 1 year from now.
 */
async function getAllDayEventsFromCalendarsForNextYear(): Promise<Calendar.Event[]> {
    if (!hasCalendarAccess()) {
        return [];
    }

    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampOneYearFromToday()}T23:59:59`);

    const allCalendarsMap = await getCalendarMap();
    const allCalendarIds = Object.keys(allCalendarsMap);

    const allCalendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);
    const allDayEvents = allCalendarEvents.filter(event => event.allDay === true);

    return allDayEvents;
}

// ===========================
// 2. Calendar Load Functions
// ===========================

/**
 * Loads in all calendar data for the given range of dates and saves it to the Jotai store. If the user has not granted
 * calendar access, all calendar events will be removed from the planners.
 * 
 * @param range - The range of dates to parse the calendar with.
 */
export async function loadExternalCalendarData(datestamps: string[]) {
    if (datestamps.length === 0) return;

    const plannerChipMap: Record<string, TPlannerChip[][]> = {};
    const calendarEventMap: Record<string, CalendarEvent[]> = {};
    datestamps.forEach(datestamp => {
        plannerChipMap[datestamp] = [];
        calendarEventMap[datestamp] = [];
    });

    if (hasCalendarAccess()) {

        const allCalendarsMap = await getCalendarMap();
        const allCalendarIds = Object.keys(allCalendarsMap);
        const startDate = DateTime.fromISO(datestamps[0]).startOf('day').toJSDate();
        const endDate = DateTime.fromISO(datestamps[datestamps.length - 1]).endOf('day').toJSDate();
        const calendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);

        // Phase 2: Organize the calendar events by datestamp.
        datestamps.forEach((datestamp) => {
            const calendarChipGroups: Record<string, TPlannerChip[]> = {};

            calendarEvents.forEach((calendarEvent) => {

                if (isEventChip(calendarEvent, datestamp)) {
                    const calendarId = calendarEvent.calendarId;
                    if (!calendarChipGroups[calendarId]) {
                        calendarChipGroups[calendarId] = [];
                    }
                    calendarChipGroups[calendarId].push(mapCalendarEventToPlannerChip(calendarEvent, allCalendarsMap[calendarId], datestamp));
                }

                if (isPlannerEvent(calendarEvent, datestamp)) {
                    calendarEventMap[datestamp].push(calendarEvent);
                }

            });

            // Push grouped calendar chips into a 2D array
            plannerChipMap[datestamp] = Object.values(calendarChipGroups);
        });

    }

    // Phase 3: Save the planner chips to the store. (No storage records required).
    savePlannerChipsToStore(plannerChipMap);

    // Phase 4: Update all the planners linked to the calendar events.
    datestamps.forEach((datestamp) => {
        upsertCalendarEventsIntoPlanner(datestamp, calendarEventMap[datestamp]);
    });

}

/**
 * Loads all upcoming all-day events from the calendar and organizes them by date into the store.
 * Also ensures the calendarMapAtom is populated with all calendars.
 */
export async function loadAllDayEventsToStore(): Promise<void> {
    try {
        // First, ensure calendar map is populated
        const calendarMap = await getCalendarMap();
        jotaiStore.set(calendarMapAtom, calendarMap);

        // Get all upcoming all-day events
        const allDayEvents = await getAllDayEventsFromCalendarsForNextYear();

        // Group events by datestamp (YYYY-MM-DD)
        const eventsByDate: Record<string, Calendar.Event[]> = {};

        for (const event of allDayEvents) {
            // Extract date from event's startDate
            // startDate is in ISO format, so we extract the date part
            const eventDate = new Date(event.startDate);
            const datestamp = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            if (!eventsByDate[datestamp]) {
                eventsByDate[datestamp] = [];
            }
            eventsByDate[datestamp].push(event);
        }

        // Sort events within each date by title or start time for consistent ordering
        Object.keys(eventsByDate).forEach(date => {
            eventsByDate[date].sort((a, b) => {
                // First sort by time if they have different times (unlikely for all-day events)
                const timeCompare = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                if (timeCompare !== 0) return timeCompare;

                // Then sort alphabetically by title
                return (a.title || '').localeCompare(b.title || '');
            });
        });

        // Update the atom with the grouped events
        jotaiStore.set(upcomingDatesMapAtom, eventsByDate);

    } catch (error) {
        console.error('Error loading all-day events to store:', error);
        // Set empty object on error
        jotaiStore.set(upcomingDatesMapAtom, {});
    }
}

// =================
// 4. Read Function
// =================

/**
 * Gets the device's primary calendar.
 * 
 * @returns The primary calendar object.
 */
export async function getPrimaryCalendar(): Promise<Calendar.Calendar> {
    return await Calendar.getDefaultCalendarAsync();
}

/**
 * Generates a map of the device's calendar IDs and titles to calendars.
 * Each calendar can be accessed by both its ID and its title.
 * 
 * @returns A map of calendar IDs and titles to Calendar objects.
 */
export async function getCalendarMap(): Promise<Record<string, Calendar.Calendar>> {
    const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarMap = allCalendars.reduce((acc, cal) => {
        acc[cal.id] = cal;
        acc[cal.title] = cal;
        return acc;
    }, {} as Record<string, Calendar.Calendar>);
    return calendarMap;
}

/**
 * Gets the device calendar ID for the primary calendar.
 * 
 * @returns The ID of the primary calendar.
 */
export async function getPrimaryCalendarId(): Promise<string> {
    const primaryCalendar = await getPrimaryCalendar();
    return primaryCalendar.id;
}
