import { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import TimeValue from '@/components/text/TimeValue';
import { NULL } from '@/constants/generic';
import { EItemStatus } from '@/enums/EItemStatus';
import { deleteEvents, getCarryoverEventsAndCleanStorage, getPlannerFromStorage, saveEvent, savePlannerToStorage } from '@/storage/plannerStorage';
import { getRecurringPlannerFromStorage } from '@/storage/recurringPlannerStorage';
import { IPlannerEvent, TTimeConfig } from '@/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { TIME_MODAL_PATHNAME } from 'app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]';
import { uuid } from 'expo-modules-core';
import { Router } from 'expo-router';
import { loadCalendarData } from './calendarUtils';
import { datestampToDayOfWeek, getEventTime, getTodayDatestamp, isTimeEarlierOrEqual, timeValueToIso } from './dateUtils';
import { generateSortId, isItemTextfield, sanitizeList } from './listUtils';
import { jotaiStore } from 'app/_layout';
import { textfieldItemAtom } from '@/atoms/textfieldData';

// ------------- Utilities -------------

type ExtractedTime = {
    timeConfig: TTimeConfig | undefined;
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
            startTime: datestamp ? timeValueToIso(datestamp, formattedTime) : formattedTime,
            endTime: datestamp ? timeValueToIso(datestamp, "23:55") : "23:55",
            allDay: false,
        };
    }

    return { timeConfig, updatedText };
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
 * @param datestamp - the datestamp the event exists in
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
    a?: TTimeConfig,
    b?: TTimeConfig
): boolean {
    if (a === b) return true; // both undefined
    if (!a || !b) return false; // one is undefined, the other isn't

    return (
        a.allDay === b.allDay &&
        a.startTime === b.startTime &&
        a.endTime === b.endTime &&
        (a.multiDayEnd ?? false) === (b.multiDayEnd ?? false) &&
        (a.multiDayStart ?? false) === (b.multiDayStart ?? false)
    );
}

/**
 * ✅ Updates a planner with a new item and enforces time logic within the list.
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
 * ✅ Handles all overhead saving a planner event.
 * If the update affects the calendar, the global calendar data will be reloaded.
 * 
 * @param updatedPlanEvent - the planner event to save
 * @param newEventHandler = handler to run side effects with the saved planner event
 * @returns - the updated event in storage if it still exists, else undefined.
 */
export async function saveEventReloadData(
    updatedPlanEvent: IPlannerEvent,
    newEventHandler?: (event?: IPlannerEvent) => void
): Promise<IPlannerEvent | undefined> {

    // Phase 1: Save the event to storage.
    const savedEvent = await saveEvent(updatedPlanEvent);

    // Phase 2: Handle side effects of the saved event.
    newEventHandler?.(savedEvent);

    // Phase 3: Reload calendar data if the event directly affects the calendar.
    const oldPlanner = getPlannerFromStorage(updatedPlanEvent.listId);
    if (
        // The event is now a chip
        !savedEvent ||
        // The event is now a calendar event
        savedEvent?.calendarId ||
        // The event used to be a calendar event
        oldPlanner.events.find(i => i.id === updatedPlanEvent.id)?.calendarId
    ) {
        await loadCalendarData();
    }

    return savedEvent;
}

/**
 * ✅ Handles deleting a planner event. If any items were a calendar event, 
 * the calendar data will be reloaded.
 * 
 * @param planEvents - the planner events to delete
 */
export async function deleteEventsReloadData(planEvents: IPlannerEvent[]) {
    await deleteEvents(planEvents);
    if (planEvents.some(item => item.calendarId)) await loadCalendarData();
}

/**
 * ✅ Generate a new sort ID for an event that maintains time logic within the planner.
 * 
 * @param event - the event to place
 * @param planner - the planner
 * @returns - the new sort ID for the event
 */
export function generateSortIdByTime(
    event: IPlannerEvent | IRecurringEvent,
    events: (IPlannerEvent | IRecurringEvent)[]
): number {
    // console.info('generateSortIdByTime START', { event: { ...event }, events: [...events] });
    const planner = sanitizeList(events, event);
    const plannerWithoutEvent = planner.filter(curr => curr.id !== event.id);
    const eventTime = getEventTime(event);

    // Handler for situations where the item can remain in its position.
    function persistEventPosition() {
        if (event.sortId === -1) {
            // Event will be at the top of the list
            return generateSortId(-1, plannerWithoutEvent);
        } else if (plannerWithoutEvent.find(item => item.sortId === event.sortId)) {
            // Event has a conflicting sort ID. Place this item above the conflict.
            return generateSortId(event.sortId, plannerWithoutEvent, true);
        } else {
            // Keep the event's current position.
            return event.sortId;
        }
    };

    // Pre-Check 1: The event is unscheduled. Keep it at its current position.
    if (!eventTime || event.status === EItemStatus.HIDDEN) return persistEventPosition();

    // Pre-Check 2: Check if the event conflicts at its current position.
    const timedPlanner = [...planner].filter(existingEvent => getEventTime(existingEvent));
    const currentIndex = timedPlanner.findIndex(e => e.id === event.id);

    const earlierEvent = timedPlanner[currentIndex - 1];
    const laterEvent = timedPlanner[currentIndex + 1];
    const earlierTime = getEventTime(earlierEvent);
    const laterTime = getEventTime(laterEvent);

    if (
        isTimeEarlierOrEqual(earlierTime, eventTime) &&
        isTimeEarlierOrEqual(eventTime, laterTime)
    ) return persistEventPosition();

    // Scenario 1: Place the event before the first event that starts after or during it.
    const laterEventIndex = planner.findIndex(existingEvent => {
        const existingTime = getEventTime(existingEvent);
        if (!existingTime || existingEvent.id === event.id) return false;

        return isTimeEarlierOrEqual(eventTime, existingTime);
    });
    if (laterEventIndex !== -1) {
        const newChildSortId = planner[laterEventIndex].sortId;
        return generateSortId(newChildSortId, plannerWithoutEvent, true);
    }

    // Scenario 2: Place the event after the last event that starts before or during it.
    const earlierEventIndex = planner.findLastIndex(existingEvent => {
        const existingTime = getEventTime(existingEvent);
        if (!existingTime || existingEvent.id === event.id) return false;

        return isTimeEarlierOrEqual(existingTime, eventTime);
    });
    if (earlierEventIndex !== -1) {
        const newParentSortId = planner[earlierEventIndex].sortId;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    throw new Error(`generateSortIdByTime: An error occurred during timed sort ID generation for event ID: ${event.id}`);
}

// ------------- Planner Generation -------------

/**
 * ✅ Build a planner out of existing data, the calendar, recurring events, 
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
    calendarEvents: IPlannerEvent[]
): Promise<IPlannerEvent[]> {
    const planner = { ...storagePlanner };

    // Phase 1: Merge in any recurring events for the given weekday.
    const recurringPlanner = getRecurringPlannerFromStorage(datestampToDayOfWeek(datestamp));
    planner.events = syncPlannerWithRecurring(recurringPlanner, planner.events, datestamp);

    // Phase 2: Merge in any events from the calendar.
    planner.events = syncPlannerWithCalendar(calendarEvents, planner.events, datestamp);

    // Phase 3: Merge in carryover events from yesterday. Only applicable for today's planner.
    if (datestamp === getTodayDatestamp()) {
        const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
        remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
            const newEvent = {
                ...yesterdayEvent,
                listId: datestamp,
                sortId: -1
            };

            planner.events.push(newEvent);
            newEvent.sortId = generateSortId(-1, planner.events);
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

    return planner.events;
}

/**
 * ✅ Syncs a planner with a calendar. Calendars have final say on the state of the events.
 * 
 * @param calendar - the calendar events to sync with
 * @param plannerEvents - the planner being updated
 * @param datestamp - the date the planner represents
 * @returns - the new planner synced with the calendar
 */
export function syncPlannerWithCalendar(
    calendar: IPlannerEvent[],
    plannerEvents: IPlannerEvent[],
    datestamp: string
) {
    // console.info('syncPlannerWithCalendar: START', { calendar, planner, timestamp });

    // Phase 1: Remove any calendar events that no longer exist from the planner.
    // All existing calendar events will also be updated to reflect the calendar data.
    const newPlanner = plannerEvents.reduce<IPlannerEvent[]>((accumulator, planEvent) => {

        // This event isn't related to the calendar. Keep it.
        if (
            !planEvent.calendarId ||
            planEvent.status === EItemStatus.HIDDEN
        ) return [...accumulator, planEvent];

        const calEvent = calendar.find(calEvent => calEvent.id === planEvent.calendarId);
        if (calEvent) {
            // This event still exists. Sync the data with the calendar.
            const updatedEvent = {
                ...planEvent,
                timeConfig: calEvent.timeConfig,
                value: calEvent.value
            };

            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
            return updatedPlanner;
        } else {
            // This event was deleted. Remove it from the planner.
            return accumulator;
        }
    }, []);

    // Add any new calendar events to the planner.
    calendar.forEach(calEvent => {
        if (!newPlanner.find(planEvent => planEvent.calendarId === calEvent.id)) {
            const newEvent = {
                ...calEvent,
                listId: datestamp,
                calendarId: calEvent.id
            };
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTime(newEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithCalendar: END', newPlanner);
    return newPlanner;
}

/**
 * ✅ Syncs a planner with a recurring planner. 
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

    function getRecurringEventTimeConfig(recEvent: IRecurringEvent): TTimeConfig {
        return {
            startTime: timeValueToIso(datsetamp, recEvent.startTime!),
            endTime: timeValueToIso(datsetamp, '23:55'),
            allDay: false,
        }
    };

    // Phase 1: Build the new planner out of the recurring planner.
    const newPlanner = recurringPlanner.reduce<IPlannerEvent[]>((acc, recEvent) => {
        const planEvent = plannerEvents.find(p => p.recurringId === recEvent.id);

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
            status: EItemStatus.STATIC
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
        const isRecurring = Boolean(existingEvent.recurringId);

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
) {
    const existingEvent = recurringPlanner.find(recEvent => recEvent.weekdayEventId === weekdayEvent.id);

    // Phase 1: Exit early if the event is hidden.
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
 * @handleValueChange Prop: extracts any typed time value and uses it to mark the event's start time.
 * The time value will be removed from the event @value and placed in the @timeConfig instead.
 * Recurring events and Planner events can both be handled.
 * 
 * When param @datestamp is received, the item is a Planner Event. Otherwise it is a Recurring Event.
 */
export function handleEventValueUserInput(
    text: string,
    item: IPlannerEvent | IRecurringEvent,
    currentList: (IPlannerEvent | IRecurringEvent)[],
    datestamp?: string,
): IPlannerEvent | IRecurringEvent {
    const itemTime = getEventTime(item);
    if (!itemTime) {
        const { timeConfig, updatedText } = extractTimeValueFromString(text, datestamp);
        if (timeConfig) {
            const newEvent = { ...item, value: updatedText };
            if (datestamp) {
                (newEvent as IPlannerEvent).timeConfig = timeConfig;
            } else {
                (newEvent as IRecurringEvent).startTime = timeConfig.startTime;
            }
            newEvent.sortId = generateSortIdByTime(newEvent, currentList);
            return newEvent;
        }
    }
    return { ...item, value: text };
}

/**
 * @getLeftIcon Prop: generates the config for the event time modal trigger icon.
 */
export function generateTimeIconConfig(
    event: IPlannerEvent | IRecurringEvent,
    openTimeModal: (item: IPlannerEvent | IRecurringEvent) => void
) {
    const itemTime = getEventTime(event);
    return {
        hideIcon: !itemTime,
        onClick: () => openTimeModal(event),
        customIcon: (
            <TimeValue
                allDay={!!(event as IPlannerEvent).timeConfig?.allDay}
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
export function generateEventToolbar(
    event: IPlannerEvent | IRecurringEvent,
    openTimeModal: (event: IPlannerEvent) => void,
    timeModalOpen: boolean
): ToolbarProps<IPlannerEvent | IRecurringEvent> {
    return {
        item: event,
        open: !timeModalOpen && isItemTextfield(event),
        iconSets: [[{
            type: 'clock',
            onClick: () => openTimeModal(event)
        }]]
    }
}