import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { TCalendarData } from '@/types/calendar/TCalendarData';

export const calendarEventDataAtom = atom<TCalendarData>({
    chipsMap: {},
    plannersMap: {}
});

export const calendarChipsByDate = atomFamily((date: string) =>
    atom((get) => get(calendarEventDataAtom).chipsMap[date] ?? [])
);

export const calendarPlannerByDate = atomFamily((date: string) =>
    atom((get) => get(calendarEventDataAtom).plannersMap[date] ?? [])
);
