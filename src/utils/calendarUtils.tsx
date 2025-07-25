import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { TCalendarData } from "@/lib/types/calendar/TCalendarData";
import { TCalendarEventChip } from "@/lib/types/calendar/TCalendarEventChip";
import { jotaiStore } from "app/_layout";
import * as Calendar from 'expo-calendar';
import { Event as CalendarEvent } from 'expo-calendar';
import { DateTime } from "luxon";
import { hasCalendarAccess } from "./accessUtils";
import { datestampToMidnightJsDate } from "./dateUtils";
import { mapCalendarEventToPlannerChip } from "./map/mapCalendarEventToPlannerChip";

// ---------- Utilities ----------

/**
 * ✅ Generates an empty Calendar event map.
 * 
 * @param datestamps - The list of datestamp keys.
 * @returns - A Calendar event map with an empty list for each datestamp.
 */
function generateEmptyCalendarDataMaps(datestamps: string[]): TCalendarData {
    const chipsMap: Record<string, TCalendarEventChip[][]> = {};
    const plannersMap: Record<string, CalendarEvent[]> = {};

    datestamps.forEach(datestamp => {
        chipsMap[datestamp] = [];
        plannersMap[datestamp] = [];
    });

    return { chipsMap, plannersMap };
}

/**
 * ✅ Determines if a calendar event should be displayed in the planner of the given datestamp.
 * 
 * @param event - the calendar event to analyze
 * @param datestamp - the date to consider
 * @returns - true if the event should be an event chip, else false
 */
function validateCalendarEvent(event: Calendar.Event, datestamp: string): boolean {
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
 * An event will be a chip if:
 * 1. It is an all-day event for the given date.
 * 3. It is a multi-day event that starts on, ends on, or spans the given date.
 * 
 * @param event - the calendar event to analyze
 * @param datestamp -  the date to consider
 * @returns - true if the event should be displayed on the given date as a chip, else false
 */
function validateEventChip(event: Calendar.Event, datestamp: string): boolean {
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

// ---------- Calendar Interaction Utilities ----------

export async function getCalendarMap(): Promise<Record<string, Calendar.Calendar>> {
    const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarMap = allCalendars.reduce((acc, cal) => {
        acc[cal.id] = cal;
        return acc;
    }, {} as Record<string, Calendar.Calendar>);
    return calendarMap;
}

// ------------- Jotai Store Utilities -------------

export async function getPrimaryCalendarId(): Promise<string> {
    const primaryCalendar = await Calendar.getDefaultCalendarAsync();
    return primaryCalendar.id;
}

/**
 * ✅ Merges new calendar data with current calendar data and sets it in the Jotai store.
 * New date data will take precedence and older date data that is not in the new
 * data will persist.
 * 
 * @param newCalendarData - the new calendar data to save
 */
async function mergeCalendarDataAndSave(newCalendarData: TCalendarData) {
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
 * Loads in all calendar data for the given range of dates.
 * The data will be stored directly into the Jotai store.
 * 
 * @param range - range of dates to parse the calendar with
 */
export async function loadCalendarData(datestamps: string[]) {
    if (datestamps.length === 0) return;
    console.log(datestamps, 'LOADING')
    const newCalendarData = generateEmptyCalendarDataMaps(datestamps);

    if (!hasCalendarAccess()) {
        mergeCalendarDataAndSave(newCalendarData);
        return;
    }

    const allCalendarsMap = await getCalendarMap();

    const allCalendarIds = Object.keys(allCalendarsMap);
    const startDate = DateTime.fromISO(datestamps[0]).startOf('day').toJSDate();
    const endDate = DateTime.fromISO(datestamps[datestamps.length - 1]).endOf('day').toJSDate();

    const calendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);

    datestamps.forEach((datestamp) => {
        // Use a temporary map to group chips by calendar for this datestamp
        const calendarChipGroups: Record<string, TCalendarEventChip[]> = {};

        calendarEvents.forEach((calEvent) => {
            if (validateEventChip(calEvent, datestamp)) {
                const calendarId = calEvent.calendarId;
                if (!calendarChipGroups[calendarId]) {
                    calendarChipGroups[calendarId] = [];
                }
                calendarChipGroups[calendarId].push(mapCalendarEventToPlannerChip(calEvent, allCalendarsMap[calendarId], datestamp));
            }

            if (validateCalendarEvent(calEvent, datestamp)) {
                newCalendarData.plannersMap[datestamp].push(calEvent);
            }
        });

        // Push grouped calendar chips into a 2D array
        newCalendarData.chipsMap[datestamp] = Object.values(calendarChipGroups);
    });

    mergeCalendarDataAndSave(newCalendarData);
}
