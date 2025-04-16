import { MMKV } from 'react-native-mmkv';
import RNCalendarEvents from "react-native-calendar-events";
import { isItemTextfield } from '../../sortedLists/utils';
import {
    generateSortIdByTime,
    getTodayDatestamp,
    getTomorrowDatestamp,
    getYesterdayDatestamp,
    isTimestampValid,
    datestampToDayOfWeek,
} from '../timestampUtils';
import { getCalendarAccess, syncPlannerWithCalendar, syncPlannerWithRecurring } from '../calendarUtils';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../types';
import { ItemStatus } from '../../sortedLists/constants';

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * Fetches the planner with the given ID from storage.
 */
export function getPlannerFromStorage(plannerId: string): PlannerEvent[] {
    const eventsString = storage.getString(plannerId);
    if (eventsString)
        return JSON.parse(eventsString);
    return [];
};

/**
 * Saves a planner to storage.
 */
export function savePlannerToStorage(plannerId: string, newPlanner: PlannerEvent[]) {
    storage.set(plannerId, JSON.stringify(newPlanner));
};

/**
 * Deletes all the planners from before today's date, and returns the planner from yesterday.
 * @returns - all the remaining events from yesterday
 */
function getCarryoverEventsAndCleanStorage(): PlannerEvent[] {
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
            .filter((event: PlannerEvent) => {
                event.status !== ItemStatus.HIDDEN && !event.recurringId
            })
            // Remove any time configs 
            .map((event: PlannerEvent) => {
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
export async function buildPlanner(datestamp: string, planner: PlannerEvent[], calendarEvents: PlannerEvent[]): Promise<PlannerEvent[]> {

    // Sync the planner with the recurring weekday planner
    if ([getTodayDatestamp(), getTomorrowDatestamp()].includes(datestamp)) {
        const recurringPlanner = getPlannerFromStorage(datestampToDayOfWeek(datestamp));
        planner = syncPlannerWithRecurring(recurringPlanner, planner, datestamp);
    }

    // Sync the planner with the apple calendar
    planner = syncPlannerWithCalendar(calendarEvents, planner, datestamp);

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
                planner.push(newEvent);
                newEvent.sortId = generateSortIdByTime(newEvent, planner);
            });
            savePlannerToStorage(datestamp, planner);
        }
    }

    return planner;
};

/**
 * Creates or updates an event. Updates it in the device calendar if needed.
 * @returns - true if the item was persisted, else false
 */
export async function saveEvent(event: PlannerEvent) {
    let newPlanner = getPlannerFromStorage(event.listId);
    let newEvent = { ...event, status: isItemTextfield(event) ? ItemStatus.STATIC : event.status };

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
            const plannerWithoutEvent = newPlanner.filter(existingEvent => existingEvent.id !== event.id);
            savePlannerToStorage(newEvent.listId, plannerWithoutEvent);
        }
    }

    // Update the list with the new event
    const existingIndex = newPlanner.findIndex(existingEvent => existingEvent.id === event.id);
    if (existingIndex !== -1) {
        const existingEventCalendarId = newPlanner[existingIndex]!.calendarId;
        if (existingEventCalendarId && !newEvent.calendarId) {
            // Handle deletion of calendar events
            await getCalendarAccess();
            await RNCalendarEvents.removeEvent(existingEventCalendarId);
        }
        newPlanner.splice(existingIndex, 1, newEvent);
    } else {
        newPlanner.push(newEvent);
    }

    // TODO: why no delete time

    console.log(newPlanner, 'saving planner')

    // Save the new planner
    savePlannerToStorage(newEvent.listId, newPlanner);

    return newEvent.calendarId;
};

/**
 * 
 * @param eventsToDelete 
 */
export async function deleteEvents(eventsToDelete: PlannerEvent[]) {
    const eventsByList: Record<string, PlannerEvent[]> = {};

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
    await Promise.all(Object.entries(eventsByList).map(async ([listId, listEvents]) => {
        let newPlanner = await getPlannerFromStorage(listId);
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

        newPlanner = newPlanner
            .map(event => (recurringOrTodayCalendarIds.has(event.id) ? { ...event, status: ItemStatus.HIDDEN } : event))
            .filter(event => !regularDeleteIds.has(event.id));

        await savePlannerToStorage(listId, newPlanner);
    }));
}
