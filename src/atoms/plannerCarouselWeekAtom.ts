import { atom } from "jotai";
import { DateTime } from "luxon";

// ✅ 

export type TWeeksData = {
    weeks: string[];
    map: Record<string, string[]>;
};

function initWeeks(): TWeeksData {
    const today = DateTime.local();

    // Start at the Sunday 3 weeks ago
    let start = today.minus({ weeks: 3 });
    start = start.minus({ days: start.weekday % 7 });
    const end = today.plus({ years: 3 });

    const weeks: string[] = [];
    const map: Record<string, string[]> = {};

    let cursor = start;
    while (cursor <= end) {
        const sunday = cursor.toISODate()!;

        // Build the 7-day array for this week
        const week = Array.from({ length: 7 }, (_, i) =>
            cursor.plus({ days: i }).toISODate()!
        );

        weeks.push(sunday);
        map[sunday] = week;

        cursor = cursor.plus({ weeks: 1 });
    }

    return { weeks, map };
}

export const plannerCarouselWeeksAtom = atom<TWeeksData>(initWeeks());

