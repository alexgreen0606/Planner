import { EDeleteFunctionKey } from '@/lib/enums/EDeleteFunctionKeys';
import { atom } from 'jotai';

type PendingDeleteMap = Partial<Record<EDeleteFunctionKey, Record<string, any>>>;
export const pendingDeleteItemsAtom = atom<PendingDeleteMap>({});