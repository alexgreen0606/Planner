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
function getAndDeletePastPlanners(): PlannerEvent[] {
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
        return yesterdayPlanner;
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
        const remainingYesterdayEvents = getAndDeletePastPlanners();
        if (remainingYesterdayEvents.length > 0) {

            // Carry over yesterday's incomplete events to today
            remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
                if (!yesterdayEvent.recurringId) {
                    const newEvent = {
                        ...yesterdayEvent,
                        listId: datestamp,
                        sortId: -1,
                    };
                    if (yesterdayEvent.timeConfig) {
                        // TODO: TEST
                        const yesterdayStartTime = new Date(yesterdayEvent.timeConfig.startTime);
                        const yesterdayEndTime = new Date(yesterdayEvent.timeConfig.endTime);
                        yesterdayStartTime.setUTCHours(yesterdayStartTime.getUTCHours() + 24);
                        yesterdayEndTime.setUTCHours(yesterdayEndTime.getUTCHours() + 24);

                        newEvent.timeConfig = {
                            ...yesterdayEvent.timeConfig,
                            startTime: yesterdayStartTime.toISOString(),
                            endTime: yesterdayEndTime.toISOString(),
                        };
                    }
                    planner.push(newEvent);
                    newEvent.sortId = generateSortIdByTime(newEvent, planner);
                }
            });
            savePlannerToStorage(datestamp, planner);
            return planner;
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
    const existingIndex = newPlanner.findIndex(existingEvent => existingEvent.id === event.id)
    if (existingIndex !== -1)
        newPlanner.splice(existingIndex, 1, newEvent);
    else
        newPlanner.push(newEvent);

    // Save the new planner
    savePlannerToStorage(newEvent.listId, newPlanner);
};

/**
 * 
 * @param eventsToDelete 
 */
export async function deleteEvents(eventsToDelete: PlannerEvent[]) {
    // Group events by listId for efficient updates
    const eventsByList: Record<string, PlannerEvent[]> = {};

    // First pass - group events and handle calendar removals
    for (const eventToDelete of eventsToDelete) {
        // Initialize the list if it doesn't exist
        if (!eventsByList[eventToDelete.listId]) {
            eventsByList[eventToDelete.listId] = [];
        }

        eventsByList[eventToDelete.listId].push(eventToDelete);

        // The event is an apple event in the future -> remove from the calendar
        if (
            eventToDelete.calendarId &&
            eventToDelete.listId !== getTodayDatestamp()
        ) {
            await getCalendarAccess();
            await RNCalendarEvents.removeEvent(eventToDelete.calendarId);
        }
    }

    // Second pass - process each list only once
    for (const listId in eventsByList) {
        let newPlanner = getPlannerFromStorage(listId);
        const listEvents = eventsByList[listId];
        const todayDatestamp = getTodayDatestamp();

        // Create lookup sets for efficient operations
        const recurringOrTodayCalendarIds = new Set<string>();
        const regularDeleteIds = new Set<string>();

        // Sort events into appropriate categories
        for (const event of listEvents) {
            if (event.recurringId ||
                (event.calendarId && event.listId === todayDatestamp)) {
                recurringOrTodayCalendarIds.add(event.id);
            } else {
                regularDeleteIds.add(event.id);
            }
        }

        // Update the planner with all changes at once
        newPlanner = newPlanner.map(event => {
            if (recurringOrTodayCalendarIds.has(event.id)) {
                return { ...event, status: ItemStatus.HIDDEN };
            }
            return event;
        }).filter(event => !regularDeleteIds.has(event.id));

        // Save updated planner to storage
        savePlannerToStorage(listId, newPlanner);
    }
}