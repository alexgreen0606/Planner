import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IUpcomingDate } from "@/lib/types/listItems/IUpcomingDate";
import { MMKV } from "react-native-mmkv";

// ✅ 

const upcomingDatePlannerStorage = new MMKV({ id: EStorageId.UPCOMING_DATE_PLANNER });
const upcomingDateEventStorage = new MMKV({ id: EStorageId.UPCOMING_DATE_EVENT });

// ==================
// 1. Save Functions
// ==================

export function saveUpcomingDatePlannerToStorage(upcomingDatePlanner: string[]) {
    upcomingDatePlannerStorage.set(EStorageKey.UPCOMING_DATE_LIST_KEY, JSON.stringify(upcomingDatePlanner));
}

export function saveUpcomingDateEventToStorage(upcomingDateEvent: IUpcomingDate) {
    upcomingDateEventStorage.set(upcomingDateEvent.id, JSON.stringify(upcomingDateEvent));
}

// ==================
// 2. Read Functions
// ==================

export function getUpcomingDatePlannerFromStorage(): string[] {
    const plannerString = upcomingDatePlannerStorage.getString(EStorageKey.UPCOMING_DATE_LIST_KEY);
    if (plannerString) {
        return JSON.parse(plannerString);
    }

    return [];
}

export function getUpcomingDateEventFromStorageById(id: string): IUpcomingDate {
    const eventString = upcomingDateEventStorage.getString(id);
    if (!eventString) {
        throw new Error(`getUpcomingDateEventFromStorageById: No event found in storage with ID ${id}`);
    }

    return JSON.parse(eventString);
}

// ===================
// 3. Delete Function
// ===================

export function deleteUpcomingDateEventFromStorageById(upcomingDateEventId: string) {
    upcomingDateEventStorage.delete(upcomingDateEventId);
}
