import { generateSortIdByTime } from "@/utils/dateUtils";
import { MMKV } from "react-native-mmkv";
import { IRecurringEvent } from "@/types/listItems/IRecurringEvent";
import { PLANNER_STORAGE_ID } from "@/constants/storageIds";
import { ERecurringPlannerKeys } from "@/enums/ERecurringPlannerKeys";
import { EWeekdays } from "@/enums/EWeekdays";
import { sanitizeList } from "@/utils/listUtils";

const storage = new MMKV({ id: PLANNER_STORAGE_ID });

/**
 * Fetches the recurring planner with the given ID from storage.
 */
export function getRecurringPlannerFromStorage(datestamp: string): IRecurringEvent[] {
    const eventsString = storage.getString(datestamp);
    if (eventsString)
        return JSON.parse(eventsString);
    return [];
};

/**
 * Saves a recurring planner to storage.
 */
export function savePlannerToStorage(plannerId: string, newPlanner: IRecurringEvent[]) {
    storage.set(plannerId, JSON.stringify(newPlanner));
};

export function generateRecurringWeekdayPlanner(): IRecurringEvent[] {
    const mondayPlanner = getRecurringPlannerFromStorage(ERecurringPlannerKeys.MONDAY);
    return mondayPlanner.filter(event => event.isWeekdayEvent);
}

export function saveRecurringWeekdayEvent(event: IRecurringEvent) {
    Object.values(EWeekdays).forEach((day) => {
        const updatedEvent = { ...event };
        const planner = getRecurringPlannerFromStorage(day);
        const updatedPlanner = sanitizeList(planner, updatedEvent);
        updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
        savePlannerToStorage(day, updatedPlanner);
    });
}

export function deleteRecurringWeekdayEvent(eventsToDelete: IRecurringEvent[]) {
    Object.values(EWeekdays).forEach((day) => {
        const planner = getRecurringPlannerFromStorage(day);
        savePlannerToStorage(
            day,
            // Filter out any planner events within the list of events to delete
            planner.filter(
                planEvent => !eventsToDelete.some(delEvent => delEvent.id === planEvent.id)
            )
        );
    });
}