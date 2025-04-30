import { MMKV } from "react-native-mmkv";
import { PLANNER_SETS_STORAGE_ID, PlannerSet } from "../plannerCard/types";

const storage = new MMKV({ id: PLANNER_SETS_STORAGE_ID });

export function getPlannerSet(key: string): PlannerSet | null {
    const eventsString = storage.getString(key);
    if (eventsString)
        return JSON.parse(eventsString);
    return null;
};

export function getPlannerSetTitles(): string[] {
    return storage.getAllKeys();
};

export function savePlannerSet(newSet: PlannerSet) {
    storage.set(newSet.title, JSON.stringify(newSet));
};

export function deletePlannerSet(deleteSet: PlannerSet) {
    storage.delete(deleteSet.title);
};