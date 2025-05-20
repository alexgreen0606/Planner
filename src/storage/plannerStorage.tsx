import { PLANNER_STORAGE_ID } from "@/constants/storageIds";
import { EItemStatus } from "@/enums/EItemStatus";
import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import { TPlanner } from "@/types/planner/TPlanner";
import { generatePlanner, getCalendarAccess, syncPlannerWithCalendar, syncPlannerWithRecurring } from "@/utils/calendarUtils";
import { datestampToDayOfWeek, getTodayDatestamp, getYesterdayDatestamp, isTimestampValid } from "@/utils/dateUtils";
import { generateSortId, isItemTextfield } from "@/utils/listUtils";
import RNCalendarEvents from "react-native-calendar-events";
import { MMKV } from 'react-native-mmkv';
import { getRecurringPlannerFromStorage } from "./recurringEventStorage";

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
 * Deletes all the planners from before today's date, and returns the planner from yesterday.
 * @returns - all the remaining events from yesterday
 */
function getCarryoverEventsAndCleanStorage(): IPlannerEvent[] {
    const yesterdayTimestamp = getYesterdayDatestamp();
    const todayTimestamp = getTodayDatestamp();
    const yesterdayPlannerString = storage.getString(yesterdayTimestamp);
    if (yesterdayPlannerString) {
        const yesterdayPlanner = JSON.parse(yesterdayPlannerString);

        // TODO: delete past birthdays

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

/**
 * Builds a planner for the given ID out of the storage, calendar, and recurring weekday planner.
 */
export async function buildPlannerEvents(
    datestamp: string,
    storagePlanner: TPlanner,
    calendarEvents: IPlannerEvent[]
): Promise<IPlannerEvent[]> {

    const planner = { ...storagePlanner };

    // Phase 1: Sync in any recurring events for the day of the week.
    const recurringPlanner = getRecurringPlannerFromStorage(datestampToDayOfWeek(datestamp));
    planner.events = syncPlannerWithRecurring(recurringPlanner, planner.events, datestamp);

    // Phase 2: Sync in any recurring events for the day of the week.
    planner.events = syncPlannerWithCalendar(calendarEvents, planner.events, datestamp);

    // Delete past planners and carry over incomplete yesterday events
    if (datestamp === getTodayDatestamp()) {
        const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
        if (remainingYesterdayEvents.length > 0) {

            // Carry over yesterday's incomplete events to today
            remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
                const newEvent = {
                    ...yesterdayEvent,
                    listId: datestamp,
                    sortId: -1,
                };
                planner.events.push(newEvent);
                newEvent.sortId = generateSortId(-1, planner.events);
            });
        }
    }

    // Phase 4: TODO comment
    if (planner.events.some(planEvent =>
        !storagePlanner.events.some(existingEvent => existingEvent.id === planEvent.id)
    )) savePlannerToStorage(datestamp, planner);

    return planner.events;
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
