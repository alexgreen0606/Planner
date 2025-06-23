import { TCalendarData } from '@/lib/types/calendar/TCalendarData';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export const calendarEventDataAtom = atom<TCalendarData>({
    chipsMap: {},
    plannersMap: {}
});

export const calendarChipsByDate = atomFamily((date: string) =>
    atom((get) => get(calendarEventDataAtom).chipsMap[date] ?? null)
);

export const calendarPlannerByDate = atomFamily((date: string) =>
    atom((get) => get(calendarEventDataAtom).plannersMap[date] ?? null)
);
