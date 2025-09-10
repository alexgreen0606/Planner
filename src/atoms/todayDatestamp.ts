import { getTodayDatestamp } from '@/utils/dateUtils';
import { atom } from 'jotai';

// ✅ 

export const todayDatestampAtom = atom<string>(getTodayDatestamp());
