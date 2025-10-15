import { IUpcomingDate } from '@/lib/types/listItems/IUpcomingDate';
import { atom } from 'jotai';

// ✅ 

export const upcomingDateDateModalEventAtom = atom<IUpcomingDate | null>(null);
