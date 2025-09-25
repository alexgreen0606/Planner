import { getTodayDatestamp } from '@/utils/dateUtils';
import { atom } from 'jotai';

// ✅ 

export const currentPlannerDatestamp = atom<string>(getTodayDatestamp());
