import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { atom } from 'jotai';

// ✅ 

export const currentWeatherChipAtom = atom<TPlannerChip | null>(null);
