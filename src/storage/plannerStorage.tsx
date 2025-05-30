import { PLANNER_STORAGE_ID } from "@/constants/storageIds";
import { EItemStatus } from "@/enums/EItemStatus";
import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import { TPlanner } from "@/types/planner/TPlanner";
import { generatePlanner, getCalendarAccess } from "@/utils/calendarUtils";
import { getTodayDatestamp, getYesterdayDatestamp, isTimestampValid } from "@/utils/dateUtils";
import { isItemTextfield, sanitizeList } from "@/utils/listUtils";
import { sanitizePlanner } from "@/utils/plannerUtils";
import { uuid } from "expo-modules-core";
import RNCalendarEvents from "react-native-calendar-events";
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * Fetches the planner with the given ID from storage.
 */
export function getPlannerFromStorage(datestamp: string): TPlanner {
    const eventsString = storage.getString(datestamp);
    if (eventsString)
        return JSON.parse(eventsString);
    return generatePlanner(datestamp);
};

/**
 * Saves a planner to storage.
 */
export function savePlannerToStorage(datestamp: string, newPlanner: TPlanner) {
    storage.set(datestamp, JSON.stringify(newPlanner));
};

/**
 * Creates or updates an event. Updates it in the device calendar if needed.
 * @returns - true if the item was persisted, else false
 */

/**
 * ✅ Creates or updates a planner event.
 * Calendar events will be synced. 
 * Modified recurring events will be hidden and cloned.
 * Unscheduled events will be removed from the calendar.
 * Time logic will be enforced to ensure the event is placed correctly in the planner.
 * 
 * @param event - the event to update
 * @returns - The updated event in storage. If the item was removed from the planner, it will return undefined.
 */
export async function saveEvent(event: IPlannerEvent): Promise<IPlannerEvent | undefined> {
    const newPlanner = getPlannerFromStorage(event.listId);
    const newEvent = { ...event, status: isItemTextfield(event) ? EItemStatus.STATIC : event.status };
    const oldEvent = newPlanner.events.find(existingEvent => existingEvent.id === event.id);

    const newCalendarId = newEvent.calendarId;
    const oldCalendarId = oldEvent?.calendarId;
    const oldId = oldEvent?.id ?? newEvent.id;

    // Phase 1: Clone recurring events to allow customization. 
    // The original event will be hidden and replaced with the clone.
    if (newEvent.recurringId) {
        const clonedEvent = { ...newEvent, id: uuid.v4() };
        delete clonedEvent.recurringId;
        saveEvent(clonedEvent);

        // Continue saving to mark this recurring event as hidden
        newEvent.status = EItemStatus.HIDDEN;
        delete newEvent.timeConfig;
    }

    // Phase 2: Handle calendar events.
    if (newCalendarId) {
        // Update the device calendar with the new data.
        await getCalendarAccess();
        const calendarEventId = await RNCalendarEvents.saveEvent(
            newEvent.value,
            {
                startDate: newEvent.timeConfig!.startTime,
                endDate: newEvent.timeConfig!.endTime,
                allDay: newEvent.timeConfig!.allDay,
                id: newEvent.calendarId === 'NEW' ? undefined : newEvent.calendarId
            }
        );

        // Sync the planner event ID with the calendar event ID.
        newEvent.calendarId = calendarEventId;
        newEvent.id = calendarEventId;

        if (event.timeConfig?.allDay) {
            // Remove this event from the planner.
            newPlanner.events = newPlanner.events.filter(existingEvent => existingEvent.id !== event.id);
            savePlannerToStorage(newEvent.listId, newPlanner);
            return;
        }
    } else if (oldCalendarId) {
        // Delete unscheduled event from the calendar. 
        await getCalendarAccess();
        await RNCalendarEvents.removeEvent(oldCalendarId);
    }

    newPlanner.events = sanitizePlanner(newPlanner.events, newEvent, oldId);
    console.log(newPlanner.events, 'events')
    savePlannerToStorage(newEvent.listId, newPlanner);
    return newEvent;
}

/**
 * 
 * @param eventsToDelete 
 */
export async function deleteEvents(eventsToDelete: IPlannerEvent[]) {
    const eventsByList: Record<string, IPlannerEvent[]> = {};

    // First pass - group events and handle calendar removals
    for (const eventToDelete of eventsToDelete) {
        if (!eventsByList[eventToDelete.listId]) {
            eventsByList[eventToDelete.listId] = [];
        }
        eventsByList[eventToDelete.listId].push(eventToDelete);

        // Await calendar deletions
        if (
            eventToDelete.calendarId &&
            eventToDelete.listId !== getTodayDatestamp()
        ) {
            await getCalendarAccess();
            await RNCalendarEvents.removeEvent(eventToDelete.calendarId);
        }
    }

    // Second pass - process each list in parallel
    Object.entries(eventsByList).map(async ([listId, listEvents]) => {
        let newPlanner = getPlannerFromStorage(listId);
        const todayDatestamp = getTodayDatestamp();

        const recurringOrTodayCalendarIds = new Set<string>();
        const regularDeleteIds = new Set<string>();

        for (const event of listEvents) {
            if (event.recurringId || (event.calendarId && event.listId === todayDatestamp)) {
                recurringOrTodayCalendarIds.add(event.id);
            } else {
                regularDeleteIds.add(event.id);
            }
        }

        newPlanner.events = newPlanner.events
            .map(event => (recurringOrTodayCalendarIds.has(event.id) ? { ...event, status: EItemStatus.HIDDEN } : event))
            .filter(event => !regularDeleteIds.has(event.id));

        savePlannerToStorage(listId, newPlanner);
    });
}

/**
 * Deletes all the planners from before today's date, and returns the planner from yesterday.
 * @returns - all the remaining events from yesterday
 */
export function getCarryoverEventsAndCleanStorage(): IPlannerEvent[] {
    const yesterdayTimestamp = getYesterdayDatestamp();
    const todayTimestamp = getTodayDatestamp();
    const yesterdayPlannerString = storage.getString(yesterdayTimestamp);
    if (yesterdayPlannerString) {
        const yesterdayPlanner = JSON.parse(yesterdayPlannerString);

        // Delete all previous calendars
        const allStorageKeys = storage.getAllKeys();
        allStorageKeys.map(timestamp => {
            if (isTimestampValid(timestamp) && (new Date(timestamp) < new Date(todayTimestamp))) {
                storage.delete(timestamp);
            }
        });
        return yesterdayPlanner.events
            // Remove hidden items
            .filter((event: IPlannerEvent) => {
                event.status !== EItemStatus.HIDDEN && !event.recurringId
            })
            // Remove any time configs 
            .map((event: IPlannerEvent) => {
                delete event.calendarId;
                if (event.timeConfig) {
                    const newEvent = { ...event };
                    delete newEvent.timeConfig;
                    return newEvent;
                }
                return event;
            });
    }
    return [];
};