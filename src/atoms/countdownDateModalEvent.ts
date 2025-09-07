import { ICountdownEvent } from '@/lib/types/listItems/ICountdownEvent';
import { atom } from 'jotai';

// ✅ 

export const countdownDateModalEventAtom = atom<ICountdownEvent | null>(null);
