import { MMKV } from "react-native-mmkv";
import { PLANNER_SETS_KEY, PLANNER_SETS_STORAGE_ID, PlannerSet } from "../types";

const storage = new MMKV({ id: PLANNER_SETS_STORAGE_ID });

export function getPlannerSets(): PlannerSet[] {
    const eventsString = storage.getString(PLANNER_SETS_KEY);
    if (eventsString)
        return JSON.parse(eventsString);
    return [];
};

export function savePlannerSet(newSet: PlannerSet) {
    const plannerSets = getPlannerSets();
    const existingIndex = plannerSets.findIndex(set => set.id === newSet.id);
    if (existingIndex !== -1) {
        plannerSets.splice(existingIndex, 1, newSet);
    } else {
        plannerSets.push(newSet);
    }
    storage.set(PLANNER_SETS_KEY, JSON.stringify(plannerSets));
};

export function deletePlannerSet(deleteSet: PlannerSet) {
    const plannerSets = getPlannerSets();
    const existingIndex = plannerSets.findIndex(set => set.id === deleteSet.id);
    if (existingIndex !== -1) {
        plannerSets.splice(existingIndex, 1);
    }
    storage.set(PLANNER_SETS_KEY, JSON.stringify(plannerSets));
};