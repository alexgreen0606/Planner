import { MMKV } from 'react-native-mmkv';
import RNCalendarEvents from "react-native-calendar-events";
import { isItemTextfield, ItemStatus } from '../../sortedLists/sortedListUtils';
import {
    generateSortIdByTime,
    getTodayGenericTimestamp,
    getTomorrowGenericTimestamp,
    getYesterdayGenericTimestamp,
    isTimestampValid,
    isTimestampWeekday,
} from '../dateUtils';
import { getCalendarEvents, getPrimaryCalendarDetails, PLANNER_STORAGE_ID, PlannerEvent, RECURRING_WEEKDAY_PLANNER_KEY, syncPlannerWithCalendar, syncPlannerWithRecurring } from '../calendarUtils';

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * Fetches the planner with the given ID from storage.
 */
function getPlannerFromStorage(plannerId: string): PlannerEvent[] {
    const eventsString = storage.getString(plannerId);
    if (eventsString)
        return JSON.parse(eventsString);
    return [];
};

/**
 * Saves a planner to storage.
 */
function savePlannerToStorage(plannerId: string, newPlanner: PlannerEvent[]) {
    storage.set(plannerId, JSON.stringify(newPlanner));
};

/**
 * Deletes all the planners from before today's date, and returns the planner from yesterday.
 * @returns - all the remaining events from yesterday
 */
function getAndDeletePastPlanners(): PlannerEvent[] {
    const yesterdayTimestamp = getYesterdayGenericTimestamp();
    const todayTimestamp = getTodayGenericTimestamp();
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
export async function buildPlanner(timestamp: string, planner: PlannerEvent[]): Promise<PlannerEvent[]> {

    // Keep the storage clean by deleting any past planners
    if (timestamp === getTodayGenericTimestamp()) {
        const remainingYesterdayEvents = getAndDeletePastPlanners();
        if (remainingYesterdayEvents.length > 0) {

            // Carry over yesterday's incomplete events to today
            remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
                if (!yesterdayEvent.recurringId) { // TODO: should I keep these? don't persist recurring events
                    const newEvent = {
                        ...yesterdayEvent,
                        listId: timestamp,
                        sortId: -1,
                    };
                    if (yesterdayEvent.timeConfig) {
                        const newStartTime = new Date(yesterdayEvent.timeConfig.startTime);
                        const newEndTime = new Date(yesterdayEvent.timeConfig.endTime);

                        // Add one day (24 hours) to both startTime and endTime
                        newStartTime.setDate(newStartTime.getDate() + 1);
                        newEndTime.setDate(newEndTime.getDate() + 1);

                        newEvent.timeConfig = {
                            ...yesterdayEvent.timeConfig,
                            startTime: newStartTime.toISOString(),
                            endTime: newEndTime.toISOString()
                        };
                    }
                    planner.push(newEvent);
                    newEvent.sortId = generateSortIdByTime(newEvent, planner);
                }
            });
            savePlannerToStorage(timestamp, planner);
            return planner;
        }
    }

    // Sync the planner with the recurring weekday planner
    if (isTimestampWeekday(timestamp) && [getTodayGenericTimestamp(), getTomorrowGenericTimestamp()].includes(timestamp)) {
        const recurringPlanner = getPlannerFromStorage(RECURRING_WEEKDAY_PLANNER_KEY);
        planner = syncPlannerWithRecurring(recurringPlanner, planner, timestamp);
    }

    // Sync the planner with the apple calendar
    const allCelendarEvents = await getCalendarEvents(timestamp);
    const calendarListEvents = allCelendarEvents.filter(calEvent =>
        !calEvent.timeConfig?.allDay
    );
    planner = syncPlannerWithCalendar(calendarListEvents, planner, timestamp);

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
    if (newEvent.timeConfig?.isCalendarEvent) {
        newEvent.calendarId = await RNCalendarEvents.saveEvent(
            newEvent.value,
            {
                calendarId: (await getPrimaryCalendarDetails()).id,
                startDate: newEvent.timeConfig.startTime,
                endDate: newEvent.timeConfig.endTime,
                allDay: newEvent.timeConfig.allDay,
                id: newEvent.calendarId
            }
        );

        // Remove the event if it is an all-day event
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
 * Deletes an event. Removes it from the device calendar if needed.
 */
export async function deleteEvent(eventToDelete: PlannerEvent) {
    let newPlanner = getPlannerFromStorage(eventToDelete.listId);

    // The event is an apple event in the future -> remove from the calendar
    if (
        eventToDelete.calendarId &&
        eventToDelete.listId !== getTodayGenericTimestamp()
    ) {
        await getPrimaryCalendarDetails();
        await RNCalendarEvents.removeEvent(eventToDelete.calendarId);
    }

    // The event is a *recurring event* or *calendar event from today* -> mark it deleted
    if (eventToDelete.recurringId ||
        (eventToDelete.timeConfig?.isCalendarEvent && eventToDelete.listId === getTodayGenericTimestamp())
    ) {
        const eventIndex = newPlanner.findIndex(event => event.id === eventToDelete.id);
        if (eventIndex !== -1) {
            newPlanner[eventIndex].status = ItemStatus.HIDDEN;
            savePlannerToStorage(eventToDelete.listId, newPlanner);
            return;
        }
    }

    // Delete the event from storage
    const eventIndex = newPlanner.findIndex(existingEvent => existingEvent.id === eventToDelete.id);
    if (eventIndex !== -1)
        newPlanner.splice(eventIndex, 1);

    savePlannerToStorage(eventToDelete.listId, newPlanner);
};