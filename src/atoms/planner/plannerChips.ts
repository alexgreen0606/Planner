import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// Chips for each given day are separated by their calendar of origin (2D array).
type TPlannerChipMap = Record<string, TPlannerChip[][]>;

// Maps datestamps to arrays of planner chips.
const plannerChipsMapAtom = atom<TPlannerChipMap>({});

// Returns the planner chip array for a given datestamp.
export const getPlannerChipsByDatestampAtom = atomFamily((datestamp: string) =>
  atom((get) => get(plannerChipsMapAtom)[datestamp] ?? [])
);

// Merges new calendar data with existing data into plannerChipsMapAtom.
export const savePlannerChipDataAtom = atom(null, (get, set, newData: TPlannerChipMap) => {
  const prev = get(plannerChipsMapAtom);
  set(plannerChipsMapAtom, { ...prev, ...newData });
});
