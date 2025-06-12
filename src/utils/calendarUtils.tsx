import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { jotaiStore } from "app/_layout";
import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { extractNameFromBirthdayText, openMessage } from "./birthdayUtils";
import { datestampToMidnightDate, getNextEightDayDatestamps, isoToDatestamp } from "./dateUtils";
import { TCalendarData } from "@/lib/types/calendar/TCalendarData";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TEventChip } from "@/lib/types/planner/TEventChip";

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
function generatePlannerEvent(event: CalendarEventReadable, datestamp: string): IPlannerEvent {
    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate!);

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
        timeConfig: {
            startTime: event.startDate,
            endTime: event.endDate!,
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
function generateEventChip(event: CalendarEventReadable): TEventChip {
    const calendar = event.calendar!;

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
            timeConfig: {
                startTime: event.startDate,
                endTime: event.endDate!,
                allDay: !!event.allDay
            },
            color: calendar.color!,
            // Link all chips for the same calendar event together
            id: event.id,
            // Link all chips for the same calendar event to the same planner
            listId: isoToDatestamp(event.startDate),
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
function validateCalendarEvent(event: CalendarEventReadable, datestamp: string): boolean {
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
 * ✅ Determines if a calendar event should be displayed as an event chip for the given datestamp.
 * 
 * An event will be a chip if:
 * 1. It is an all-day event for the given date.
 * 3. It is a multi-day event that starts on, ends on, or spans the given date.
 * 
 * @param event - the calendar event to analyze
 * @param datestamp -  the date to consider
 * @returns - true if the event should be displayed on the given date as a chip, else false
 */
function validateEventChip(event: CalendarEventReadable, datestamp: string): boolean {
    if (!event.endDate || !event.startDate) return false;

    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

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

/**
 * ✅ Checks if the app has been granted access to the device calender.
 * If access is not granted, ask the user for permission.
 * 
 * @returns - true if access was granted, else false
 */
export async function getCalendarAccess(): Promise<boolean> { // TODO: handle no access granted
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            return false;
        }
        return true;
    }
    return true;
}

/**
 * ✅ Fetches an event from the device calendar, and converts it into a planner event.
 * 
 * @param eventId - the ID of the event within the calendar
 * @param datestamp - the date the event is expected to exist in
 * @returns - a planner event representing the calendar event
 */
export async function getCalendarEventById(eventId: string, datestamp: string): Promise<IPlannerEvent | null> {
    await getCalendarAccess();

    const calendarEvent = await RNCalendarEvents.findEventById(eventId);
    if (!calendarEvent) return null;

    return generatePlannerEvent(calendarEvent, datestamp);
}

// ------------- Jotai Store Utilities -------------

/**
 * ✅ Loads in all calendar data for the given range of dates.
 * The data will be stored directly into the Jotai store.
 * 
 * @param range - range of dates to parse the calendar with
 */
export async function loadCalendarData(range?: string[]) {
    const currentCalendarData = jotaiStore.get(calendarEventDataAtom);
    const datestamps = range ?? getNextEightDayDatestamps();

    await getCalendarAccess();

    const newCalendarData = generateEmptyCalendarDataMaps(datestamps);

    const startDate = new Date(`${datestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${datestamps[datestamps.length - 1]}T23:59:59`).toISOString();

    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate);

    datestamps.forEach((datestamp) => {
        // Use a temporary map to group chips by calendar for this datestamp
        const calendarChipGroups: Record<string, TEventChip[]> = {};

        calendarEvents.forEach((calEvent) => {
            if (validateEventChip(calEvent, datestamp)) {
                const calendarId = calEvent.calendar?.id || 'unknown';
                if (!calendarChipGroups[calendarId]) {
                    calendarChipGroups[calendarId] = [];
                }
                calendarChipGroups[calendarId].push(generateEventChip(calEvent));
            }

            if (validateCalendarEvent(calEvent, datestamp)) {
                newCalendarData.plannersMap[datestamp].push(generatePlannerEvent(calEvent, datestamp));
            }
        });

        // Push grouped calendar chips into a 2D array
        newCalendarData.chipsMap[datestamp] = Object.values(calendarChipGroups);
    });

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
