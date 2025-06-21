import { EListType } from '@/lib/enums/EListType';
import { atom } from 'jotai';

type PendingDeleteMap = Partial<Record<EListType, Record<string, any>>>;
export const pendingDeleteItemsAtom = atom<PendingDeleteMap>(
    Object.values(EListType).reduce((acc, type) => {
        acc[type] = {};
        return acc;
    }, {} as PendingDeleteMap)
);