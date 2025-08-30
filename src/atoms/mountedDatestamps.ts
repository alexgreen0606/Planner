import { getTodayDatestamp } from '@/utils/dateUtils';
import { atom } from 'jotai';

// ✅ 

type MountedDatestamps = {
    today: string;
    planner: string[];
    all: string[];
};

const todayDatestamp = getTodayDatestamp();

export const mountedDatestampsAtom = atom<MountedDatestamps>({
    today: todayDatestamp,
    planner: [],
    all: [todayDatestamp]
});