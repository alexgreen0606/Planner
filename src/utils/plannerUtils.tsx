
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { ToolbarIcon } from '@/components/lists/components/ListToolbar';
import TimeValue from '@/components/text/TimeValue';
import { NULL } from '@/lib/constants/generic';
import { TIME_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListType } from '@/lib/enums/EListType';
import { TListItemIconConfig } from '@/lib/types/listItems/core/TListItemIconConfig';
import { ICountdown } from '@/lib/types/listItems/ICountdown';
import { IPlannerEvent, ITimeConfig, TDateRange } from '@/lib/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { getCarryoverEventsAndCleanStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { getRecurringPlannerFromStorage } from '@/storage/recurringPlannerStorage';
import { jotaiStore } from 'app/_layout';
import { Event as CalendarEvent } from 'expo-calendar';
import { uuid } from 'expo-modules-core';
import { router } from 'expo-router';
import { hasCalendarAccess } from './accessUtils';
import { datestampToMidnightJsDate, getDayOfWeekFromDatestamp, getTodayDatestamp, isTimeEarlier, isTimeEarlierOrEqual, timeValueToIso } from './dateUtils';
import { generateSortId, sortListWithUpsertItem } from './listUtils';
import { mapCalendarEventToPlannerEvent } from './map/mapCalenderEventToPlannerEvent';

type UserInputMetadata = {
    updatedText: string;
    timeConfig: ITimeConfig | undefined;
};

// ====================
// 1. Helper Functions
// ====================

/**
 * Parses text to find a time value (HH:MM (PM or AM)) case insensitive and returns it along with the updated text.
 * 
 * @param text - The string to parse.
 * @param datestamp - A date to use when generating ISO timestamps. When not provided, time values will be returned (HH:MM format).
 * @returns The text with the time value removed, and a time object representing the time.
 */
function extractTimeValueFromString(text: string, datestamp?: string): UserInputMetadata {
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
 * Parses an event and returns its time, or null if none exists.
 * 
 * @param event - The event to parse.
 * @returns The event's time value if one exists, else null.
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
 * Opens the time modal and passes the given event details in the params.
 *
 * @param triggerDatestamp - The date of the planner where the modal trigger event occurred.
 * @param event - The event to update within the modal.
 */
function openTimeModal(
    triggerDatestamp: string,
    event: IPlannerEvent
) {
    router.push(`${TIME_MODAL_PATHNAME
        }${triggerDatestamp
        }/${event.status === EItemStatus.NEW ? NULL : event.id
        }/${event.sortId
        }/${event.value.length > 0 ? event.value : NULL
        }`
    );
}

/**
 * Synchronizes a list of planner events with a list of calendar events.
 * 
 * @param datestamp - The date the planner represents. (YYYY-MM-DD)
 * @param plannerEvents - The list of planner events to update.
 * @param calendarEvents - The list of calendar events to sync with the planner.
 * @returns A new list of planner events synced with the calendar.
 */
function syncPlannerWithCalendar(
    datestamp: string,
    plannerEvents: IPlannerEvent[],
    calendarEvents: CalendarEvent[]
): IPlannerEvent[] {
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
 * Synchronizes a list of planner events with a list of recurring events.
 *
 * @param datestamp - The date the planner represents. (YYYY-MM-DD)
 * @param plannerEvents - The list of planner events to update.
 * @param recurringPlanner - The list of recurring events to sync with the planner.
 * @returns A new list of planner events synced with the recurring events.
 */
function syncPlannerWithRecurring(
    datestamp: string,
    plannerEvents: IPlannerEvent[],
    recurringPlanner: IRecurringEvent[]
): IPlannerEvent[] {

    const getRecurringEventTimeConfig = (recEvent: IRecurringEvent): ITimeConfig => {
        return {
            startIso: timeValueToIso(datestamp, recEvent.startTime!),
            endIso: timeValueToIso(datestamp, '23:55'),
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
            listId: datestamp,
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

// =================
// 2. Sort Function
// =================

/**
 * Sorts a list of planner events chronologically and optionally saves a given event to the list. The event may be given a new sort ID to ensure
 * the list remains chronologically ordered.
 * 
 * @param planner - The planner events to update.
 * @param event - An item to update within the list. If no event exists with a matching ID, it will be inserted.
 * @param replaceId - An ID of an existing event to replace with the provided event.
 * @returns A clean planner with logical time ordering.
 */
export function sortPlannerChronologicalWithUpsert(
    planner: (IPlannerEvent | IRecurringEvent)[],
    event: IPlannerEvent | IRecurringEvent,
    replaceId?: string
) {
    const updatedList = sortListWithUpsertItem(planner, event, replaceId);
    event.sortId = generateSortIdByTime(event, updatedList);
    return updatedList.sort((a, b) => a.sortId - b.sortId);
}

// ============================
// 3. Synchronization Function
// ============================

/**
 * Synchronizes a planner from storage with the device calendar, recurring events, and carryover events from past planners.
 * 
 * @param storagePlanner - The current planner in storage.
 * @param calendarEvents - Events in the device calendar for the planner's date.
 * @returns A list of planner events with all external data merged in.
 */
export async function syncPlannerWithExternalDataAndUpdateStorage(
    storagePlanner: TPlanner,
    calendarEvents: CalendarEvent[]
): Promise<IPlannerEvent[]> {
    const datestamp = storagePlanner.datestamp;
    const planner = { ...storagePlanner };

    // Phase 1: Merge in any recurring events for the given weekday.
    const recurringPlanner = getRecurringPlannerFromStorage(getDayOfWeekFromDatestamp(datestamp));
    planner.events = syncPlannerWithRecurring(datestamp, planner.events, recurringPlanner);

    // Phase 2: Merge in any events from the calendar.
    if (hasCalendarAccess()) {
        planner.events = syncPlannerWithCalendar(datestamp, planner.events, calendarEvents);
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
                sortId: generateSortId(planner.events, -1)
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

    return planner.events;
}

// ====================================
// 4. Smart Time Detect Function
// ====================================

/**
 * Updates an event based on user input for the event's value, detecting time values and converting them into a time config for the event.
 * 
 * @param text - The text input from the user.
 * @param event - The event being updated.
 * @param events - The list of events in the planner.
 * @param datestamp - Optional datestamp for the event. When not provided, the item is treated as 
 * a recurring event.
 * @returns The updated event.
 */
export function updateEventValueWithSmartTimeDetect(
    text: string,
    event: IPlannerEvent | IRecurringEvent,
    events: (IPlannerEvent | IRecurringEvent)[],
    datestamp?: string
): IPlannerEvent | IRecurringEvent {
    const newEvent = { ...event, value: text };

    const itemTime = extractEventTime(event);
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

// ===================
// 5. Upsert Function
// ===================

/**
 * Updates or inserts a recurring weekday event into a recurring planner.
 * 
 * @param listId - The ID of the recurring planner being integrated. (ex: 'Monday')
 * @param recurringPlanner - The planner to integrate.
 * @param weekdayEvent - The event to propagate into the list.
 * @returns The newly updated list, or null if no change is needed.
 */
export function upsertWeekdayEventToRecurringPlanner(
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

    return sortPlannerChronologicalWithUpsert(recurringPlanner, updatedEvent);
}

// ====================
// 6. Getter Functions
// ====================

/**
 * Gets a list of all planner datestamps that are currently mounted throughout the app.
 * 
 * @returns A list of planner datestamps. (YYYY-MM-DD)
 */
export function getAllMountedDatestampsFromStore(): string[] {
    return jotaiStore.get(mountedDatestampsAtom).all;
}

/**
 * Gets a list of all mounted datestamps that fall within a list of date ranges.
 * 
 * @param ranges - The list of ranges to weigh against the mounted datestamps.
 * @returns A unique list of datestamps. (YYYY-MM-DD)
 */
export function getAllMountedDatestampsLinkedToDateRanges<T extends TDateRange>(ranges: T[]): string[] {
    const allMountedDatestamps = getAllMountedDatestampsFromStore();

    const affectedDatestamps = [];
    for (const mountedStart of allMountedDatestamps) {
        const nextDatestamp = datestampToMidnightJsDate(mountedStart, 1).toISOString();
        if (ranges.some((range) => {
            const { startIso, endIso } = range;
            return (
                isTimeEarlier(startIso, nextDatestamp) &&
                isTimeEarlierOrEqual(mountedStart, endIso)
            );
        })) {
            affectedDatestamps.push(mountedStart);
        }
    }

    return affectedDatestamps;
}

// ========================
// 7. Generation Functions
// ========================

/**
 * Generates a new sort ID for an event that maintains time logic within its planner.
 * 
 * @param event - The planner event to place.
 * @param events - The list of planner events where the event will be placed.
 * @returns A new sort ID that maintains time logic.
 */
export function generateSortIdByTime(
    event: IPlannerEvent | IRecurringEvent | ICountdown,
    events: (IPlannerEvent | IRecurringEvent | ICountdown)[]
): number {
    // console.info('generateSortIdByTime START', { event: { ...event }, events: [...events] });
    const planner = sortListWithUpsertItem(events, event);
    const plannerWithoutEvent = planner.filter(curr => curr.id !== event.id);
    const eventTime = extractEventTime(event);

    // Handler for situations where the item can remain in its position.
    const persistEventPosition = () => {
        if (plannerWithoutEvent.some(item => item.sortId === event.sortId)) {
            // Event has a conflicting sort ID. Place this item below the conflict.
            return generateSortId(plannerWithoutEvent, event.sortId);
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
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, eventTime)) &&
        (!laterTime || isTimeEarlierOrEqual(eventTime, laterTime))
    ) return persistEventPosition();

    // Traverse the list in reverse to find the last event that starts before or at the same time
    const earlierEventIndex = plannerWithoutEvent.findLastIndex(existingEvent => {
        const existingTime = extractEventTime(existingEvent);
        if (!existingTime || existingEvent.id === event.id) return false;

        // Check if existing event starts before or at the same time as our event
        return isTimeEarlierOrEqual(existingTime, eventTime);
    });

    if (earlierEventIndex !== -1) {
        // Found an event that starts before or at the same time - place our event right after it
        const newParentSortId = planner[earlierEventIndex].sortId;
        return generateSortId(plannerWithoutEvent, newParentSortId);
    }

    // No event found that starts before or at the same time - this must be the earliest event
    // Place it at the front of the planner
    return generateSortId(plannerWithoutEvent, -1);
}

/**
 * Generates an empty planner object for the given datestamp with no events.
 * 
 * @param datestamp - The date the planner represents.
 * @returns A new planner object with no events.
 */
export function generateEmptyPlanner(datestamp: string): TPlanner {
    return {
        datestamp,
        title: '',
        events: [],
        hideRecurring: false
    };
}

/**
 * Generates the icon config representing a planner event's time. Clicking the icon will open the Time Modal for the event.
 * 
 * @param event - The planner event.
 * @returns Icon configuration for the event's time.
 */
export function generatePlannerEventTimeIconConfig(
    event: IPlannerEvent
): TListItemIconConfig<IPlannerEvent> {
    const itemTime = extractEventTime(event);
    return {
        hideIcon: !itemTime,
        onClick: () => openTimeModal(event.listId, event),
        customIcon: (
            <TimeValue
                endEvent={event.timeConfig?.multiDayEnd}
                startEvent={event.timeConfig?.multiDayStart}
                isoTimestamp={itemTime}
                concise
            />
        )
    };
}

/**
 * Generates the icon config representing a recurring event's time. Clicking the icon will open the textfield for the event.
 * 
 * @param event - The recurring event.
 * @param onBeginEdit - Callback to begin editing the event.
 * @returns Icon configuration for the recurring event's time.
 */
export function generateRecurringEventTimeIconConfig(
    event: IRecurringEvent,
    onBeginEdit: (event: IRecurringEvent) => void,
): TListItemIconConfig<IRecurringEvent> {
    return {
        hideIcon: !event.startTime,
        onClick: () => onBeginEdit(event),
        customIcon: (
            <TimeValue timeValue={event.startTime} concise />
        )
    };
}

/**
 * Generates the toolbar icon set for a planner event. The icon set contains a single icon that opens the Time Modal for the event.
 * 
 * @returns The toolbar icon set for the event.
 */
export function generatePlannerToolbarIconSet(): ToolbarIcon<IPlannerEvent>[][] {
    return [[{
        type: 'clock',
        onClick: (event: IPlannerEvent | undefined) => event && openTimeModal(event.listId, event)
    }]];
}

// =======================
// 8. Validation Function
// =======================

/**
 * Validates if both given time configurations are eqivalent.
 * 
 * @param timeConfig1 - The first time config to analyze.
 * @param timeConfig2 - The second time config to analyze.
 * @returns True if both configs are equal, else false.
 */
export function arePlannerEventTimesEqual(
    timeConfig1?: ITimeConfig,
    timeConfig2?: ITimeConfig
): boolean {
    if (timeConfig1 === timeConfig2) return true; // both undefined
    if (!timeConfig1 || !timeConfig2) return false; // one is undefined, the other isn't

    return (
        timeConfig1.allDay === timeConfig2.allDay &&
        timeConfig1.startIso === timeConfig2.startIso &&
        timeConfig1.endIso === timeConfig2.endIso &&
        (timeConfig1.multiDayEnd ?? false) === (timeConfig2.multiDayEnd ?? false) &&
        (timeConfig1.multiDayStart ?? false) === (timeConfig2.multiDayStart ?? false)
    );
}
