import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { getYesterdayDatestamp, isTimeEarlierOrEqual } from "@/utils/dateUtils";
import { createEmptyPlanner } from "@/utils/plannerUtils";
import { MMKV } from 'react-native-mmkv';

//

const plannerStorage = new MMKV({ id: EStorageId.PLANNER });
const eventStorage = new MMKV({ id: EStorageId.PLANNER_EVENT });

export function savePlannerToStorage(planner: TPlanner) {
    plannerStorage.set(planner.datestamp, JSON.stringify(planner));
}

export function savePlannerEventToStorage(event: IPlannerEvent) {
    eventStorage.set(event.id, JSON.stringify(event));
}

// ==================
// 2. Read Functions
// ==================

export function getPlannerFromStorageByDatestamp(datestamp: string): TPlanner {
    const eventsString = plannerStorage.getString(datestamp);
    if (!eventsString) {
        return createEmptyPlanner(datestamp);
    }

    return JSON.parse(eventsString);
}

export function getPlannerEventFromStorageById(id: string): IPlannerEvent {
    const eventsString = eventStorage.getString(id);
    if (!eventsString) {
        throw new Error(`getPlannerEventFromStorageById: No event found in storage with ID ${id}`);
    }

    return JSON.parse(eventsString);
}

export function getAllPlannerDatestampsFromStorage(): string[] {
    return plannerStorage.getAllKeys();
}

// ====================
// 3. Delete Functions
// ====================

export async function deletePlannerFromStorageByDatestamp(datestamp: string) {
    eventStorage.delete(datestamp);
}

export async function deletePlannerEventFromStorageById(eventId: string) {
    eventStorage.delete(eventId);
}

