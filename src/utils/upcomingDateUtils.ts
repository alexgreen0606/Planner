import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IUpcomingDate } from "@/lib/types/listItems/IUpcomingDate";
import { getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import * as Calendar from 'expo-calendar';
import { uuid } from "expo-modules-core";
import { hasCalendarAccess } from "./accessUtils";
import { getCalendarMap, loadExternalCalendarData } from "./calendarUtils";
import { getAllMountedDatestampsFromStore } from "./plannerUtils";
import { getUpcomingDateEventFromStorageById, getUpcomingDatePlannerFromStorage, deleteUpcomingDateEventFromStorageById, saveUpcomingDateEventToStorage, saveUpcomingDatePlannerToStorage } from "@/storage/upcomingDateStorage";

// ✅ 

// ==================
//  Helper Functions
// ==================

/**
 * Converts a calendar event to a UpcomingDate.
 * 
 * @param calendarEvent - The calendar event to convert.
 * @param calendar - The calendar that contains this event.
 * @param existingEventId - An ID to use for the event. If not provided, a new ID will be generated.
 * @returns An upcoming date Event with the data from the calendar event.
 */
function mapCalendarEventToUpcomingDate(
    calendarEvent: Calendar.Event,
    calendar: Calendar.Calendar,
    existingEventId?: string
): IUpcomingDate {
    return {
        id: existingEventId ?? uuid.v4(),
        value: calendarEvent.title,
        listId: EStorageKey.UPCOMING_DATE_LIST_KEY,
        startIso: calendarEvent.startDate as string,
        storageId: EStorageId.UPCOMING_DATE_EVENT,
        calendarId: calendar.id,
        calendarEventId: calendarEvent.id,
        isRecurring: Boolean(calendarEvent.recurrenceRule),
        color: calendar.color,
        editable: calendar.allowsModifications
    }
}

/**
 * Calculates a valid index for a upcomingDate event that maintains chronological ordering within the planner.
 * 
 * @param event - The upcomingDate event to assess.
 * @param upcomingDateIds - The planner with the current ordering of events.
 * @returns A new index for the event that maintains chronological ordering within the planner.
 */
function calculateChronologicalUpcomingDateEventIndex(
    event: IUpcomingDate,
    upcomingDateIds: string[]
): number {
    const prevIndex = upcomingDateIds.indexOf(event.id);

    if (prevIndex === -1) {
        throw new Error(`calculateChronologicalUpcomingDateEventIndex: No event exists in the upcomingDate planner with ID ${event.id}`);
    }

    const upcomingDateEvents = upcomingDateIds.map(id => {
        if (id === event.id) {
            return event;
        }
        return getUpcomingDateEventFromStorageById(id);
    });
    const earlierTime = upcomingDateEvents[prevIndex - 1]?.startIso;
    const laterTime = upcomingDateEvents[prevIndex + 1]?.startIso;

    // Pre-Check: Check if the event conflicts at its current position.
    if (
        (!earlierTime || isTimeEarlierOrEqual(earlierTime, event.startIso)) &&
        (!laterTime || isTimeEarlierOrEqual(event.startIso, laterTime))
    ) return prevIndex;

    const plannerEventsWithoutEvent = upcomingDateEvents.filter(e => e.id !== event.id);

    // Traverse the list in reverse to find the last upcomingDate event that starts before or at the same time.
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
async function getAllUpcomingDateEventsFromCalendar(): Promise<Calendar.Event[]> {
    // Check calendar access first
    if (!hasCalendarAccess()) {
        return [];
    }

    // Set date range from today to 3 years from now
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`);

    // Get all calendar IDs
    const allCalendarsMap = await getCalendarMap();
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
 * Upserts all device upcomingDate calendar events into the upcomingDate planner. The device calendar has final say
 * on the events.
 */
export async function upsertCalendarEventsIntoUpcomingDatePlanner() {
    const calendarEvents = await getAllUpcomingDateEventsFromCalendar();
    const upcomingDateEventIds = getUpcomingDatePlannerFromStorage();

    const allCalendarsMap = await getCalendarMap();

    const existingCalendarIds = new Set<string>();
    let newUpcomingDatePlanner: string[] = [];

    // Parse the planner to delete old calendar events and update existing ones.
    upcomingDateEventIds.forEach((eventId) => {
        const upcomingDateEvent = getUpcomingDateEventFromStorageById(eventId);
        if (upcomingDateEvent.calendarEventId && existingCalendarIds.has(upcomingDateEvent.calendarEventId)) return;

        const calendarEvent = calendarEvents.find((e) => e.id === upcomingDateEvent.calendarEventId && !e.isDetached);
        if (!calendarEvent) {
            // Don't keep this storage event if its link no longer exists in the device calendar.
            deleteUpcomingDateEventFromStorageById(upcomingDateEvent.id);
            return;
        }

        const calendar = allCalendarsMap[calendarEvent.calendarId];
        if (!calendar) return;

        const updatedEvent = mapCalendarEventToUpcomingDate(calendarEvent, calendar, eventId);

        existingCalendarIds.add(calendarEvent.id);
        newUpcomingDatePlanner.push(updatedEvent.id);

        // Update the event in storage and add it to its planner.
        saveUpcomingDateEventToStorage(updatedEvent);
        newUpcomingDatePlanner = updateUpcomingDateEventIndexWithChronologicalCheck(newUpcomingDatePlanner, newUpcomingDatePlanner.length - 1, updatedEvent);
    }, []);

    // Parse the calendar to add new calendar events.
    calendarEvents.forEach((calendarEvent) => {
        if (calendarEvent.isDetached) return;

        const isEventAdded = existingCalendarIds.has(calendarEvent.id);
        if (isEventAdded) return;

        const calendar = allCalendarsMap[calendarEvent.calendarId];
        if (!calendar) return;

        const newEvent = mapCalendarEventToUpcomingDate(calendarEvent, calendar);

        existingCalendarIds.add(calendarEvent.id);
        newUpcomingDatePlanner.push(newEvent.id);

        // Create the event in storage and add it to the upcomingDate planner.
        saveUpcomingDateEventToStorage(newEvent);
        newUpcomingDatePlanner = updateUpcomingDateEventIndexWithChronologicalCheck(newUpcomingDatePlanner, upcomingDateEventIds.length, newEvent);
    });

    saveUpcomingDatePlannerToStorage(newUpcomingDatePlanner);
}

// =================
// 3. Read Function
// =================

/**
 * Fetches a upcomingDate event from storage by its calendar event ID.
 * 
 * @param calendarEventId - The ID of the calendar event.
 * @returns The upcomingDate event associated with the calendar event ID.
 */
export function getUpcomingDateIdFromStorageByCalendarId(calendarEventId: string): string | undefined {
    const storagePlanner = getUpcomingDatePlannerFromStorage();
    const storageEvents = storagePlanner.map(getUpcomingDateEventFromStorageById);
    return storageEvents.find(e => e.calendarEventId === calendarEventId)?.id;
}

// ====================
// 4. Update Functions
// ====================

/**
 * Creates or updates an event in the device calendar using the data within its upcomingDate event.
 * 
 * @param upcomingDateEvent - The upcomingDate event with the updated data.
 * @param prevDatestamp - The previous datestamp of the event.
 */
export async function updateDeviceCalendarEventByUpcomingDateEvent(upcomingDateEvent: IUpcomingDate, prevDatestamp?: string) {
    if (upcomingDateEvent.value.trim() === '') return;

    const { value: title, startIso: startDate, calendarEventId, calendarId } = upcomingDateEvent;

    let eventId = calendarEventId;

    // If no calendarEventId exists, create a new event.
    if (!calendarEventId) {
        eventId = await Calendar.createEventAsync(calendarId, {
            title,
            startDate,
            endDate: startDate,
            allDay: true,
        });

        // Update the local event with the new calendarEventId.
        const updatedEvent = {
            ...upcomingDateEvent,
            calendarEventId: eventId
        };
        saveUpcomingDateEventToStorage(updatedEvent);
    } else {
        // Update existing event
        await Calendar.updateEventAsync(calendarEventId, {
            title,
            startDate,
            endDate: startDate,
            allDay: true,
        }, { futureEvents: true });
    }

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
 * Updates a upcomingDate event's position within its planner.
 * 
 * @param upcomingDateIds - The current ordering of upcomingDate event IDs.
 * @param index - The desired index of the event.
 * @param event - The upcomingDate event to place.
 * @returns The updated upcomingDate planner with the new positions of events.
 */
export function updateUpcomingDateEventIndexWithChronologicalCheck(
    upcomingDateIds: string[],
    index: number,
    event: IUpcomingDate
): string[] {

    // Add the upcomingDate to its desired position.
    let newIds = upcomingDateIds.filter(id => id !== event.id);
    newIds.splice(index, 0, event.id);

    // Verify chronological order.
    const newEventIndex = calculateChronologicalUpcomingDateEventIndex(event, newIds);
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
 * Deletes a UpcomingDate from the device calendar and storage.
 * 
 * @param upcomingDateEvent The UpcomingDate to delete.
 */
export async function deleteUpcomingDateAndReloadCalendar(upcomingDateEvent: IUpcomingDate) {

    // Phase 1: Delete the event from the calendar.
    if (upcomingDateEvent.calendarEventId) {
        await Calendar.deleteEventAsync(upcomingDateEvent.calendarEventId, { futureEvents: true });
    }

    // Phase 2: Remove the event from its planner in storage.
    const upcomingDatePlanner = getUpcomingDatePlannerFromStorage();
    saveUpcomingDatePlannerToStorage(
        upcomingDatePlanner.filter(id => id !== upcomingDateEvent.id)
    );

    // Phase 3: Delete the event from storage.
    deleteUpcomingDateEventFromStorageById(upcomingDateEvent.id);

    // Phase 4: Reload the calendar data if the event affects the current planners.
    const allVisibleDatestamps = getAllMountedDatestampsFromStore();
    const upcomingDateDatestamp = isoToDatestamp(upcomingDateEvent.startIso);
    if (allVisibleDatestamps.includes(upcomingDateDatestamp)) {
        await loadExternalCalendarData([upcomingDateDatestamp]);
    }
}