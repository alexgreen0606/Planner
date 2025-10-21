import * as Calendar from 'expo-calendar';
import { atom } from "jotai";

export const calendarMapAtom = atom<Record<string, Calendar.Calendar>>({});
export const upcomingDatesMapAtom = atom<Record<string, Calendar.Event[]>>({});

export const activeCalendarFiltersAtom = atom<Set<string>>(new Set<string>());

export const primaryCalendarAtom = atom<Calendar.Calendar | null>(null);
export const importantCalendarAtom = atom<Calendar.Calendar | null>(null);

// Stores the dates to be rendered in the Upcoming Dates page.
export const filteredUpcomingDatesMapAtom = atom((get) => {
    const activeCalendarFilters = get(activeCalendarFiltersAtom);
    const upcomingDatesMap = get(upcomingDatesMapAtom);

    // If no filters are active, show all events.
    if (activeCalendarFilters.size === 0) {
        return upcomingDatesMap;
    }

    const filteredMap: Record<string, Calendar.Event[]> = {};
    Object.entries(upcomingDatesMap).forEach(([dateKey, events]) => {
        const filteredEvents = events.filter(event =>
            activeCalendarFilters.has(event.calendarId)
        );

        if (filteredEvents.length > 0) {
            filteredMap[dateKey] = filteredEvents;
        }
    });

    return filteredMap;
});

// Toggles calendar IDs in and out of the calendar filters atom.
export const toggleCalendarFilterAtom = atom(
    null,
    (get, set, calendarId: string) => {
        const current = get(activeCalendarFiltersAtom);

        const newSet = new Set(current);
        if (newSet.has(calendarId)) {
            newSet.delete(calendarId);
        } else {
            newSet.add(calendarId);
        }

        set(activeCalendarFiltersAtom, newSet);
    }
);