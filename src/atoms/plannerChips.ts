import { TPlannerChipMap } from '@/lib/types/externalData/TPlannerChipMap';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// ✅ 

export const plannerChipsAtom = atom<TPlannerChipMap>({});

export const plannerChipsByDatestamp = atomFamily((datestamp: string) =>
    atom((get) => get(plannerChipsAtom)[datestamp] ?? [])
);

