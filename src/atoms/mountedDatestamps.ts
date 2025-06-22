import { getNextEightDayDatestamps } from '@/utils/dateUtils';
import { atom } from 'jotai';

type MountedDatestamps = {
    today: string;
    planner: string[];
    all: string[];
}

const nextEightDatestamps = getNextEightDayDatestamps();

export const mountedDatestampsAtom = atom<MountedDatestamps>({
    today: nextEightDatestamps[0],
    planner: nextEightDatestamps.slice(1),
    all: nextEightDatestamps
});