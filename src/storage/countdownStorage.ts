import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { ICountdownEvent } from "@/lib/types/listItems/ICountdownEvent";
import { MMKV } from "react-native-mmkv";

// ✅ 

const countdownPlannerStorage = new MMKV({ id: EStorageId.COUNTDOWN_PLANNER });
const countdownEventStorage = new MMKV({ id: EStorageId.COUNTDOWN_EVENT });

// ==================
// 1. Save Functions
// ==================

export function saveCountdownPlannerToStorage(countdownPlanner: string[]) {
    countdownPlannerStorage.set(EStorageKey.COUNTDOWN_LIST_KEY, JSON.stringify(countdownPlanner));
}

export function saveCountdownEventToStorage(countdownEvent: ICountdownEvent) {
    countdownEventStorage.set(countdownEvent.id, JSON.stringify(countdownEvent));
}

// ==================
// 2. Read Functions
// ==================

export function getCountdownPlannerFromStorage(): string[] {
    const plannerString = countdownPlannerStorage.getString(EStorageKey.COUNTDOWN_LIST_KEY);
    if (plannerString) {
        return JSON.parse(plannerString);
    }

    return [];
}

export function getCountdownEventFromStorageById(id: string): ICountdownEvent {
    const eventString = countdownEventStorage.getString(id);
    if (!eventString) {
        throw new Error(`getCountdownEventFromStorageById: No event found in storage with ID ${id}`);
    }

    return JSON.parse(eventString);
}

// ===================
// 3. Delete Function
// ===================

export function deleteCountdownEventFromStorageById(countdownEventId: string) {
    countdownEventStorage.delete(countdownEventId);
}
