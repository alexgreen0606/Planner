import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { atom } from 'jotai';

// ✅ 

export const recurringTimeModalEventAtom = atom<IRecurringEvent | null>(null);
