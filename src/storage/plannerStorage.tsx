import { PLANNER_STORAGE_ID } from "@/constants/storageIds";
import { EItemStatus } from "@/enums/EItemStatus";
import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import { TPlanner } from "@/types/planner/TPlanner";
import { generatePlanner, getCalendarAccess } from "@/utils/calendarUtils";
import { getTodayDatestamp, getYesterdayDatestamp, isTimestampValid } from "@/utils/dateUtils";
import { isItemTextfield } from "@/utils/listUtils";
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
export async function saveEvent(event: IPlannerEvent) {
    let newPlanner = getPlannerFromStorage(event.listId);
    let newEvent = { ...event, status: isItemTextfield(event) ? EItemStatus.STATIC : event.status };

    // The event is a calendar event -> sync the calendar
    if (newEvent.calendarId && newEvent.timeConfig) {
        await getCalendarAccess();
        const calendarEventId = await RNCalendarEvents.saveEvent(
            newEvent.value,
            {
                startDate: newEvent.timeConfig.startTime,
                endDate: newEvent.timeConfig.endTime,
                allDay: newEvent.timeConfig.allDay,
                id: newEvent.calendarId === 'NEW' ? undefined : newEvent.calendarId
            }
        );

        // Sync the planner event ID with the calendar event ID
        newEvent.calendarId = calendarEventId;
        newEvent.id = calendarEventId;

        // Remove the event from its planner if it is an all-day event
        if (event.timeConfig?.allDay) {
            newPlanner.events = newPlanner.events.filter(existingEvent => existingEvent.id !== event.id);
            savePlannerToStorage(newEvent.listId, newPlanner);
            return;
        }
    }

    // Update the list with the new event
    const existingIndex = newPlanner.events.findIndex(existingEvent => existingEvent.id === event.id);
    if (existingIndex !== -1) {
        const existingEventCalendarId = newPlanner.events[existingIndex]!.calendarId;
        if (existingEventCalendarId && !newEvent.calendarId) {
            // Handle deletion of calendar events
            await getCalendarAccess();
            await RNCalendarEvents.removeEvent(existingEventCalendarId);
        }
        newPlanner.events.splice(existingIndex, 1, newEvent);
    } else {
        newPlanner.events.push(newEvent);
    }

    // TODO: why no delete time

    // Save the new planner
    savePlannerToStorage(newEvent.listId, newPlanner);

    return newEvent.calendarId;
};

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
        return yesterdayPlanner
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