
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
import { deleteAllPastPlanners, deletePlannerEventFromStorage, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { getRecurringPlannerFromStorage } from '@/storage/recurringPlannerStorage';
import { jotaiStore } from 'app/_layout';
import * as Calendar from 'expo-calendar';
import { Event as CalendarEvent } from 'expo-calendar';
import { uuid } from 'expo-modules-core';
import { router } from 'expo-router';
import { hasCalendarAccess } from './accessUtils';
import { loadCalendarDataToStore } from './calendarUtils';
import { datestampToMidnightJsDate, getDayOfWeekFromDatestamp, getTodayDatestamp, getYesterdayDatestamp, isTimeEarlier, isTimeEarlierOrEqual, timeValueToIso } from './dateUtils';
import { generateSortId, sortListWithUpsertItem } from './listUtils';
import { mapCalendarEventToPlannerEvent } from './map/mapCalenderEventToPlannerEvent';

//

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
export function openTimeModal(
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
export function syncPlannerWithCalendar(
    datestamp: string,
    plannerEvents: IPlannerEvent[],
    calendarEvents: CalendarEvent[]
): IPlannerEvent[] {
    return plannerEvents;
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
 * @returns A new list of planner events synced with the recurring events.
 */
export function syncPlannerWithRecurring(
    datestamp: string,
    plannerEvents: IPlannerEvent[]
): IPlannerEvent[] {

    const getRecurringEventTimeConfig = (recEvent: IRecurringEvent): ITimeConfig => {
        return {
            startIso: timeValueToIso(datestamp, recEvent.startTime!),
            endIso: timeValueToIso(datestamp, '23:55'),
            allDay: false
        };
    };

    const recurringPlanner = getRecurringPlannerFromStorage(getDayOfWeekFromDatestamp(datestamp));

    const newPlannerEvents = plannerEvents.reduce<IPlannerEvent[]>((acc, planEvent) => {

        // Hidden and non-recurring events are preserved as-is.
        if (!planEvent.recurringId || planEvent.status === EItemStatus.HIDDEN) {
            acc.push(planEvent);
            return acc;
        }

        const recEvent = recurringPlanner.find(recEvent => recEvent.id === planEvent.recurringId);

        // Don't keep this recurring event if it no longer exists in the recurring planner.
        if (!recEvent) return acc;

        const baseEvent: IPlannerEvent = {
            ...planEvent,
            value: recEvent!.value
        };

        if (recEvent.startTime) {
            baseEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
        }

        savePlannerEventToStorage(baseEvent);

        acc.push(baseEvent);
        return acc;
    }, []);

    recurringPlanner.forEach((recEvent) => {
        const alreadyExists = newPlannerEvents.some(planEvent => planEvent.recurringId === recEvent.id);
        if (alreadyExists) return;

        const baseEvent: IPlannerEvent = {
            id: uuid.v4(),
            listId: datestamp,
            status: EItemStatus.STATIC,
            listType: EListType.EVENT,
            recurringId: recEvent.id,
            value: recEvent.value
        };

        if (recEvent.startTime) {
            baseEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
        }

        // Insert the event in the back of the list and adjust if the item is timed.
        const plannerEventIds = newPlannerEvents.map(e => e.id);
        plannerEventIds.push(baseEvent.id);
        const eventIndex = generateChronologicalPlannerEventIndex(baseEvent, plannerEventIds);
        newPlannerEvents.splice(eventIndex, 0, baseEvent);

        savePlannerEventToStorage(baseEvent);
    });

    return newPlannerEvents;
}

/**
 * Gets all carryover events from yesterday and deletes past planners. Carryover events exclude all 
 * recurring and hidden events. Timed events will be stripped down to generic events.
 * 
 * @returns A list of planner events to append to the front of today's planner.
 */
function getCarryoverEventsAndCleanStorage(): IPlannerEvent[] {
    const yesterdayDatestamp = getYesterdayDatestamp();
    const yesterdayPlanner = getPlannerFromStorageByDatestamp(yesterdayDatestamp);

    deleteAllPastPlanners();

    const yesterdayPlannerEvents = yesterdayPlanner.eventIds.map(getPlannerEventFromStorageById);
    return yesterdayPlannerEvents
        // Remove hidden and recurring events.
        .filter((event: IPlannerEvent) =>
            event.status !== EItemStatus.HIDDEN &&
            !event.recurringId &&
            !event.recurringCloneId &&
            !event.calendarId
        )
        // Convert timed events to generic.
        .map((event: IPlannerEvent) => {
            delete event.timeConfig;
            return event;
        });
}

// =================
// 2. Sort Function
// =================


// DEPRECATED
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
): Promise<string[]> {
    const datestamp = storagePlanner.datestamp;
    const planner = { ...storagePlanner };

    let plannerEvents = planner.eventIds.map(getPlannerEventFromStorageById);

    // Phase 1: Merge in any recurring events for the given weekday.
    plannerEvents = syncPlannerWithRecurring(datestamp, plannerEvents);

    // Phase 2: Merge in any events from the calendar.
    if (hasCalendarAccess()) {
        plannerEvents = syncPlannerWithCalendar(datestamp, plannerEvents, calendarEvents);
    } else {
        // planner.eventIds = planner.eventIds.filter(event => !event.calendarId);

        // TODO: remove any calendar events
    }

    // Phase 3: Merge in carryover events from yesterday. Only applicable for today's planner.
    if (datestamp === getTodayDatestamp()) {
        const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
        remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
            const todayEvent = {
                ...yesterdayEvent,
                listId: datestamp
            };
            savePlannerEventToStorage(todayEvent);
            plannerEvents.unshift(todayEvent);
        });
    }

    planner.eventIds = plannerEvents.map(e => e.id);

    // Phase 4: Save the planner to storage if any events were added or removed during build.
    if (
        // The planner gained new events
        planner.eventIds.some(planId =>
            !storagePlanner.eventIds.some(existingId => existingId === planId)
        ) ||
        // The planner lost existing events
        storagePlanner.eventIds.some(existingId =>
            !planner.eventIds.some(planId => planId === existingId)
        )
    ) savePlannerToStorage(planner);

    return planner.eventIds;
}

// ===============================
// 4. Smart Time Detect Functions
// ===============================

/**
 * Updates a planner event's value, detecting any time value within the user input and converting it into a time 
 * configuration for the event. The planner will be updated if the event position must change to preserve
 * chronological ordering.
 * 
 * @param userInput - The user input to scan.
 * @param event - The planner event to update.
 * @returns The updated event.
 */
export function updatePlannerEventValueWithSmartTimeDetect(
    userInput: string,
    event: IPlannerEvent
): IPlannerEvent {
    const newEvent = { ...event, value: userInput };

    const itemTime = extractEventTime(event);
    if (itemTime) return newEvent;

    const { timeConfig, updatedText } = extractTimeValueFromString(userInput, event.listId);
    if (!timeConfig) return newEvent;

    newEvent.value = updatedText;
    newEvent.timeConfig = timeConfig;

    // Update the item's position within its planner to preserve chronological ordering.
    const planner = getPlannerFromStorageByDatestamp(newEvent.listId);
    const currentIndex = planner.eventIds.findIndex(e => e === newEvent.id);
    if (currentIndex === -1) {
        throw new Error(`updatePlannerEventValueWithSmartTimeDetect: No event exists in planner ${newEvent.listId} with ID ${newEvent.id}`);
    }

    updatePlannerEventIndexWithChronologicalCheck(newEvent, currentIndex);

    return newEvent;
}

/**
 * Updates an event based on user input for the event's value, detecting time values and converting them into a time config for the event.
 * 
 * @param text - The text input from the user.
 * @param event - The event being updated.
 * @param isRecurring - Signifies if the event is a recurring event. Otherwise the event is treated as a planner event.
 * @returns The updated event.
 */
export function updateRecurringEventValueWithSmartTimeDetect(
    text: string,
    event: IRecurringEvent,
    isRecurring?: string
): IRecurringEvent {
    const newEvent = { ...event, value: text };

    const itemTime = extractEventTime(event);
    if (itemTime) return newEvent;

    const { timeConfig, updatedText } = extractTimeValueFromString(text, isRecurring ? event.listId : undefined);
    if (!timeConfig) return newEvent;

    newEvent.value = updatedText;

    if (isRecurring) {
        (newEvent as IRecurringEvent).startTime = timeConfig.startIso;
    } else {
        (newEvent as IPlannerEvent).timeConfig = timeConfig;
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

// NEW FUNCTION ----------------------
export function updatePlannerEventIndexWithChronologicalCheck(index: number, event: IPlannerEvent) {
    const planner = getPlannerFromStorageByDatestamp(event.listId);

    // Move the event ID to its desired position.
    planner.eventIds = planner.eventIds.filter(id => id !== event.id);
    planner.eventIds.splice(index, 0, event.id);

    // Check if the desired position preserves chronological ordering.
    const newEventIndex = generateChronologicalPlannerEventIndex(event, planner.eventIds);
    if (newEventIndex === index) {
        savePlannerToStorage(planner);
        return;
    }

    // Move the event to a valid position.
    planner.eventIds = planner.eventIds.filter(id => id !== event.id);
    planner.eventIds.splice(newEventIndex, 0, event.id);
    savePlannerToStorage(planner);
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

// ====================
// 7. Delete Functions
// ====================

/**
 * Deletes a list of planner events from the calendar and storage. The calendar data will
 * be reloaded by default after the deletions.
 * 
 * @param events - The list of events to delete.
 * @param excludeCalendarRefresh - When true the calendar will not be reloaded after the deletions.
 */
export async function deletePlannerEventsFromStorageAndCalendar(
    events: IPlannerEvent[],
    excludeCalendarRefresh: boolean = false
) {
    const todayDatestamp = getTodayDatestamp();

    const plannersToUpdate: Record<string, TPlanner> = {};
    const eventIdsToDelete: Set<string> = new Set();
    const eventsToHide: IPlannerEvent[] = [];
    const deletedTimeRanges: ITimeConfig[] = [];
    const calendarDeletePromises: Promise<any>[] = [];

    // Phase 1: Process all events.
    for (const event of events) {

        // Load in the planner to update.
        if (!plannersToUpdate[event.listId]) {
            const planner = getPlannerFromStorageByDatestamp(event.listId);
            plannersToUpdate[event.listId] = planner;
        }

        const isEventToday = event.listId === todayDatestamp;

        // Delete calendar records.
        if (event.calendarId && !isEventToday && hasCalendarAccess()) {
            calendarDeletePromises.push(Calendar.deleteEventAsync(event.calendarId));
            deletedTimeRanges.push(event.timeConfig!);
        }

        // Decide whether to hide or delete.
        if (event.recurringId || event.recurringCloneId || (event.calendarId && isEventToday)) {
            eventsToHide.push(event);
        } else {
            eventIdsToDelete.add(event.id);
        }

    }

    // Phase 2: Update all planners in storage.
    for (const planner of Object.values(plannersToUpdate)) {
        savePlannerToStorage({
            ...planner,
            eventIds: planner.eventIds.filter(id => !eventIdsToDelete.has(id))
        });
    }

    // Phase 3: Hide events.
    for (const event of eventsToHide) {
        savePlannerEventToStorage({
            ...event,
            status: EItemStatus.HIDDEN
        });
    }

    // Phase 4: Delete events from storage.
    for (const eventId of eventIdsToDelete) {
        deletePlannerEventFromStorage(eventId);
    }

    // Phase 5: Reload calendar if needed.
    await Promise.all(calendarDeletePromises);
    if (!excludeCalendarRefresh && deletedTimeRanges.length > 0) {
        const datestampsToReload = getAllMountedDatestampsLinkedToDateRanges<ITimeConfig>(deletedTimeRanges);
        await loadCalendarDataToStore(datestampsToReload);
    }
}

// ========================
// 8. Generation Functions
// ========================

/**
 * Generates a new planner event for a given planner. The new event will focus the textfield.
 * 
 * @param datestamp - The date of the planner. (YYYY-MM-DD)
 * @param index - The index of the new item within its planner.
 */
export function generateNewPlannerEventAndSaveToStorage(datestamp: string, index: number) {
    const planner = getPlannerFromStorageByDatestamp(datestamp);

    const plannerEvent: IPlannerEvent = {
        id: uuid.v4(),
        value: "",
        listId: datestamp,
        status: EItemStatus.NEW,
        listType: EListType.EVENT
    };
    savePlannerEventToStorage(plannerEvent);

    planner.eventIds.splice(index, 0, plannerEvent.id);
    savePlannerToStorage(planner);
}

/**
 * Generates a new index for an event position that maintains time logic within its planner.
 * 
 * @param event - The event to place.
 * @param plannerEventIds - The current ordering of events in the planner.
 * @returns A new index for the event that maintains chronological ordering within the planner.
 */
export function generateChronologicalPlannerEventIndex(
    event: IPlannerEvent,
    plannerEventIds: string[]
): number {
    const eventTime = extractEventTime(event);
    const initialIndex = plannerEventIds.findIndex(id => id === event.id);

    if (initialIndex === -1) {
        throw new Error(`generatePlannerEventIndexByTime: No event exists in planner ${event.listId} with ID ${event.id}`);
    }

    // Pre-Check 1: The event is unscheduled or hidden. Keep it at its current index.
    if (!eventTime || event.status === EItemStatus.HIDDEN) return initialIndex;

    const plannerEvents = plannerEventIds.map(id => {
        if (id === event.id) {
            return event;
        }
        return getPlannerEventFromStorageById(id);
    });

    const plannerEventsWithoutEvent = [...plannerEvents].filter(e => e.id !== event.id);
    const timedPlanner = [...plannerEvents].filter(existingEvent => extractEventTime(existingEvent));

    const timedPlannerIndex = timedPlanner.findIndex(e => e.id === event.id);

    const earlierEvent = timedPlanner[timedPlannerIndex - 1];
    const laterEvent = timedPlanner[timedPlannerIndex + 1];
    const earlierTime = extractEventTime(earlierEvent);
    const laterTime = extractEventTime(laterEvent);

    // Pre-Check 2: Check if the event conflicts at its current position.
    if (
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, eventTime)) &&
        (!laterTime || isTimeEarlierOrEqual(eventTime, laterTime))
    ) return initialIndex;

    // Traverse the list in reverse to find the last event that starts before or at the same time.
    const earlierEventIndex = plannerEventsWithoutEvent.findLastIndex(e => {
        const existingTime = extractEventTime(e);
        if (!existingTime) return false;

        // Check if existing event starts before or at the same time as our event
        return isTimeEarlierOrEqual(existingTime, eventTime);
    });

    if (earlierEventIndex !== -1) {
        // Found an event that starts before or at the same time - place our event right after it.
        return earlierEventIndex + 1;
    }

    // No event found that starts before or at the same time - this must be the earliest event.
    // Place it at the front of the planner.
    return 0;
}

export function generateRecurringEventIndexByTime(
    event: IPlannerEvent | IRecurringEvent | ICountdown
): number {
    // console.info('generateSortIdByTime START', { event: { ...event }, events: [...events] });
    const planner = getPlannerFromStorageByDatestamp(event.listId);
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

export function generateCountdownEventIndexByTime(
    event: IPlannerEvent | IRecurringEvent | ICountdown
): number {
    // console.info('generateSortIdByTime START', { event: { ...event }, events: [...events] });
    const planner = getPlannerFromStorageByDatestamp(event.listId);
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
 * Generates an empty planner for the given datestamp.
 * 
 * @param datestamp - The date of the planner. (YYYY-MM-DD)
 * @returns A new planner object with no linked events.
 */
export function generateEmptyPlanner(datestamp: string): TPlanner {
    return {
        datestamp,
        title: '',
        eventIds: [],
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

// =======================
// 9. Validation Function
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
