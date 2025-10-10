import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { ICountdownEvent } from "@/lib/types/listItems/ICountdownEvent";
import { deleteCountdownEventFromStorageById, getCountdownEventFromStorageById, getCountdownPlannerFromStorage, saveCountdownEventToStorage, saveCountdownPlannerToStorage } from "@/storage/countdownStorage";
import { getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import * as Calendar from 'expo-calendar';
import { uuid } from "expo-modules-core";
import { createCalendarIdToCalendarMap, loadExternalCalendarData } from "./calendarUtils";
import { getAllMountedDatestampsFromStore } from "./plannerUtils";
import { hasCalendarAccess } from "./accessUtils";

// ✅ 

// ====================
// 1. Helper Functions
// ====================

/**
 * Converts a calendar event to a Countdown.
 * 
 * @param calendarEvent - The calendar event to convert.
 * @param calendarColor - The color of the calendar that contains this event.
 * @param existingEventId - An ID to use for the event. If not provided, a new ID will be generated.
 * @returns A Countdown Event with the data from the calendar event.
 */
function mapCalendarEventToCountdown(
    calendarEvent: Calendar.Event,
    calendarColor: string,
    existingEventId?: string
): ICountdownEvent {
    return {
        id: existingEventId ?? uuid.v4(),
        value: calendarEvent.title,
        listId: EStorageKey.COUNTDOWN_LIST_KEY,
        startIso: calendarEvent.startDate as string,
        storageId: EStorageId.COUNTDOWN_EVENT,
        calendarId: calendarEvent.id,
        isRecurring: Boolean(calendarEvent.recurrenceRule),
        color: calendarColor
    }
}

/**
 * Calculates a valid index for a countdown event that maintains chronological ordering within the planner.
 * 
 * @param event - The countdown event to assess.
 * @param countdownIds - The planner with the current ordering of events.
 * @returns A new index for the event that maintains chronological ordering within the planner.
 */
function calculateChronologicalCountdownEventIndex(
    event: ICountdownEvent,
    countdownIds: string[]
): number {
    const prevIndex = countdownIds.indexOf(event.id);

    if (prevIndex === -1) {
        throw new Error(`calculateChronologicalCountdownEventIndex: No event exists in the countdown planner with ID ${event.id}`);
    }

    const countdownEvents = countdownIds.map(id => {
        if (id === event.id) {
            return event;
        }
        return getCountdownEventFromStorageById(id);
    });
    const earlierTime = countdownEvents[prevIndex - 1]?.startIso;
    const laterTime = countdownEvents[prevIndex + 1]?.startIso;

    // Pre-Check: Check if the event conflicts at its current position.
    if (
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, event.startIso)) &&
        (!laterTime || isTimeEarlierOrEqual(event.startIso, laterTime))
    ) return prevIndex;

    const plannerEventsWithoutEvent = countdownEvents.filter(e => e.id !== event.id);

    // Traverse the list in reverse to find the last countdown event that starts before or at the same time.
    const earlierEventIndex = plannerEventsWithoutEvent.findLastIndex(
        e => isTimeEarlierOrEqual(e.startIso, event.startIso)
    );

    if (earlierEventIndex !== -1) {
        // Found an event that starts before or at the same time - place our event right after it.
        return earlierEventIndex + 1;
    }

    // No event found that starts before or at the same time - this must be the earliest event.
    // Place it at the front of the planner.
    return 0;
}


/**
 * Fetches all future and current all-day events from ALL calendars on the device.
 * 
 * @returns All all-day calendar events from all device calendars from today until 3 years from now.
 */
async function getAllCountdownEventsFromCalendar(): Promise<Calendar.Event[]> {
    // Check calendar access first
    if (!hasCalendarAccess()) {
        return [];
    }

    // Set date range from today to 3 years from now
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`);

    // Get all calendar IDs
    const allCalendarsMap = await createCalendarIdToCalendarMap();
    const allCalendarIds = Object.keys(allCalendarsMap);

    // Fetch all events from all calendars
    const allCalendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);

    // Filter to only include all-day events
    const allDayEvents = allCalendarEvents.filter(event => event.allDay === true);

    return allDayEvents;
}

// ============================
// 2. Calendar Synchronization
// ============================

/**
 * Upserts all device countdown calendar events into the countdown planner. The device calendar has final say
 * on the events.
 */
export async function upsertCalendarEventsIntoCountdownPlanner() {
    const calendarEvents = await getAllCountdownEventsFromCalendar();
    const countdownEventIds = getCountdownPlannerFromStorage();

    const allCalendarsMap = await createCalendarIdToCalendarMap();

    const existingCalendarIds = new Set<string>();
    let newCountdownPlanner: string[] = [];

    // Parse the planner to delete old calendar events and update existing ones.
    countdownEventIds.forEach((eventId) => {
        const countdownEvent = getCountdownEventFromStorageById(eventId);
        if (countdownEvent.calendarId && existingCalendarIds.has(countdownEvent.calendarId)) return;

        const calendarEvent = calendarEvents.find((e) => e.id === countdownEvent.calendarId && !e.isDetached);
        if (!calendarEvent) {
            // Don't keep this storage event if its link no longer exists in the device calendar.
            deleteCountdownEventFromStorageById(countdownEvent.id);
            return;
        }

        existingCalendarIds.add(calendarEvent.id);

        // Get the calendar color from the map
        const calendar = allCalendarsMap[calendarEvent.calendarId];
        const calendarColor = calendar?.color || 'rgb(125,125,125)';

        const updatedEvent = mapCalendarEventToCountdown(calendarEvent, calendarColor, eventId);

        newCountdownPlanner.push(updatedEvent.id);

        // Update the event in storage and add it to its planner.
        saveCountdownEventToStorage(updatedEvent);
        newCountdownPlanner = updateCountdownEventIndexWithChronologicalCheck(newCountdownPlanner, newCountdownPlanner.length - 1, updatedEvent);
    }, []);

    // Parse the calendar to add new calendar events.
    calendarEvents.forEach((calendarEvent) => {
        if (calendarEvent.isDetached) return;

        const isEventAdded = existingCalendarIds.has(calendarEvent.id);
        if (isEventAdded) return;

        existingCalendarIds.add(calendarEvent.id);

        // Get the calendar color from the map
        const calendar = allCalendarsMap[calendarEvent.calendarId];
        const calendarColor = calendar?.color || 'rgb(125,125,125)';

        const newEvent = mapCalendarEventToCountdown(calendarEvent, calendarColor);

        newCountdownPlanner.push(newEvent.id);

        // Create the event in storage and add it to the countdown planner.
        saveCountdownEventToStorage(newEvent);
        newCountdownPlanner = updateCountdownEventIndexWithChronologicalCheck(newCountdownPlanner, countdownEventIds.length, newEvent);
    });

    saveCountdownPlannerToStorage(newCountdownPlanner);
}

// =================
// 3. Read Function
// =================

/**
 * Fetches a countdown event from storage by its calendar event ID.
 * 
 * @param calendarEventId - The ID of the calendar event.
 * @returns The countdown event associated with the calendar event ID.
 */
export function getCountdownEventIdFromStorageByCalendarId(calendarEventId: string): string | undefined {
    const storagePlanner = getCountdownPlannerFromStorage();
    const storageEvents = storagePlanner.map(getCountdownEventFromStorageById);
    return storageEvents.find(e => e.calendarId === calendarEventId)?.id;
}

/**
 * Gets the device calendar ID for the Countdown Calendar. If no such calendar exists, it will be created.
 * 
 * @returns The ID of the Countdown Calendar.
 */
export async function getCountdownCalendarId(): Promise<string> {
    const calendarMap = await createCalendarIdToCalendarMap();
    const countdownCalendar = Object.values(calendarMap).find(calendar => calendar.title === 'Countdowns');

    return countdownCalendar?.id ?? await Calendar.createCalendarAsync({
        title: 'Countdowns',
        color: 'rgb(255,56,60)',
        entityType: Calendar.EntityTypes.EVENT,
        name: 'Countdowns',
        ownerAccount: 'PlannerApp'
    });
}

// ====================
// 4. Update Functions
// ====================

/**
 * Updates an event in the device calendar using the data within its countdown event.
 * 
 * @param countdownEvent - The countdown event with the updated data.
 * @param prevDatestamp - The previous datestamp of the event.
 */
export async function updateDeviceCalendarEventByCountdownEvent(countdownEvent: ICountdownEvent, prevDatestamp?: string) {
    if (countdownEvent.value.trim() === '') return;

    const { value: title, startIso: startDate, calendarId } = countdownEvent;

    await Calendar.updateEventAsync(calendarId, {
        title,
        startDate,
        endDate: startDate,
        allDay: true,
    }, { futureEvents: true });

    // Reload the calendar data if the event affects the current planners.
    const datestampsToReload = [];
    const allVisibleDatestamps = getAllMountedDatestampsFromStore();
    const datestamp = isoToDatestamp(startDate);
    if (allVisibleDatestamps.includes(datestamp)) {
        datestampsToReload.push(datestamp);
    }
    if (prevDatestamp) {
        datestampsToReload.push(prevDatestamp);
    }
    await loadExternalCalendarData(datestampsToReload);
}

/**
 * Updates a countdown event's position within its planner.
 * 
 * @param countdownIds - The current ordering of countdown event IDs.
 * @param index - The desired index of the event.
 * @param event - The countdown event to place.
 * @returns The updated countdown planner with the new positions of events.
 */
export function updateCountdownEventIndexWithChronologicalCheck(
    countdownIds: string[],
    index: number,
    event: ICountdownEvent
): string[] {

    // Add the countdown to its desired position.
    let newIds = countdownIds.filter(id => id !== event.id);
    newIds.splice(index, 0, event.id);

    // Verify chronological order.
    const newEventIndex = calculateChronologicalCountdownEventIndex(event, newIds);
    if (newEventIndex !== index) {
        // Remove again and insert at corrected index.
        newIds = newIds.filter(id => id !== event.id);
        newIds.splice(newEventIndex, 0, event.id);
    }

    return newIds;
}

// ===================
// 5. Delete Function
// ===================

/**
 * Deletes a Countdown from the device calendar and storage.
 * 
 * @param countdownEvent The Countdown to delete.
 */
export async function deleteCountdownAndReloadCalendar(countdownEvent: ICountdownEvent) {

    // Phase 1: Delete the event from the calendar.
    if (countdownEvent.calendarId) {
        await Calendar.deleteEventAsync(countdownEvent.calendarId, { futureEvents: true });
    }

    // Phase 2: Remove the event from its planner in storage.
    const countdownPlanner = getCountdownPlannerFromStorage();
    saveCountdownPlannerToStorage(
        countdownPlanner.filter(id => id !== countdownEvent.id)
    );

    // Phase 3: Delete the event from storage.
    deleteCountdownEventFromStorageById(countdownEvent.id);

    // Phase 4: Reload the calendar data if the event affects the current planners.
    const allVisibleDatestamps = getAllMountedDatestampsFromStore();
    const countdownDatestamp = isoToDatestamp(countdownEvent.startIso);
    if (allVisibleDatestamps.includes(countdownDatestamp)) {
        await loadExternalCalendarData([countdownDatestamp]);
    }
}