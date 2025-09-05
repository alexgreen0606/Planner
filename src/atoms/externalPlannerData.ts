import { TCalendarData } from '@/lib/types/calendar/TCalendarData';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// ✅ 

export const externalPlannerDataAtom = atom<TCalendarData>({
    currentWeatherChip: null,
    eventChipsMap: {},
    plannersMap: {}
});

export const calendarChipsByDate = atomFamily((date: string) =>
    atom((get) => get(externalPlannerDataAtom).eventChipsMap[date] ?? null)
);

export const calendarPlannerByDate = atomFamily((date: string) =>
    atom((get) => get(externalPlannerDataAtom).plannersMap[date] ?? null)
);
