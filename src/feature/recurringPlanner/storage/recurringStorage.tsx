import { MMKV } from "react-native-mmkv";
import { PLANNER_STORAGE_ID, RecurringEvent, Weekdays } from "../../../foundation/calendarEvents/types";
import { RecurringPlannerKeys } from "../constants";
import { generateSortIdByTime } from "../../../foundation/calendarEvents/timestampUtils";

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * Fetches the recurring planner with the given ID from storage.
 */
function getPlannerFromStorage(plannerId: string): RecurringEvent[] {
    const eventsString = storage.getString(plannerId);
    if (eventsString)
        return JSON.parse(eventsString);
    return [];
};

/**
 * Saves a recurring planner to storage.
 */
export function savePlannerToStorage(plannerId: string, newPlanner: RecurringEvent[]) {
    storage.set(plannerId, JSON.stringify(newPlanner));
};

export function generateRecurringWeekdayPlanner(): RecurringEvent[] {
    const mondayPlanner = getPlannerFromStorage(RecurringPlannerKeys.MONDAY);
    return mondayPlanner.filter(event => event.isWeekdayEvent);
}

export function saveRecurringWeekdayEvent(event: RecurringEvent) {
    Object.values(Weekdays).forEach((day) => {
        const updatedEvent = { ...event };
        const planner = getPlannerFromStorage(day);
        const updatedPlanner = [...planner];
        const itemCurrentIndex = planner.findIndex(planEvent => planEvent.id === updatedEvent.id);
        if (itemCurrentIndex !== -1) {
            updatedPlanner[itemCurrentIndex] = updatedEvent;
        } else {
            updatedPlanner.push(updatedEvent);
        }
        updatedEvent.sortId = generateSortIdByTime(updatedEvent, planner);
        savePlannerToStorage(day, updatedPlanner);
    });
}

export function deleteRecurringWeekdayEvent(eventsToDelete: RecurringEvent[]) {
    Object.values(Weekdays).forEach((day) => {
        const planner = getPlannerFromStorage(day);
        savePlannerToStorage(
            day,
            // Filter out any planner events within the list of events to delete
            planner.filter(
                planEvent => !eventsToDelete.some(delEvent => delEvent.id === planEvent.id)
            )
        );
    });
}