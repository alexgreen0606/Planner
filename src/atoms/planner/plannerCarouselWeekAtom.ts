import { atom } from 'jotai';
import { DateTime } from 'luxon';

type TPlannerCarouselData = {
  weeks: string[];
  map: Record<string, string[]>;
};

function initializeCarouselData(): TPlannerCarouselData {
  const today = DateTime.local();
  let start = today.minus({ weeks: 3 });
  start = start.minus({ days: start.weekday % 7 });
  const end = today.plus({ years: 3 });

  const weeks: string[] = [];
  const map: Record<string, string[]> = {};

  let cursor = start;
  while (cursor <= end) {
    const sunday = cursor.toISODate()!;

    const week = Array.from({ length: 7 }, (_, i) => cursor.plus({ days: i }).toISODate()!);

    weeks.push(sunday);
    map[sunday] = week;

    cursor = cursor.plus({ weeks: 1 });
  }

  return { weeks, map };
}

// Returns 2 values:
// An array of Sunday datestamps from 3 weeks ago to 3 years in the future.
// Map of Sunday datestamps to arrays of the datestamps for that 7-day week.
export const plannerCarouselDataAtom = atom<TPlannerCarouselData>(initializeCarouselData());
