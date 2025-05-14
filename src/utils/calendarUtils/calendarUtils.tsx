import { uuid } from "expo-modules-core";
import RNCalendarEvents, { CalendarEventReadable } from "react-native-calendar-events";
import { EventChipProps } from "../../components/EventChip";
import { extractNameFromBirthdayText, openMessage } from "../../feature/birthdayCard/utils";
import { datestampToDayOfWeek, datestampToMidnightDate, generateSortIdByTime, isoToDatestamp, timeValueToIso } from "./timestampUtils";
import { EItemStatus } from "@/enums/EItemStatus";
import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import { TPlanner } from "@/types/planner/TPlanner";
import { TCalendarData } from "@/types/calendar/TCalendarData";
import { IRecurringEvent } from "@/types/listItems/IRecurringEvent";

// ---------- Data Model Generation ----------

function getCalendarIcon(calendarName: string) {
    switch (calendarName) {
        case 'US Holidays':
            return 'globe';
        case 'Birthdays':
            return 'birthday';
        case 'Deadlines':
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

    const chipProps: EventChipProps = {
        label: event.title,
        iconConfig: {
            type: getCalendarIcon(calendar.title),
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

export function generatePlanner(datestamp: string): TPlanner {
    return {
        datestamp,
        title: datestampToDayOfWeek(datestamp),
        events: [],
        excludeRecurring: false
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

/**
 *TODO: comment
 * @param datestamps - YYYY-MM-DD
 */
export async function loadCalendarEventData(datestamps: string[]): Promise<TCalendarData> {
    await getCalendarAccess();

    const calendarData = generateEmptyCalendarDataMaps(datestamps);

    // Find the overall date range
    const startDate = new Date(`${datestamps[0]}T00:00:00`).toISOString();
    const endDate = new Date(`${datestamps[datestamps.length - 1]}T23:59:59`).toISOString();

    // Fetch all events in the date range and format
    const calendarEvents = await RNCalendarEvents.fetchAllEvents(startDate, endDate);
    datestamps.forEach((datestamp) => {
        calendarEvents.forEach((calEvent) => {
            if (validateEventChip(calEvent, datestamp)) {
                calendarData.chipsMap[datestamp].push(generateEventChip(calEvent));
            }
            if (validateCalendarEvent(calEvent, datestamp)) {
                calendarData.plannersMap[datestamp].push(generatePlannerEvent(calEvent, datestamp));
            }
        })
    });
    return calendarData;
}

// ---------- List Synchronization ----------

/**
 * Syncs an existing planner with a calendar. Calendars have final say on the state of the events.
 * @param calendar - the events to sync within the existing planner
 * @param plannerEvents - the planner being updated
 * @param timestamp
 * @returns - the new planner synced with the calendar
 */
export function syncPlannerWithCalendar(
    calendar: IPlannerEvent[],
    plannerEvents: IPlannerEvent[],
    timestamp: string
) {
    // console.info('syncPlannerWithCalendar: START', { calendar, planner, timestamp });

    // Loop over the existing planner, removing any calendar events that no longer exist
    // in the new device calendar. All existing linked events will also be updated to reflect the
    // calendar.
    const newPlanner = plannerEvents.reduce<IPlannerEvent[]>((accumulator, planEvent) => {

        // This event isn't related to the calendar -> keep it
        if (!planEvent.calendarId || planEvent.status === EItemStatus.HIDDEN) {
            return [...accumulator, planEvent];
        }

        // This event is linked to the calendar and still exists -> update it
        const calEvent = calendar.find(calEvent => calEvent.id === planEvent.calendarId);
        if (calEvent) {
            // Generate an updated record of the calendar event
            const updatedEvent = {
                ...planEvent,
                timeConfig: calEvent.timeConfig,
                value: calEvent.value,
            }

            // Add the updated event to the current planner
            const updatedPlanner = [...accumulator, updatedEvent];

            // Generate the updated event's new position in the list
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
            return updatedPlanner;
        } else {
            // This event is linked to the calendar but has been removed -> delete it
            return [...accumulator];
        }
    }, []);

    // Find any new events in the calendar and add these to the new planner
    calendar.forEach(calEvent => {
        if (!newPlanner.find(planEvent => planEvent.calendarId === calEvent.id)) {

            // Generate a new record to represent the calendar event
            const newEvent = {
                ...calEvent,
                listId: timestamp,
                calendarId: calEvent.id
            };

            // Add the new event to the planner and generate its position within the list
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTime(newEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithCalendar: END', newPlanner);
    return newPlanner;
}

/**
 * Syncs an existing planner with the recurring weekday planner. The recurring planner has
 * final say on the state of the events. If a recurring event is manually deleted from a planner, 
 * it will remain deleted.
 * @param recurringPlanner - the events to sync within the existing planner
 * @param plannerEvents - the planner being updated
 * @param timestamp
 * @returns - the new planner synced with the recurring events
 */
export function syncPlannerWithRecurring(
    recurringPlanner: IRecurringEvent[],
    plannerEvents: IPlannerEvent[],
    timestamp: string
) {
    // console.info('syncPlannerWithRecurring: START', { recurringPlanner, planner, timestamp })

    function getRecurringEventTimeConfig(recEvent: IRecurringEvent) {
        return {
            startTime: timeValueToIso(timestamp, recEvent.startTime!),
            allDay: false,
            endTime: timeValueToIso(timestamp, '23:55'),
            isCalendarEvent: false
        }
    };

    // Build the new planner out of the recurring planner. All recurring events will prioritize the
    // recurring planner's values.
    const newPlanner = recurringPlanner.reduce<IRecurringEvent[]>((accumulator, recEvent) => {
        const planEvent = plannerEvents.find(planEvent => planEvent.recurringId === recEvent.id);

        if (planEvent?.status === EItemStatus.HIDDEN) {
            // This event has been manually deleted -> keep it deleted
            return [...accumulator, planEvent];
        }

        if (planEvent) {
            // This recurring event is in the current planner -> update it
            const updatedEvent: IPlannerEvent = {
                id: planEvent.id,
                listId: timestamp,
                status: planEvent.status,
                sortId: planEvent.sortId,
                recurringId: recEvent.id,
                value: recEvent.value,
            };

            // Add event time
            if (planEvent.timeConfig) {
                updatedEvent.timeConfig = planEvent.timeConfig;
            } else if (recEvent.startTime) {
                updatedEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Add calendar link
            if (planEvent.calendarId) {
                updatedEvent.calendarId = planEvent.calendarId;
            }

            // Add sort position
            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);

            return updatedPlanner;
        } else {
            // This recurring event hasn't been added to the planner yet -> add it 
            const newEvent: IPlannerEvent = {
                id: uuid.v4(),
                listId: timestamp,
                recurringId: recEvent.id,
                value: recEvent.value,
                sortId: recEvent.sortId,
                status: recEvent.status
            };

            // Add event time
            if (recEvent.startTime) {
                newEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Add sort position
            const updatedPlanner = [...accumulator, newEvent];
            newEvent.sortId = generateSortIdByTime(newEvent, updatedPlanner);

            return updatedPlanner;
        }
    }, []);

    // Add in any existing events that aren't recurring
    plannerEvents.forEach(existingPlanEvent => {
        if (!newPlanner.find(planEvent => planEvent.id === existingPlanEvent.id)) {
            newPlanner.push(existingPlanEvent);
            existingPlanEvent.sortId = generateSortIdByTime(existingPlanEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithRecurring: END', newPlanner);
    return newPlanner;
}