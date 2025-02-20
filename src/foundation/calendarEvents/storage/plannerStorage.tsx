import { MMKV } from 'react-native-mmkv';
import RNCalendarEvents from "react-native-calendar-events";
import { isItemTextfield } from '../../sortedLists/sortedListUtils';
import {
    generateSortIdByTime,
    getTodayDatestamp,
    getTomorrowDatestamp,
    getYesterdayDatestamp,
    isTimestampValid,
    datestampToDayOfWeek,
} from '../timestampUtils';
import { getCalendarEvents, getPrimaryCalendarDetails, syncPlannerWithCalendar, syncPlannerWithRecurring } from '../calendarUtils';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../types';
import { ItemStatus } from '../../sortedLists/types';

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
export async function buildPlanner(datestamp: string, planner: PlannerEvent[]): Promise<PlannerEvent[]> {

    // Sync the planner with the recurring weekday planner
    if ([getTodayDatestamp(), getTomorrowDatestamp()].includes(datestamp)) {
        const recurringPlanner = getPlannerFromStorage(datestampToDayOfWeek(datestamp));
        planner = syncPlannerWithRecurring(recurringPlanner, planner, datestamp);
    }

    // Sync the planner with the apple calendar
    const allCelendarEvents = await getCalendarEvents(datestamp);
    planner = syncPlannerWithCalendar(allCelendarEvents, planner, datestamp);

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
        newEvent.calendarId = await RNCalendarEvents.saveEvent(
            newEvent.value,
            {
                calendarId: (await getPrimaryCalendarDetails()).id,
                startDate: newEvent.timeConfig.startTime,
                endDate: newEvent.timeConfig.endTime,
                allDay: newEvent.timeConfig.allDay,
                id: newEvent.calendarId === 'NEW' ? undefined : newEvent.calendarId
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
        eventToDelete.listId !== getTodayDatestamp()
    ) {
        await getPrimaryCalendarDetails();
        await RNCalendarEvents.removeEvent(eventToDelete.calendarId);
    }

    // The event is a *recurring event* or *calendar event from today* -> mark it deleted
    if (eventToDelete.recurringId ||
        (eventToDelete.calendarId && eventToDelete.listId === getTodayDatestamp())
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