import { atom } from 'jotai';

import { EStorageId } from '@/lib/enums/EStorageId';

// Maps list types to -> map of list ids to deleting items in that list
type PendingDeleteMap = Partial<Record<EStorageId, Record<string, any>>>;

export const pendingDeleteItemsAtom = atom<PendingDeleteMap>(
  Object.values(EStorageId).reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PendingDeleteMap)
);
