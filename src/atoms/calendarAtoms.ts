import * as Calendar from 'expo-calendar';
import { atom } from "jotai";

export const calendarMapAtom = atom<Record<string, Calendar.Calendar>>({});
export const upcomingDatesMapAtom = atom<Record<string, Calendar.Event[]>>({});

export const activeCalendarFiltersAtom = atom<Set<string>>(new Set<string>());

export const primaryCalendarAtom = atom<Calendar.Calendar | null>(null);
export const importantCalendarAtom = atom<Calendar.Calendar | null>(null);

// Stores the dates to be rendered in the Upcoming Dates page.
export const filteredUpcomingDateEntriesAtom = atom((get) => {
    const activeCalendarFilters = get(activeCalendarFiltersAtom);
    const upcomingDatesMap = get(upcomingDatesMapAtom);

    // If no filters are active, return all entries
    if (activeCalendarFilters.size === 0) {
        return Object.entries(upcomingDatesMap);
    }

    const result: Array<[string, Calendar.Event[]]> = [];

    for (const [dateKey, events] of Object.entries(upcomingDatesMap)) {
        const filteredEvents = events.filter(e => activeCalendarFilters.has(e.calendarId));

        if (filteredEvents.length > 0) {
            result.push([dateKey, filteredEvents]);
        }
    }

    return result;
});

// Toggles calendar IDs in and out of the calendar filters atom.
export const toggleCalendarFilterAtom = atom(
    null,
    (get, set, calendarId: string) => {
        const current = get(activeCalendarFiltersAtom);
        const calendarMap = get(calendarMapAtom);

        const newSet = new Set(current);

        if (newSet.has(calendarId)) {
            newSet.delete(calendarId);
        } else {
            newSet.add(calendarId);
        }

        const availableCalendarIds = Object.keys(calendarMap);
        const allSelected = newSet.size === availableCalendarIds.length;

        if (allSelected) {
            set(activeCalendarFiltersAtom, new Set());
            return;
        }

        set(activeCalendarFiltersAtom, newSet);
    }
);
