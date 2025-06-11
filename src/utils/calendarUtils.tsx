import { calendarEventDataAtom } from "@/atoms/calendarEvents";
import { EItemStatus } from "@/enums/EItemStatus";
import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import { TPlanner } from "@/types/planner/TPlanner";
import { jotaiStore } from "app/_layout";
import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { EventChipProps } from "../components/EventChip";
import { extractNameFromBirthdayText, openMessage } from "./birthdayUtils";
import { datestampToDayOfWeek, datestampToMidnightDate, getNextEightDayDatestamps, isoToDatestamp } from "./dateUtils";

// ---------- Data Model Generation ----------

function getCalendarIcon(calendarName: string) {
    switch (calendarName) {
        case 'US Holidays':
            return 'globe';
        case 'Birthdays':
            return 'birthday';
        case 'Countdowns':
            return 'alert';
        default:
            return 'megaphone';
    }
}

/**
 * TODO comment
 * @param event 
 * @param datestamp 
 * @returns 
 */
function generatePlannerEvent(event: CalendarEventReadable, datestamp: string): IPlannerEvent {
    const dateStart = datestampToMidnightDate(datestamp);
    const dateEnd = datestampToMidnightDate(datestamp, 1);
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate!);
    const multiDayEnd = eventStart < dateStart && eventEnd < dateEnd; // Starts before date and ends on date
    const multiDayStart = eventStart >= dateStart && eventStart < dateEnd && eventEnd >= dateEnd; // Starts on date and ends after date
    return {
        id: event.id,
        value: event.title,
        sortId: 1, // temporary sort id -> will be overwritten
        listId: datestamp,
        timeConfig: {
            startTime: event.startDate,
            endTime: event.endDate!,
            allDay: false,
            multiDayEnd,
            multiDayStart
        },
        status: EItemStatus.STATIC
    };
}

/**
 * TODO: comment
 * @param event 
 * @param datestamp 
 * @param calendarDetails 
 * @returns 
 */
function generateEventChip(event: CalendarEventReadable): EventChipProps {
    const calendar = event.calendar!;

    console.log(event)

    const chipProps: EventChipProps = {
        label: event.title,
        iconConfig: {
            type: getCalendarIcon(calendar.title),
        },
        color: calendar.color,
        collapsed: true
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

export function generatePlanner(datestamp: string): TPlanner {
    return {
        datestamp,
        title: '',
        events: [],
        hideRecurring: false
    };
}

/**
 * TODO comment
 * @param event 
 * @param datestamp 
 * @returns 
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
 * Determines if an event should be displayed as a chip on a given date in a calendar.
 * 
 * An event will be kept if:
 * 1. It is an all-day event for the given date
 * 2. It is an all-day event that spans across the given date (starts before and ends after)
 * 3. It is a non-all-day event that starts on the given date and ends after the given date
 * 4. It is a non-all-day event that spans across the given date (starts before and ends after)
 * 
 * @param event The calendar event to validate
 * @param datestamp The date in string format to check against
 * @returns Returns true if the event should be displayed on the given date as a chip, false otherwise
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
            eventStart >= dateStart && eventStart < dateEnd && eventEnd > dateEnd // Starts on this date and ends after it OR
        ) || (
                eventStart < dateStart && eventEnd > dateStart // Spans across this date
            );
    }
}

// ---------- Calendar Interaction Utilities ----------

/**
 * Grants access to the device calendar.
 */
export async function getCalendarAccess() {
    const permissions = await RNCalendarEvents.checkPermissions();
    if (permissions !== 'authorized') {
        const status = await RNCalendarEvents.requestPermissions();
        if (status !== 'authorized') {
            throw new Error('Access denied to calendars.'); // TODO: just skip calendars if denied?
        }
    }
}

export function generateEmptyCalendarDataMaps(datestamps: string[]) {
    const chipsMap: Record<string, EventChipProps[]> = Object.fromEntries(
        datestamps.map((date) => [date, []])
    );

    const plannersMap: Record<string, IPlannerEvent[]> = Object.fromEntries(
        datestamps.map((date) => [date, []])
    );

    return { chipsMap, plannersMap };
}

// ------------- Jotai Store Utilities -------------

export async function loadCalendarData(range?: string[]) {
    const currentCalendarData = jotaiStore.get(calendarEventDataAtom);
    const datestamps = range ?? getNextEightDayDatestamps();

    await getCalendarAccess();

    const newCalendarData = generateEmptyCalendarDataMaps(datestamps);

    // Find the overall date range
    const startDate = new Date(`${datestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${datestamps[datestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range and format
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate);
    datestamps.forEach((datestamp) => {
        calendarEvents.forEach((calEvent) => {
            if (validateEventChip(calEvent, datestamp)) {
                newCalendarData.chipsMap[datestamp].push(generateEventChip(calEvent));
            }
            if (validateCalendarEvent(calEvent, datestamp)) {
                newCalendarData.plannersMap[datestamp].push(generatePlannerEvent(calEvent, datestamp));
            }
        })
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
};