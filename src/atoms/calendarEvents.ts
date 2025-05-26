import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { TCalendarData } from '@/types/calendar/TCalendarData';

export const calendarEventData = atom<TCalendarData>({
    chipsMap: {},
    plannersMap: {}
});

export const calendarChipsByDate = atomFamily((date: string) =>
    atom((get) => get(calendarEventData).chipsMap[date] ?? [])
);

export const calendarPlannerByDate = atomFamily((date: string) =>
    atom((get) => get(calendarEventData).plannersMap[date] ?? [])
);
