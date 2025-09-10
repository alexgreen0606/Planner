import { atom } from "jotai";
import { plannerSetKeyAtom } from "./plannerSetKey";
import { getDatestampRange, getNextEightDayDatestamps } from "@/utils/dateUtils";
import { todayDatestampAtom } from "./todayDatestamp";
import { getPlannerSetByTitle } from "@/storage/plannerSetsStorage";

// // ✅ 

export const mountedDatestampsAtom = atom((get) => {
    const plannerSetKey = get(plannerSetKeyAtom);
    const todayDatestamp = get(todayDatestampAtom);

    let planner: string[] = [];

    if (plannerSetKey === 'Next 7 Days') {
        planner = getNextEightDayDatestamps().slice(1);
    } else {
        const plannerSet = getPlannerSetByTitle(plannerSetKey);
        if (plannerSet) {
            planner = getDatestampRange(plannerSet.startDatestamp, plannerSet.endDatestamp);
        }
    }

    return {
        today: todayDatestamp,
        planner,
        all: Array.from(new Set([todayDatestamp, ...planner])),
    };
});