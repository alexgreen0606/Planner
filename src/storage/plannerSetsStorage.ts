import { EStorageId } from "@/lib/enums/EStorageId";
import { TPlannerSet } from "@/lib/types/planner/TPlannerSet";
import { MMKV } from "react-native-mmkv";

// ✅ 

const storage = new MMKV({ id: EStorageId.PLANNER_SETS });

// ===================
// 1. Upsert Function
// ===================

export function upsertPlannerSet(newSet: TPlannerSet) {
    storage.set(newSet.title, JSON.stringify(newSet));
}

// ==================
// 2. Read Functions
// ==================

export function getPlannerSetByTitle(title: string): TPlannerSet {
    const eventsString = storage.getString(title);

    if (eventsString) {
        return JSON.parse(eventsString);
    }

    throw new Error(`getPlannerSetByTitle: Planner Set not found for title ${title}`);
}

export function getAllPlannerSetTitles(): string[] {
    return storage.getAllKeys();
}

// ===================
// 3. Delete Function
// ===================

export function deletePlannerSet(deleteSet: TPlannerSet) {
    storage.delete(deleteSet.title);
}