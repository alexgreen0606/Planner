
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { ToolbarIcon } from '@/components/lists/components/ListToolbar';
import TimeValue from '@/components/text/TimeValue';
import { NULL } from '@/lib/constants/generic';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListType } from '@/lib/enums/EListType';
import { TDateRange, IPlannerEvent, ITimeConfig } from '@/lib/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { getCarryoverEventsAndCleanStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { getRecurringPlannerFromStorage } from '@/storage/recurringPlannerStorage';
import { jotaiStore } from 'app/_layout';
import { Event as CalendarEvent } from 'expo-calendar';
import { uuid } from 'expo-modules-core';
import { Router } from 'expo-router';
import { hasCalendarAccess } from './accessUtils';
import { datestampToDayOfWeek, datestampToMidnightDate, getTodayDatestamp, isTimeEarlier, timeValueToIso } from './dateUtils';
import { generateSortId, sanitizeList } from './listUtils';
import { mapCalendarEventToPlannerEvent } from './map/mapCalenderEventToPlannerEvent';
import { TIME_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { ICountdown } from '@/lib/types/listItems/ICountdown';

// ------------- Utilities -------------

/**
 * ✅ Gets all the datestamps for the Planners that are currently rendered
 * and loaded in from the calendar.
 * 
 * @returns - A list of all planner datestamps currently mounted.
 */
export function getAllMountedDatestamps(): string[] {
    return jotaiStore.get(mountedDatestampsAtom).all;
}

type ExtractedTime = {
    timeConfig: ITimeConfig | undefined;
    updatedText: string;
}

/**
 * ✅ Parses the given text to find any time values (HH:MM (PM or AM)) case insensitive. 
 * If one exists, it will be removed from the string and a time object will be generated 
 * representing this time of day. The sanitized string and time object will be returned.
 * 
 * When a @datestamp is provided, the time object will be in ISO format. Otherwise,
 * the time values will be HH:MM format.
 * 
 * @param text - user input
 * @param datestamp - a date to use when generating timestamps
 * @returns - the text with the time value removed, and a time object representing the time value
 */
function extractTimeValueFromString(text: string, datestamp?: string): ExtractedTime {
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

        timeConfig = {
            startIso: datestamp ? timeValueToIso(datestamp, formattedTime) : formattedTime,
            endIso: datestamp ? timeValueToIso(datestamp, "23:55") : "23:55",
            allDay: false,
        };
    }

    return { timeConfig, updatedText };
}

/**
 * Parses the given event and returns the start time of the event, or null if none exists.
 * Works for both planner and recurring events (iso or time values [HH:MM]).
 * 
 * @param event - the event to parse 
 * @returns - the item's time value if one exists, else null
 */
function extractEventTime(event: IPlannerEvent | IRecurringEvent | ICountdown | undefined): string | null {
    if (!event) return null;

    if ("timeConfig" in event) {
        return event.timeConfig?.multiDayEnd ? event.timeConfig.endIso : event.timeConfig?.startIso ?? null;
    } else if ("startTime" in event) {
        return event.startTime ?? null;
    } else if ("startIso" in event) {
        return event.startIso ?? null;
    } else {
        return null;
    }
}

/**
 * ✅ Finds all mounted datestamps linked to a list of date ranges.
 * 
 * @param ranges - The list of ranges to weigh against the mounted datestamps.
 * @returns - A list of mounted datestamps within any of the ranges given.
 */
export function getMountedDatestampsLinkedToDateRanges<T extends TDateRange>(ranges: T[]) {
    const allMountedDatestamps = getAllMountedDatestamps();

    const affectedDatestamps = [];
    for (const mountedStart of allMountedDatestamps) {
        const nextDatestamp = datestampToMidnightDate(mountedStart, 1).toISOString();
        if (ranges.some((range) => {
            const { startIso, endIso } = range;
            return (
                isTimeEarlier(startIso, nextDatestamp, false) &&
                isTimeEarlier(mountedStart, endIso)
            );
        })) {
            affectedDatestamps.push(mountedStart);
        }
    }

    return affectedDatestamps;
}



// ------------- Planner Builder -------------

/**
 * ✅ Generates an empty planner object for the given datestamp.
 * 
 * @param datestamp - the date the planner will represent
 * @returns - a new planner object
 */
export function generatePlanner(datestamp: string): TPlanner {
    return {
        datestamp,
        title: '',
        events: [],
        hideRecurring: false
    };
}

// ------------- Storage Getters and Setters -------------

/**
 * ✅ Fetches the events from a planner object.
 * 
 * @param planner - the planner to extract from
 * @returns - a list of planner events
 */
export function getEventsFromPlanner(
    planner: TPlanner,
): IPlannerEvent[] {
    return planner.events;
}

/**
 * ✅ Sets the event list within a planner object.
 * 
 * @param events - the list of events to place
 * @param planner - the planner to update
 * @returns - a planner object containing the list of events
 */
export function setEventsInPlanner(
    events: IPlannerEvent[],
    planner: TPlanner,
) {
    return { planner, events };
}

// ------------- Modal Utilities -------------

/**
 * ✅ Opens the time modal and passes the given event details in the path.
 * If the item is new, a null item ID will be passed.
 * 
 * @param datestamp - The key of the planner where the modal open event occured.
 * @param event - the event to update within the modal
 * @param router - the router to navigate to the modal
 */
export function openTimeModal(
    datestamp: string,
    event: IPlannerEvent,
    router: Router
) {
    router.push(`${TIME_MODAL_PATHNAME
        }${datestamp
        }/${event.status === EItemStatus.NEW ? NULL : event.id
        }/${event.sortId
        }/${event.value.length > 0 ? event.value : NULL
        }`
    );
}

// ------------- List Modification Helpers -------------

/**
 * ✅ Compares two time configurations and determines if they are eqivalent.
 * 
 * @param a - the first time config
 * @param b - the second time config
 * @returns - true if both configs are equal, else false
 */
export function timeConfigsAreEqual(
    a?: ITimeConfig,
    b?: ITimeConfig
): boolean {
    if (a === b) return true; // both undefined
    if (!a || !b) return false; // one is undefined, the other isn't

    return (
        a.allDay === b.allDay &&
        a.startIso === b.startIso &&
        a.endIso === b.endIso &&
        (a.multiDayEnd ?? false) === (b.multiDayEnd ?? false) &&
        (a.multiDayStart ?? false) === (b.multiDayStart ?? false)
    );
}

/**
 * Updates a planner with a new item and enforces time logic within the list.
 * 
 * @param planner The planner to update
 * @param event An item to update within the list. Item will be updated by ID. If no item exists, it will be appended.
 * @param replaceId The ID of the item to replace in the list. If not provided, event's ID will be used.
 * @returns A clean planner with logical time ordering
 */
export function sanitizePlanner(
    planner: (IPlannerEvent | IRecurringEvent)[],
    event: IPlannerEvent | IRecurringEvent,
    replaceId?: string
) {
    const updatedList = sanitizeList(planner, event, replaceId);
    event.sortId = generateSortIdByTime(event, updatedList);
    return updatedList.sort((a, b) => a.sortId - b.sortId);
}

/**
 * ✅ Generate a new sort ID for an event that maintains time logic within the planner.
 * 
 * @param event - The planner event to place.
 * @param planner - The planner the event belongs to.
 * @returns - The new sort ID for the event.
 */
export function generateSortIdByTime(
    event: IPlannerEvent | IRecurringEvent | ICountdown,
    events: (IPlannerEvent | IRecurringEvent | ICountdown)[]
): number {
    // console.info('generateSortIdByTime START', { event: { ...event }, events: [...events] });
    const planner = sanitizeList(events, event);
    const plannerWithoutEvent = planner.filter(curr => curr.id !== event.id);
    const eventTime = extractEventTime(event);

    // Handler for situations where the item can remain in its position.
    const persistEventPosition = () => {
        if (plannerWithoutEvent.some(item => item.sortId === event.sortId)) {
            // Event has a conflicting sort ID. Place this item below the conflict.
            return generateSortId(event.sortId, plannerWithoutEvent);
        } else {
            // Keep the event's current position.
            return event.sortId;
        }
    };

    // Pre-Check 1: The event is unscheduled. Keep it at its current position.
    if (!eventTime || event.status === EItemStatus.HIDDEN) return persistEventPosition();

    // Pre-Check 2: Check if the event conflicts at its current position.
    const timedPlanner = [...planner].filter(existingEvent => extractEventTime(existingEvent));
    const currentIndex = timedPlanner.findIndex(e => e.id === event.id);

    const earlierEvent = timedPlanner[currentIndex - 1];
    const laterEvent = timedPlanner[currentIndex + 1];
    const earlierTime = extractEventTime(earlierEvent);
    const laterTime = extractEventTime(laterEvent);

    if (
        isTimeEarlier(earlierTime, eventTime) &&
        isTimeEarlier(eventTime, laterTime)
    ) return persistEventPosition();

    // Traverse the list in reverse to find the last event that starts before or at the same time
    const earlierEventIndex = plannerWithoutEvent.findLastIndex(existingEvent => {
        const existingTime = extractEventTime(existingEvent);
        if (!existingTime || existingEvent.id === event.id) return false;

        // Check if existing event starts before or at the same time as our event
        return isTimeEarlier(existingTime, eventTime);
    });

    if (earlierEventIndex !== -1) {
        // Found an event that starts before or at the same time - place our event right after it
        const newParentSortId = planner[earlierEventIndex].sortId;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    // No event found that starts before or at the same time - this must be the earliest event
    // Place it at the front of the planner
    return generateSortId(-1, plannerWithoutEvent);
}

// ------------- Planner Generation -------------

/**
 * Build a planner out of existing data, the calendar, recurring events, 
 * and carryover events from past planners.
 * 
 * @param datestamp - the date the planner represents
 * @param storagePlanner - current planner in storage
 * @param calendarEvents - events in the device calendar
 * @returns - a newly build planner, synced up with storage
 */
export async function buildPlannerEvents(
    datestamp: string,
    storagePlanner: TPlanner,
    calendarEvents: CalendarEvent[]
): Promise<IPlannerEvent[]> {
    const planner = { ...storagePlanner };

    // Phase 1: Merge in any recurring events for the given weekday.
    const recurringPlanner = getRecurringPlannerFromStorage(datestampToDayOfWeek(datestamp));
    planner.events = syncPlannerWithRecurring(recurringPlanner, planner.events, datestamp);

    // Phase 2: Merge in any events from the calendar.
    if (hasCalendarAccess()) {
        planner.events = syncPlannerWithCalendar(datestamp, calendarEvents, planner.events);
    } else {
        planner.events = planner.events.filter(event => !event.calendarId);
    }

    // Phase 3: Merge in carryover events from yesterday. Only applicable for today's planner.
    if (datestamp === getTodayDatestamp()) {
        const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
        remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
            planner.events.push({
                ...yesterdayEvent,
                listId: datestamp,
                sortId: generateSortId(-1, planner.events)
            });
        });
    }

    // Phase 4: Save the planner to storage if any events were added or removed during build.
    if (
        // The planner gained new events
        planner.events.some(planEvent =>
            !storagePlanner.events.some(existingEvent => existingEvent.id === planEvent.id)
        ) ||
        // The planner lost existing events
        storagePlanner.events.some(existingEvent =>
            !planner.events.some(planEvent => planEvent.id === existingEvent.id)
        )
    ) savePlannerToStorage(datestamp, planner);

    console.log(planner.events, 'current planner')
    return planner.events;
}

/**
 * ✅ Syncs a planner with a list of calendar events. The Calendar has final say on the state of the events.
 * 
 * @param datestamp - The date the planner represents. (YYYY-MM-DD)
 * @param calendarEvents - The calendar events for the planner date.
 * @param plannerEvents - The events currently in the planner.
 * @returns A new list of planner events synced with the calendar.
 */
export function syncPlannerWithCalendar(
    datestamp: string,
    calendarEvents: CalendarEvent[],
    plannerEvents: IPlannerEvent[]
) {
    // Phase 1: Sync storage records with the Calendar.
    const newPlanner = plannerEvents.reduce<IPlannerEvent[]>((accumulator, planEvent) => {

        // Keep non-calendar events.
        if (
            !planEvent.calendarId ||
            planEvent.status === EItemStatus.HIDDEN
        ) {
            accumulator.push(planEvent);
            return accumulator;
        }

        const calEvent = calendarEvents.find(calEvent => calEvent.id === planEvent.calendarId);

        // Remove calendar records that no longer exist in the Calendar.
        if (!calEvent) return accumulator;

        // Sync calendar records with the Calendar events.
        const updatedEvent = mapCalendarEventToPlannerEvent(calEvent, datestamp, accumulator, planEvent);
        accumulator.push(updatedEvent);
        return accumulator;

    }, []);

    // Phase 2: Add new calendar events to the planner.
    calendarEvents.forEach(calEvent => {
        if (newPlanner.some(planEvent => planEvent.calendarId === calEvent.id)) return;
        newPlanner.push(
            mapCalendarEventToPlannerEvent(calEvent, datestamp, newPlanner)
        );
    });

    return newPlanner;
}

/**
 * Syncs a planner with a recurring planner. 
 * Existing recurring events will be updated to match the recurring planner.
 * 
 * @param recurringPlanner - the events to sync within the planner
 * @param plannerEvents - the planner being updated
 * @param datsetamp - the date the planner represents
 * @returns - the new planner synced with the recurring events
 */
export function syncPlannerWithRecurring(
    recurringPlanner: IRecurringEvent[],
    plannerEvents: IPlannerEvent[],
    datsetamp: string
) {
    // console.info('syncPlannerWithRecurring: START', { recurringPlanner, planner, timestamp })

    function getRecurringEventTimeConfig(recEvent: IRecurringEvent): ITimeConfig {
        return {
            startIso: timeValueToIso(datsetamp, recEvent.startTime!),
            endIso: timeValueToIso(datsetamp, '23:55'),
            allDay: false,
        }
    };

    // Phase 1: Build the new planner out of the recurring planner.
    const newPlanner = recurringPlanner.reduce<IPlannerEvent[]>((acc, recEvent) => {
        const planEvent = plannerEvents.find(p =>
            p.recurringId === recEvent.id
        );

        // Hidden events are preserved as-is.
        if (planEvent?.status === EItemStatus.HIDDEN) {
            return [...acc, planEvent];
        }

        const isExisting = Boolean(planEvent);
        const baseEvent: IPlannerEvent = {
            id: isExisting ? planEvent!.id : uuid.v4(),
            sortId: isExisting ? planEvent!.sortId : recEvent.sortId,
            value: recEvent.value,
            listId: datsetamp,
            recurringId: recEvent.id,
            status: EItemStatus.STATIC,
            listType: EListType.PLANNER
        };

        // Add timeConfig
        if (recEvent.startTime) {
            baseEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
        }

        const updatedPlanner = [...acc, baseEvent];

        // Enforce time logic for new events. 
        // Existing planner events already maintain time logic.
        if (!isExisting) {
            baseEvent.sortId = generateSortIdByTime(baseEvent, updatedPlanner);
        }

        return updatedPlanner;
    }, []);

    // Phase 2: Add non-recurring existing events that weren't added above
    plannerEvents.forEach(existingEvent => {
        const alreadyExists = newPlanner.some(e => e.id === existingEvent.id);
        const isRecurring = Boolean(existingEvent.recurringId)

        if (!alreadyExists && !isRecurring) {
            newPlanner.push(existingEvent);
            existingEvent.sortId = generateSortIdByTime(existingEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithRecurring: END', newPlanner);
    return newPlanner;
}

/**
 * ✅ Integrates a recurring weekday event into a recurring planner.
 * If the item is hidden, it will be ignored. Otherwise the event will be updated or added to the list.
 * 
 * @param listId - the ID of the recurring planner being integrated
 * @param recurringPlanner - the planner to integrate
 * @param weekdayEvent - the event to propogate into the list
 * @returns - the newly updated list, or null if no change is needed
 */
export function syncRecurringPlannerWithWeekdayEvent(
    listId: string,
    recurringPlanner: IRecurringEvent[],
    weekdayEvent: IRecurringEvent
): IRecurringEvent[] | null {
    const existingEvent = recurringPlanner.find(recEvent => recEvent.weekdayEventId === weekdayEvent.id);

    // Phase 1: Exit early if the event is already hidden.
    if (existingEvent?.status === EItemStatus.HIDDEN) {
        return null;
    }

    // Phase 2: Generate the event to save to storage.
    const isExisting = Boolean(existingEvent);
    const updatedEvent = {
        ...weekdayEvent,
        listId,
        id: isExisting ? existingEvent!.id : uuid.v4(),
        weekdayEventId: weekdayEvent.id
    };

    return sanitizePlanner(recurringPlanner, updatedEvent);
}

// ------------- Common Props -------------

/**
 * ✅ Handles user input for an event's value, extracting any time values and updating the event accordingly.
 * 
 * @param text - The text input from the user.
 * @param item - The event item being updated.
 * @param events - The list of events in the event's planner.
 * @param datestamp - Optional datestamp for the event. When not provided, the item is treated as 
 * a recurring event.
 * @returns The updated event.
 */
export function handleNewEventValue(
    text: string,
    item: IPlannerEvent | IRecurringEvent,
    events: (IPlannerEvent | IRecurringEvent)[],
    datestamp?: string,
): IPlannerEvent | IRecurringEvent {
    const newEvent = { ...item, value: text };

    const itemTime = extractEventTime(item);
    if (itemTime) return newEvent;

    const { timeConfig, updatedText } = extractTimeValueFromString(text, datestamp);
    if (!timeConfig) return newEvent;

    newEvent.value = updatedText;

    if (datestamp) {
        (newEvent as IPlannerEvent).timeConfig = timeConfig;
    } else {
        (newEvent as IRecurringEvent).startTime = timeConfig.startIso;
    }
    newEvent.sortId = generateSortIdByTime(newEvent, events);

    return newEvent;
}

/**
 * @getLeftIcon Prop: generates the config for the event time modal trigger icon.
 */
export function generateTimeIconConfig(
    event: IPlannerEvent | IRecurringEvent,
    openTimeModal: (item: IPlannerEvent | IRecurringEvent) => void
) {

    const itemTime = extractEventTime(event);
    return {
        hideIcon: !itemTime,
        onClick: () => openTimeModal(event),
        customIcon: (
            <TimeValue
                endEvent={!!(event as IPlannerEvent).timeConfig?.multiDayEnd}
                startEvent={!!(event as IPlannerEvent).timeConfig?.multiDayStart}
                timeValue={itemTime}
                isoTimestamp={itemTime}
                concise
            />
        )
    }
}

/**
 * @getToolbar Prop: generates the config for the planner event toolbar.
 * The toolbar allows for opening the time modal.
 */
export function buildEventToolbarIconSet(
    openTimeModal: () => void
): ToolbarIcon<IPlannerEvent>[][] {
    return [[{
        type: 'clock',
        onClick: openTimeModal
    }]]
}