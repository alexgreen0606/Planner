import { PLANNER_SETS_STORAGE_ID } from "@/lib/constants/storage";
import { TPlannerSet } from "@/types/planner/TPlannerSet";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: PLANNER_SETS_STORAGE_ID });

export function getPlannerSet(key: string): TPlannerSet | null {
    const eventsString = storage.getString(key);
    if (eventsString)
        return JSON.parse(eventsString);
    return null;
};

export function getPlannerSetTitles(): string[] {
    return storage.getAllKeys();
};

export function savePlannerSet(newSet: TPlannerSet) {
    storage.set(newSet.title, JSON.stringify(newSet));
};

export function deletePlannerSet(deleteSet: TPlannerSet) {
    storage.delete(deleteSet.title);
};