import { atom } from "jotai";
import * as Calendar from 'expo-calendar';

// Main atom for active calendar filters
export const activeCalendarFiltersAtom = atom<Set<string>>(new Set<string>());

export const calendarMapAtom = atom<Record<string, Calendar.Calendar>>({});

export const primaryCalendarAtom = atom<Calendar.Calendar | null>(null);
export const importantCalendarAtom = atom<Calendar.Calendar | null>(null);

// Setter atom for toggling calendar filters
export const toggleCalendarFilterAtom = atom(
    null,
    (get, set, calendarId: string) => {
        const current = get(activeCalendarFiltersAtom);

        // If currently ALL, switch to just this calendar
        if (current.size === 0) {
            set(activeCalendarFiltersAtom, new Set([calendarId]));
            return;
        }

        // Current is a Set
        const newSet = new Set(current);

        // If this is the ONLY active filter, set to ALL
        if (newSet.size === 1 && newSet.has(calendarId)) {
            set(activeCalendarFiltersAtom, new Set<string>());
            return;
        }

        // Otherwise toggle it on or off
        if (newSet.has(calendarId)) {
            newSet.delete(calendarId);
        } else {
            newSet.add(calendarId);
        }

        set(activeCalendarFiltersAtom, newSet);
    }
);