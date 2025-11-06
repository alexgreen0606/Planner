import { atom } from 'jotai';

import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';

export const recurringTimeModalEventAtom = atom<IRecurringEvent | null>(null);
