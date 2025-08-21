
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { textfieldIdAtom } from '@/atoms/textfieldId';
import TimeValue from '@/components/text/TimeValue';
import { NULL } from '@/lib/constants/generic';
import { TIME_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItemIconConfig } from '@/lib/types/listItems/core/TListItemIconConfig';
import { ICountdown } from '@/lib/types/listItems/ICountdown';
import { IPlannerEvent, ITimeConfig, TDateRange } from '@/lib/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { deletePlannerEventFromStorage, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { jotaiStore } from 'app/_layout';
import * as Calendar from 'expo-calendar';
import { Event as CalendarEvent } from 'expo-calendar';
import { uuid } from 'expo-modules-core';
import { router } from 'expo-router';
import { hasCalendarAccess } from './accessUtils';
import { loadCalendarDataToStore } from './calendarUtils';
import { datestampToMidnightJsDate, getTodayDatestamp, isTimeEarlier, isTimeEarlierOrEqual, timeValueToIso } from './dateUtils';
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
 * Generates a new index for an event position that maintains time logic within its planner.
 * 
 * @param event - The event to place.
 * @param planner - The planner with the current ordering of events.
 * @returns A new index for the event that maintains chronological ordering within the planner.
 */
export function generateChronologicalPlannerEventIndex(
    event: IPlannerEvent,
    planner: TPlanner
): number {
    const eventTime = extractEventTime(event);
    const initialIndex = planner.eventIds.findIndex(id => id === event.id);

    if (initialIndex === -1) {
        throw new Error(`generateChronologicalPlannerEventIndex: No event exists in planner ${event.listId} with ID ${event.id}`);
    }

    // Pre-Check 1: The event is unscheduled or hidden. Keep it at its current index.
    if (!eventTime || planner.deletedRecurringEventIds.includes(event.id)) return initialIndex;

    const plannerEvents = planner.eventIds.map(id => {
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
 * Parses text to find a time value (HH:MM (PM or AM)) case insensitive and returns it along with the updated text.
 * 
 * @param text - The string to parse.
 * @param datestamp - A date to use when generating ISO timestamps. When not provided, time values will be returned (HH:MM format).
 * @returns The text with the time value removed, and a time object representing the time.
 */
export function extractTimeValueFromString(text: string, datestamp?: string): UserInputMetadata {
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
        }/${event.id
        }/${1 // TODO: removre
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
 * Gets all carryover events from yesterday and deletes past planners. Carryover events exclude all 
 * recurring and hidden events. Timed events will be stripped down to generic events.
 * 
 * @returns A list of planner events to append to the front of today's planner.
 */
// function getCarryoverEventsAndCleanStorage(): IPlannerEvent[] {
//     const yesterdayDatestamp = getYesterdayDatestamp();
//     const yesterdayPlanner = getPlannerFromStorageByDatestamp(yesterdayDatestamp);

//     deleteAllPastPlanners();

//     const yesterdayPlannerEvents = yesterdayPlanner.eventIds.map(getPlannerEventFromStorageById);
//     return yesterdayPlannerEvents
//         // Remove hidden and recurring events.
//         .filter((event: IPlannerEvent) =>
//             !event.isHidden &&
//             !event.recurringId &&
//             !event.recurringCloneId &&
//             !event.calendarId
//         )
//         // Convert timed events to generic.
//         .map((event: IPlannerEvent) => {
//             delete event.timeConfig;
//             return event;
//         });
// }

//     // Phase 3: Merge in carryover events from yesterday. Only applicable for today's planner.
//     if (datestamp === getTodayDatestamp()) {
//         const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
//         remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
//             const todayEvent = {
//                 ...yesterdayEvent,
//                 listId: datestamp
//             };
//             savePlannerEventToStorage(todayEvent);
//             plannerEvents.unshift(todayEvent);
//         });
//     }


// ====================
// 5. Update Functions
// ====================

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
    let newEvent = { ...event, value: userInput };

    // Phase 1: Clone modified recurring events to allow customization.
    if (newEvent.recurringId) {

        // Remove this event's link to the recurring planner.
        const currentPlanner = getPlannerFromStorageByDatestamp(newEvent.listId);
        savePlannerToStorage({
            ...currentPlanner,
            eventIds: currentPlanner.eventIds.filter(id => id !== newEvent.id),
            deletedRecurringEventIds: [...currentPlanner.deletedRecurringEventIds, newEvent.recurringId]
        })

        delete newEvent.recurringId;
    }

    const itemTime = extractEventTime(event);
    if (itemTime) return newEvent;

    const { timeConfig, updatedText } = extractTimeValueFromString(userInput, event.listId);
    if (!timeConfig) return newEvent;

    newEvent.value = updatedText;
    newEvent.timeConfig = timeConfig;

    // Update the event's position within its planner to preserve chronological ordering.
    const planner = getPlannerFromStorageByDatestamp(newEvent.listId);
    const currentIndex = planner.eventIds.findIndex(e => e === newEvent.id);
    if (currentIndex === -1) {
        throw new Error(`updatePlannerEventValueWithSmartTimeDetect: No event exists in planner ${newEvent.listId} with ID ${newEvent.id}`);
    }

    updatePlannerEventIndexWithChronologicalCheck(currentIndex, newEvent);

    return newEvent;
}

export function updatePlannerEventIndex(
    planner: TPlanner,
    index: number,
    event: IPlannerEvent
): TPlanner {
    // Remove the event if it exists already
    planner.eventIds = planner.eventIds.filter(id => id !== event.id);

    // Insert at the requested index
    planner.eventIds.splice(index, 0, event.id);

    // Verify chronological order
    const newEventIndex = generateChronologicalPlannerEventIndex(event, planner);

    if (newEventIndex !== index) {
        // Remove again and insert at corrected index
        planner.eventIds = planner.eventIds.filter(id => id !== event.id);
        planner.eventIds.splice(newEventIndex, 0, event.id);
    }

    return planner;
}

export function updatePlannerEventIndexWithChronologicalCheck(
    index: number,
    event: IPlannerEvent
) {
    const planner = getPlannerFromStorageByDatestamp(event.listId);
    const updatedPlanner = updatePlannerEventIndex(planner, index, event);
    savePlannerToStorage(updatedPlanner);
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
    const storageIdsToDelete: Set<string> = new Set();
    const recurringIdsToDelete: Set<string> = new Set();
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

        if (event.recurringId) {
            recurringIdsToDelete.add(event.recurringId);
        }

        // TODO: handle deletion of calendar events
        //|| (event.calendarId && isEventToday)

        storageIdsToDelete.add(event.id);
    }

    // Phase 2: Update all planners in storage.
    for (const planner of Object.values(plannersToUpdate)) {
        savePlannerToStorage({
            ...planner,
            eventIds: planner.eventIds.filter(id => !storageIdsToDelete.has(id)),
            deletedRecurringEventIds: planner.deletedRecurringEventIds.filter(id => !recurringIdsToDelete.has(id))
        });
    }

    // Phase 3: Delete events from storage.
    for (const eventId of storageIdsToDelete) {
        deletePlannerEventFromStorage(eventId);
    }

    // Phase 4: Reload calendar if needed.
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
        storageId: EStorageId.PLANNER_EVENT
    };
    savePlannerEventToStorage(plannerEvent);

    planner.eventIds.splice(index, 0, plannerEvent.id);
    savePlannerToStorage(planner);

    jotaiStore.set(textfieldIdAtom, plannerEvent.id);
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
        deletedRecurringEventIds: [],
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
