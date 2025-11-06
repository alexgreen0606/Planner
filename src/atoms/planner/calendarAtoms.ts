import * as Calendar from 'expo-calendar';
import { atom } from 'jotai';

export const primaryCalendarAtom = atom<Calendar.Calendar | null>(null);

// Maps Calendar IDs to Calendars.
export const calendarMapAtom = atom<Record<string, Calendar.Calendar>>({});

// Datestamps to events map.
export const upcomingDatesMapAtom = atom<Record<string, Calendar.Event[]>>({});
export const filteredUpcomingDateEntriesAtom = atom((get) => {
  const activeCalendarFilters = get(activeCalendarFiltersAtom);
  const upcomingDatesMap = get(upcomingDatesMapAtom);

  if (activeCalendarFilters.size === 0) {
    return Object.entries(upcomingDatesMap);
  }

  const result: Array<[string, Calendar.Event[]]> = [];
  for (const [dateKey, events] of Object.entries(upcomingDatesMap)) {
    const filteredEvents = events.filter((e) => activeCalendarFilters.has(e.calendarId));
    if (filteredEvents.length > 0) {
      result.push([dateKey, filteredEvents]);
    }
  }

  return result;
});

// Calendars to display in the Upcoming Dates page.
// An empty set will display all calendars.
export const activeCalendarFiltersAtom = atom<Set<string>>(new Set<string>());
export const toggleCalendarFilterAtom = atom(null, (get, set, calendarId: string) => {
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
    // Reset the filters if the user manually selects each one.
    set(activeCalendarFiltersAtom, new Set());
    return;
  }

  set(activeCalendarFiltersAtom, newSet);
});
