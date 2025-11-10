import { atom } from 'jotai';

import { TDateRange } from '@/lib/types/listItems/IPlannerEvent';
import { datestampToMidnightJsDate, isTimeEarlier, isTimeEarlierOrEqual } from '@/utils/dateUtils';

// Stores all datestamps that have been loaded from the Calendar.
export const loadedDatestampsAtom = atom<Set<string>>(new Set<string>());

// Adds a datestamp to loadedDatestampsAtom.
export const trackLoadedDatestampAtom = atom(null, (get, set, newDatestamp: string) => {
  const current = new Set(get(loadedDatestampsAtom));
  current.add(newDatestamp);
  set(loadedDatestampsAtom, current);
});

// Clears any loaded datestamps that fall within the given ranges.
export const untrackLoadedDatestampsAtom = atom(null, (get, set, ranges: TDateRange[]) => {
  const current = new Set(get(loadedDatestampsAtom));

  for (const datestamp of current) {
    const nextDatestampIso = datestampToMidnightJsDate(datestamp, 1).toISOString();

    const isWithinRange = ranges.some(
      (range) =>
        isTimeEarlier(range.startIso, nextDatestampIso) &&
        isTimeEarlierOrEqual(datestamp, range.endIso)
    );

    if (isWithinRange) {
      current.delete(datestamp);
    }
  }

  set(loadedDatestampsAtom, current);
});
