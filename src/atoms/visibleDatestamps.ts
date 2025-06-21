import { atom } from 'jotai';
import { plannerSetKeyAtom } from './plannerSetKey';
import { getPlannerSet } from '@/storage/plannerSetsStorage';
import { generateDatestampRange, getNextEightDayDatestamps } from '@/utils/dateUtils';

export const visibleDatestampsAtom = atom((get) => {
    const plannerSetKey = get(plannerSetKeyAtom);

    // Handle the special "Next 7 Days" case
    if (plannerSetKey === 'Next 7 Days') {
        return getNextEightDayDatestamps().slice(0, 7);
    }

    // Handle custom planner sets
    const plannerSet = getPlannerSet(plannerSetKey);
    if (!plannerSet) {
        return [];
    }

    return generateDatestampRange(plannerSet.startDatestamp, plannerSet.endDatestamp);
});
