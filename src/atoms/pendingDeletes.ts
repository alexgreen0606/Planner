import { EListItemType } from '@/lib/enums/EListType';
import { atom } from 'jotai';

// ✅ 

// Map of list types to -> map of list ids to -> deleting items in that list
type PendingDeleteMap = Partial<Record<EListItemType, Record<string, any>>>;

export const pendingDeleteItemsAtom = atom<PendingDeleteMap>(
    Object.values(EListItemType).reduce((acc, type) => {
        acc[type] = {};
        return acc;
    }, {} as PendingDeleteMap)
);