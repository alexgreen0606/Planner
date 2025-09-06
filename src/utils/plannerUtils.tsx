import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import { textfieldIdAtom } from '@/atoms/textfieldId';
import TimeValue from '@/components/text/TimeValue';
import { TIME_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent, ITimeConfig, TDateRange } from '@/lib/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { deletePlannerEventFromStorageById, deletePlannerFromStorageByDatestamp, getAllPlannerDatestampsFromStorage, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerEventToStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { getRecurringEventFromStorageById, getRecurringPlannerFromStorageById } from '@/storage/recurringPlannerStorage';
import { jotaiStore } from 'app/_layout';
import * as Calendar from 'expo-calendar';
import { Event as CalendarEvent } from 'expo-calendar';
import { uuid } from 'expo-modules-core';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { loadCalendarDataToStore } from './calendarUtils';
import { datestampToMidnightJsDate, getDayOfWeekFromDatestamp, getTodayDatestamp, getYesterdayDatestamp, isoToDatestamp, isTimeEarlier, isTimeEarlierOrEqual, timeValueToIso } from './dateUtils';

// ✅ 

// ====================
// 1. Helper Functions
// ====================

/**
 * Calculates a valid index for a planner event that maintains chronological ordering within its planner.
 * 
 * @param event - The event to place.
 * @param planner - The planner with the current ordering of events.
 * @returns A new index for the event that maintains chronological ordering within the planner.
 */
function calculateChronologicalPlannerEventIndex(
    event: IPlannerEvent,
    planner: TPlanner
): number {
    const eventTime = getPlannerEventTime(event);
    const prevIndex = planner.eventIds.findIndex(id => id === event.id);

    if (prevIndex === -1) {
        throw new Error(`calculateChronologicalPlannerEventIndex: No event exists in planner ${event.listId} with ID ${event.id}`);
    }

    // Pre-Check 1: The event is unscheduled. Keep it at its current index.
    if (!eventTime) return prevIndex;

    const plannerEvents = planner.eventIds.map(id => {
        if (id === event.id) {
            return event;
        }
        return getPlannerEventFromStorageById(id);
    });

    const plannerEventsWithoutEvent = plannerEvents.filter(e => e.id !== event.id);
    const timedPlanner = plannerEvents.filter(existingEvent => getPlannerEventTime(existingEvent));

    const timedPlannerIndex = timedPlanner.findIndex(e => e.id === event.id);
    const earlierTime = getPlannerEventTime(timedPlanner[timedPlannerIndex - 1]);
    const laterTime = getPlannerEventTime(timedPlanner[timedPlannerIndex + 1]);

    // Pre-Check 2: Check if the event conflicts at its current position.
    if (
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, eventTime)) &&
        (!laterTime || isTimeEarlierOrEqual(eventTime, laterTime))
    ) return prevIndex;

    // Traverse the list in reverse to find the last event that starts before or at the same time.
    const earlierEventIndex = plannerEventsWithoutEvent.findLastIndex(e => {
        const existingTime = getPlannerEventTime(e);
        if (!existingTime) return false;
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
 * Parses a planner event and returns its time. If no time exists, null will be returned.
 * 
 * @param event - The event to parse.
 * @returns The event's time value if one exists, else null.
 */
function getPlannerEventTime(event?: IPlannerEvent): string | null {
    if (!event) return null;
    return event.timeConfig?.endEventId === event.id ? event.timeConfig.endIso : event.timeConfig?.startIso ?? null;
}

/**
 * Maps a calendar event to a planner event.
 * 
 * @param datestamp - The date of the planner where the event will be placed. (YYYY-MM-DD)
 * @param event - The calendar event to map.
 * @param existingPlannerEvent - Optional planner event to merge with the calendar event.
 * @returns A planner event with the calendar data.
 */
function mapCalendarEventToPlannerEvent(datestamp: string, event: Calendar.Event, existingPlannerEvent?: IPlannerEvent): IPlannerEvent {
    const startDatestamp = isoToDatestamp(event.startDate as string);
    const endDatestamp = isoToDatestamp(event.endDate as string);

    // This is a new multi-day event.
    // Create the start and end events.
    if (!existingPlannerEvent && startDatestamp !== endDatestamp) {
        const startEventId = uuid.v4();
        const endEventId = uuid.v4();

        const startEvent: IPlannerEvent = {
            id: startEventId,
            calendarId: event.id,
            value: event.title,
            storageId: EStorageId.PLANNER_EVENT,
            listId: startDatestamp,
            timeConfig: {
                startIso: event.startDate as string,
                endIso: event.endDate as string,
                allDay: false,
                startEventId,
                endEventId
            }
        };

        const endEvent = {
            ...startEvent,
            id: endEventId,
            listId: endDatestamp,
            timeConfig: {
                ...startEvent.timeConfig!,
                startEventId,
                endEventId
            }
        };

        if (datestamp === startDatestamp) {
            savePlannerEventToStorage(endEvent);
            return startEvent;
        } else {
            if (startDatestamp > getYesterdayDatestamp()) {
                savePlannerEventToStorage(startEvent);
            }
            return endEvent;
        }
    }

    const plannerEvent: IPlannerEvent = {
        ...existingPlannerEvent,
        id: existingPlannerEvent?.id ?? uuid.v4(),
        calendarId: event.id,
        value: event.title,
        storageId: EStorageId.PLANNER_EVENT,
        listId: datestamp,
        timeConfig: {
            ...existingPlannerEvent?.timeConfig,
            startIso: event.startDate as string,
            endIso: event.endDate as string,
            allDay: false
        }
    };

    return plannerEvent;
}

/**
 * Maps a recurring event to a planner event.
 * 
 * @param datestamp - The date of the planner where the event will be placed. (YYYY-MM-DD)
 * @param recurringEvent - The recurring event to map.
 * @param existingPlannerEvent - Optional planner event to merge with the recurring event.
 * @returns A new planner event with the recurring event data.
 */
function mapRecurringEventToPlannerEvent(datestamp: string, recurringEvent: IRecurringEvent, existingPlannerEvent?: IPlannerEvent): IPlannerEvent {
    const plannerEvent: IPlannerEvent = {
        ...existingPlannerEvent,
        id: existingPlannerEvent?.id ?? uuid.v4(),
        listId: datestamp,
        storageId: EStorageId.PLANNER_EVENT,
        recurringId: recurringEvent.id,
        value: recurringEvent.value
    };
    if (recurringEvent.startTime) {
        plannerEvent.timeConfig = createPlannerEventTimeConfig(datestamp, recurringEvent.startTime);
    }

    return plannerEvent;
}

// =============================
// 2. Recurring Synchronization
// =============================

/**
 * Upserts all recurring events into a planner for the planner's day of the week. Upserted events will be 
 * saved to storage. The planner will be returned and NOT saved to storage.
 *
 * @param planner - The planner to update.
 * @returns A new planner synced with its recurring planner.
 */
export function upsertRecurringEventsIntoPlanner(planner: TPlanner): TPlanner {
    const { datestamp, deletedRecurringEventIds } = planner;

    const recurringPlanner = getRecurringPlannerFromStorageById(getDayOfWeekFromDatestamp(datestamp));
    const recurringEvents = recurringPlanner.eventIds.map(getRecurringEventFromStorageById);

    const existingRecurringIds = new Set<string>();

    const originalEventIds = [...planner.eventIds];

    // Start with a fresh list.
    planner.eventIds = [];

    // Parse the planner to delete old recurring events and update existing ones.
    originalEventIds.forEach((eventId) => {
        const plannerEvent = getPlannerEventFromStorageById(eventId);

        // Non-recurring events are preserved as-is.
        if (!plannerEvent.recurringId) {
            planner.eventIds.push(plannerEvent.id);
            return;
        }

        const recurringEvent = recurringEvents.find(recEvent => recEvent.id === plannerEvent.recurringId);

        // Don't keep this planner event if its link no longer exists in the recurring planner.
        if (!recurringEvent) {
            deletePlannerEventFromStorageById(plannerEvent.id);
            return;
        }

        existingRecurringIds.add(recurringEvent.id);

        const updatedPlannerEvent = mapRecurringEventToPlannerEvent(datestamp, recurringEvent, plannerEvent);

        // Update event in storage and add it to the planner.
        savePlannerEventToStorage(updatedPlannerEvent);
        planner = updatePlannerEventIndexWithChronologicalCheck(planner, planner.eventIds.length, updatedPlannerEvent);
    });

    // Parse the recurring events to add new recurring events.
    recurringEvents.forEach((recurringEvent) => {
        const isEventAdded = existingRecurringIds.has(recurringEvent.id);
        if (isEventAdded) return;

        const isEventDeleted = deletedRecurringEventIds.includes(recurringEvent.id);
        if (isEventDeleted) return;

        const newPlannerEvent = mapRecurringEventToPlannerEvent(datestamp, recurringEvent);

        // TODO: may want to add based on the index in the recurring planner?

        // Create event in storage and add it to the planner.
        savePlannerEventToStorage(newPlannerEvent);
        planner = updatePlannerEventIndexWithChronologicalCheck(planner, planner.eventIds.length, newPlannerEvent);
    });

    return planner;
}

// ============================
// 3. Calendar Synchronization
// ============================

/**
 * Upserts all device calendar events into a planner for its date. Upserted events will be saved to storage. The planner
 * will be returned and NOT saved to storage.
 * 
 * @param planner - The planner to update.
 * @param calendarEvents - The list of calendar events linked to the planner's date.
 * @returns A new planner synced with the calendar events.
 */
export function upsertCalendarEventsIntoPlanner(
    planner: TPlanner,
    calendarEvents: CalendarEvent[]
): TPlanner {
    const { datestamp, deletedCalendarEventIds } = planner;

    const existingCalendarIds = new Set<string>();

    const originalEventIds = [...planner.eventIds];

    // Start with a fresh list.
    planner.eventIds = [];

    // Parse the planner to delete old calendar events and update existing ones.
    originalEventIds.forEach((eventId) => {
        const planEvent = getPlannerEventFromStorageById(eventId);

        // Keep non-calendar events.
        if (!planEvent.calendarId) {
            planner.eventIds.push(planEvent.id);
            return;
        }

        const calEvent = calendarEvents.find(calEvent => calEvent.id === planEvent.calendarId);

        // Don't keep this planner event if its link no longer exists in the device calendar.
        if (!calEvent) {
            deletePlannerEventFromStorageById(planEvent.id);
            return;
        }

        existingCalendarIds.add(calEvent.id);

        const updatedEvent = mapCalendarEventToPlannerEvent(datestamp, calEvent, planEvent);

        // Update the event in storage and add it to its planner.
        savePlannerEventToStorage(updatedEvent);
        planner = updatePlannerEventIndexWithChronologicalCheck(planner, planner.eventIds.length, updatedEvent);
    }, []);

    // Parse the calendar to add new calendar events.
    calendarEvents.forEach((calEvent) => {
        const isEventAdded = existingCalendarIds.has(calEvent.id);
        if (isEventAdded) return;

        const isEventDeleted = deletedCalendarEventIds.includes(calEvent.id);
        if (isEventDeleted) return;

        const newEvent = mapCalendarEventToPlannerEvent(datestamp, calEvent);

        // Create the event in storage and add it to its planner.
        savePlannerEventToStorage(newEvent);
        planner = updatePlannerEventIndexWithChronologicalCheck(planner, planner.eventIds.length, newEvent);
    });

    return planner;
}

// ===========================
// 4. Open Planner Time Modal
// ===========================

/**
 * Opens the time modal for an event.
 *
 * @param eventId - The ID of the event to update within the modal.
 * @param triggerDatestamp - The date of the planner where the modal trigger event occurred.
 */
export function openPlannerTimeModal(eventId: string, triggerDatestamp: string) {
    router.push(`${TIME_MODAL_PATHNAME}/${eventId}/${triggerDatestamp}`);
}

// ====================
// 5. Create Functions
// ====================

/**
 * Creates a new planner event and focuses the textfield on it.
 * 
 * @param datestamp - The date of the planner. (YYYY-MM-DD)
 * @param index - The index of the new item within its planner.
 */
export function createPlannerEventInStorageAndFocusTextfield(datestamp: string, index: number) {

    // Create the new planner event.
    const plannerEvent: IPlannerEvent = {
        id: uuid.v4(),
        value: "",
        listId: datestamp,
        storageId: EStorageId.PLANNER_EVENT
    };
    savePlannerEventToStorage(plannerEvent);

    // Add the event to its planner.
    const planner = getPlannerFromStorageByDatestamp(datestamp);
    planner.eventIds.splice(index, 0, plannerEvent.id);
    savePlannerToStorage(planner);

    // Focus the textifeld on the event.
    jotaiStore.set(textfieldIdAtom, plannerEvent.id);
}

/**
 * Creates an empty planner for the given datestamp.
 * 
 * @param datestamp - The date of the planner. (YYYY-MM-DD)
 * @returns A new planner object with no events.
 */
export function createEmptyPlanner(datestamp: string): TPlanner {
    return {
        datestamp,
        title: '',
        eventIds: [],
        deletedRecurringEventIds: [],
        deletedCalendarEventIds: []
    }
}

/**
 * Creates the icon representing a planner event's time. Clicking the icon will open the Time Modal for the event.
 * 
 * @param event - The planner event to represent.
 * @returns The icon for the event's time.
 */
export function createPlannerEventTimeIcon(event: IPlannerEvent): ReactNode {
    const itemTime = getPlannerEventTime(event);
    return itemTime && (
        <TouchableOpacity onPress={() => openPlannerTimeModal(event.id, event.listId)}>
            <TimeValue
                endEvent={event.timeConfig?.endEventId === event.id}
                startEvent={event.timeConfig?.startEventId === event.id}
                isoTimestamp={itemTime}
                concise
            />
        </TouchableOpacity>
    )
}

/**
 * Creates a planner event time configuration from a datestamp and time value.
 *
 * @param datestamp - The date of the event. (YYYY-MM-DD)
 * @param timeValue - The time of the event. (HH:MM)
 * @returns A new time config representing the date and time.
 */
export function createPlannerEventTimeConfig(datestamp: string, timeValue: string): ITimeConfig {
    return {
        startIso: timeValueToIso(datestamp, timeValue),
        endIso: timeValueToIso(datestamp, "23:55"),
        allDay: false
    }
}

// ==================
// 6. Read Functions
// ==================

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
        if (ranges.some((range) =>
            isTimeEarlier(range.startIso, nextDatestamp) &&
            isTimeEarlierOrEqual(mountedStart, range.endIso)
        )) {
            affectedDatestamps.push(mountedStart);
        }
    }

    return affectedDatestamps;
}

/**
 * Fetches a planner event from storage by its calendar event ID.
 * 
 * @param datestamp - The date of the planner. (YYYY-MM-DD)
 * @param calendarEventId - The ID of the calendar event.
 * @returns The planner event associated with the calendar event ID.
 */
export function getPlannerEventFromStorageByCalendarId(datestamp: string, calendarEventId: string): IPlannerEvent {
    const storagePlanner = getPlannerFromStorageByDatestamp(datestamp);
    const storageEvents = storagePlanner.eventIds.map(getPlannerEventFromStorageById);
    return storageEvents.find(e => e.calendarId === calendarEventId)!;
}

// ====================
// 7. Update Functions
// ====================

/**
 * Updates an event in the device calendar using the data within its planner event.
 * 
 * @param event - The event with the updated data.
 */
export async function updateDeviceCalendarEventByPlannerEvent(event: IPlannerEvent) {
    if (!event.calendarId || !event.timeConfig) return;

    const { value: title, timeConfig: { startIso, endIso, allDay } } = event;
    await Calendar.updateEventAsync(event.calendarId, {
        title,
        startDate: startIso,
        endDate: endIso,
        allDay,
    }, { futureEvents: false });
}

/**
 * Updates a planner event's position within its planner. 
 * 
 * @param planner - The planner with the current ordering of events.
 * @param index - The desired index of the event.
 * @param event - The event to place.
 * @returns The updated planner with the new positions of events.
 */
export function updatePlannerEventIndexWithChronologicalCheck(
    planner: TPlanner,
    index: number,
    event: IPlannerEvent
): TPlanner {

    // Add the event to its desired position.
    planner.eventIds = planner.eventIds.filter(id => id !== event.id);
    planner.eventIds.splice(index, 0, event.id);

    // Verify chronological order.
    const newEventIndex = calculateChronologicalPlannerEventIndex(event, planner);
    if (newEventIndex !== index) {
        // Remove again and insert at corrected index.
        planner.eventIds = planner.eventIds.filter(id => id !== event.id);
        planner.eventIds.splice(newEventIndex, 0, event.id);
    }

    return planner;
}

// ====================
// 8. Delete Functions
// ====================

type TPlannerEventDeleteOptions = {
    excludeCalendarRefresh?: boolean;
    excludeCalendarDelete?: boolean;
}

/**
 * Deletes a list of planner events from the calendar and storage. The calendar data will be reloaded 
 * by default after the deletions.
 * 
 * @param events - The list of events to delete.
 * @param options - Set of rules to control speicifc actions of the deletions.
 */
export async function deletePlannerEventsFromStorageAndCalendar(
    events: IPlannerEvent[],
    options: TPlannerEventDeleteOptions = {}
) {
    const { excludeCalendarRefresh, excludeCalendarDelete } = options;

    const todayDatestamp = getTodayDatestamp();

    const plannersToUpdate: Record<string, TPlanner> = {};
    const storageIdsToDelete: Set<string> = new Set();
    const recurringIdsToDelete: string[] = [];
    const calendarIdsToHide: string[] = [];
    const affectedCalendarRanges: ITimeConfig[] = [];
    const calendarDeletePromises: Promise<any>[] = [];

    // Phase 1: Process all events.
    for (const event of events) {
        const { listId: datestamp, timeConfig, calendarId, recurringId, id } = event;

        const isEventToday = event.listId === todayDatestamp;

        // Load in the planner to update.
        if (!plannersToUpdate[datestamp]) {
            const planner = getPlannerFromStorageByDatestamp(datestamp);
            plannersToUpdate[datestamp] = planner;
        }

        // Ensure recurring events are marked as deleted so they are not re-synced with the recurring planner.
        if (recurringId) {
            recurringIdsToDelete.push(recurringId);
        }

        if (calendarId) {

            // Ensure both start and end events are deleted for multi-day events not from today.
            const isMultiDay = !!timeConfig!.startEventId || !!timeConfig!.endEventId;
            if (isMultiDay && !isEventToday) {
                const startEventDatestamp = isoToDatestamp(timeConfig!.startIso);
                const endEventDatestamp = isoToDatestamp(timeConfig!.endIso);
                const isStartEvent = startEventDatestamp === datestamp;

                // Ensure both start and end events are deleted.
                if (isStartEvent) {

                    // Ensure the end event is deleted from storage.
                    const endPlanner = getPlannerFromStorageByDatestamp(endEventDatestamp);
                    plannersToUpdate[endEventDatestamp] = endPlanner;
                    storageIdsToDelete.add(timeConfig!.endEventId!);
                } else {

                    // Ensure the start event is deleted from storage.
                    const startPlanner = getPlannerFromStorageByDatestamp(startEventDatestamp);
                    plannersToUpdate[startEventDatestamp] = startPlanner;
                    storageIdsToDelete.add(timeConfig!.startEventId!);
                }
            }

            // Handle calendar deletions.
            if (!excludeCalendarDelete) { // Excluding means the calendar ID will be reused for a new event. (see TimeModal)
                if (isEventToday) {
                    // Mock a calendar delete (event remains in calendar but stays hidden in planner).
                    calendarIdsToHide.push(calendarId);
                } else {
                    // Delete the event from the device calendar.
                    calendarDeletePromises.push(Calendar.deleteEventAsync(calendarId));
                    affectedCalendarRanges.push(event.timeConfig!);
                }
            }

        }

        // Mark the event deletion from storage.
        storageIdsToDelete.add(event.id);

    }

    // Phase 2: Update all planners in storage.
    for (const planner of Object.values(plannersToUpdate)) {
        savePlannerToStorage({
            ...planner,
            eventIds: planner.eventIds.filter(id => !storageIdsToDelete.has(id)),
            deletedRecurringEventIds: [
                ...planner.deletedRecurringEventIds,
                ...recurringIdsToDelete
            ],
            deletedCalendarEventIds: [
                ...planner.deletedCalendarEventIds,
                ...calendarIdsToHide
            ]
        });
    }

    // Phase 3: Delete events from storage.
    for (const eventId of storageIdsToDelete) {
        deletePlannerEventFromStorageById(eventId);
    }

    // Phase 4: Reload calendar if needed.
    await Promise.all(calendarDeletePromises);
    if (!excludeCalendarRefresh && !excludeCalendarDelete && affectedCalendarRanges.length > 0) {
        const datestampsToReload = getAllMountedDatestampsLinkedToDateRanges<ITimeConfig>(affectedCalendarRanges);
        await loadCalendarDataToStore(datestampsToReload);
    }
}

/**
 * Deletes all planners and their events from storage that occurred before yesterday's date.
 */
export function deleteAllPlannersInStorageBeforeYesterday() {
    const yesterdayDatestamp = getYesterdayDatestamp();

    getAllPlannerDatestampsFromStorage().forEach(datestamp => {
        if (isTimeEarlier(datestamp, yesterdayDatestamp)) {
            const planner = getPlannerFromStorageByDatestamp(datestamp);
            planner.eventIds.forEach(deletePlannerEventFromStorageById);
            deletePlannerFromStorageByDatestamp(datestamp);
        }
    });
}
