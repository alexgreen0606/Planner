import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { TCalendarData } from "@/lib/types/calendar/TCalendarData";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TEventChip } from "@/lib/types/planner/TEventChip";
import { jotaiStore } from "app/_layout";
import * as Calendar from 'expo-calendar';
import { extractNameFromBirthdayText, openMessage } from "./birthdayUtils";
import { datestampToMidnightDate, isoToDatestamp } from "./dateUtils";
import { EListType } from "@/lib/enums/EListType";
import { DateTime } from "luxon";
import { hasCalendarAccess } from "./accessUtils";

// ---------- Utilities ----------

/**
 * ✅ Generates empty calendar data for the given range of dates.
 * 
 * @param datestamps - the range of datestamps
 * @returns - empty calendar data
 */
function generateEmptyCalendarDataMaps(datestamps: string[]): TCalendarData {
    const chipsMap: Record<string, TEventChip[][]> = {};
    const plannersMap: Record<string, IPlannerEvent[]> = {};

    datestamps.forEach(datestamp => {
        chipsMap[datestamp] = [];
        plannersMap[datestamp] = [];
    });

    return { chipsMap, plannersMap };
}

/**
 * ✅ Generates a planner event out of a calendar event.
 * 
 * @param event - the calendar event to parse
 * @param datestamp - the datestamp the planner event will reside
 * @returns - a new planner event
 */
function generatePlannerEvent(event: Calendar.Event, datestamp: string): IPlannerEvent {
    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);

    const eventStart = DateTime.fromISO(event.startDate as string).toLocal().toJSDate();
    const eventEnd = DateTime.fromISO(event.endDate as string).toLocal().toJSDate();

    // TODO: just compare strings directly?

    const multiDayEnd =
        // Starts before date
        eventStart < dateStart &&
        // Ends on date
        eventEnd < dateEnd;

    const multiDayStart =
        // Starts on date
        eventStart >= dateStart && eventStart < dateEnd &&
        // Ends after date
        eventEnd >= dateEnd;

    return {
        id: event.id,
        value: event.title,
        sortId: 1, // temporary sort id (will be overwritten)
        listId: datestamp,
        listType: EListType.PLANNER,
        timeConfig: {
            startIso: eventStart.toISOString(),
            endIso: eventEnd.toISOString(),
            allDay: Boolean(event.allDay),
            multiDayEnd,
            multiDayStart
        },
        status: EItemStatus.STATIC
    };
}

/**
 * ✅ Generates an event chip from a calendar event.
 * 
 * @param event - the calendar event to parse
 * @returns - an event chip representing the calendar event
 */
function generateEventChip(event: Calendar.Event, calendar: Calendar.Calendar): TEventChip {

    const chipProps: TEventChip = {
        label: event.title,
        iconConfig: {
            type: calendarIconMap[calendar.title] ?? 'calendar',
        },
        color: calendar.color
    };

    if (calendar.title === 'Birthdays') {
        chipProps.onClick = () => openMessage(extractNameFromBirthdayText(event.title));
    }

    if (calendar.isPrimary || calendar.title === 'Calendar') {
        chipProps.planEvent = {
            status: EItemStatus.STATIC,
            sortId: 1,
            calendarId: event.id,
            value: event.title,
            listType: EListType.PLANNER,
            timeConfig: {
                startIso: event.startDate as string,
                endIso: event.endDate as string,
                allDay: event.allDay
            },
            color: calendar.color!,
            // Link all chips for the same calendar event together
            id: event.id,
            // Link all chips for the same calendar event to the same planner
            listId: isoToDatestamp(event.startDate as string),
        };
    }

    return chipProps;
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

    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);
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

    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);

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

/**
 * ✅ Fetches an event from the device calendar, and converts it into a planner event.
 * 
 * @param eventId - the ID of the event within the calendar
 * @param datestamp - the date the event is expected to exist in
 * @returns - a planner event representing the calendar event
 */
export async function getCalendarEventById(eventId: string, datestamp: string): Promise<IPlannerEvent | null> {
    if (!hasCalendarAccess()) return null;

    const calendarEvent = await Calendar.getEventAsync(eventId);
    if (!calendarEvent) return null;

    return generatePlannerEvent(calendarEvent, datestamp);
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
        const calendarChipGroups: Record<string, TEventChip[]> = {};

        calendarEvents.forEach((calEvent) => {
            if (validateEventChip(calEvent, datestamp)) {
                const calendarId = calEvent.calendarId;
                if (!calendarChipGroups[calendarId]) {
                    calendarChipGroups[calendarId] = [];
                }
                calendarChipGroups[calendarId].push(generateEventChip(calEvent, allCalendarsMap[calendarId]));
            }

            if (validateCalendarEvent(calEvent, datestamp)) {
                newCalendarData.plannersMap[datestamp].push(generatePlannerEvent(calEvent, datestamp));
            }
        });

        // Push grouped calendar chips into a 2D array
        newCalendarData.chipsMap[datestamp] = Object.values(calendarChipGroups);
    });

    mergeCalendarDataAndSave(newCalendarData);
}
