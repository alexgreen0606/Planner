import { atom } from 'jotai';

import { getTodayDatestamp } from '@/utils/dateUtils';

export const todayDatestampAtom = atom<string>(getTodayDatestamp());
