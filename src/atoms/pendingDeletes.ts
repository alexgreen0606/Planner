import { EStorageId } from '@/lib/enums/EStorageId';
import { atom } from 'jotai';

// ✅ 

// Map of list types to -> map of list ids to -> deleting items in that list
type PendingDeleteMap = Partial<Record<EStorageId, Record<string, any>>>;

export const pendingDeleteItemsAtom = atom<PendingDeleteMap>(
    Object.values(EStorageId).reduce((acc, type) => {
        acc[type] = {};
        return acc;
    }, {} as PendingDeleteMap)
);
