import { atom } from 'jotai';

import { EStorageId } from '@/lib/enums/EStorageId';

// Maps list types to maps of list ids to deleting items in that list
type PendingDeleteMap = Partial<Record<EStorageId, Record<string, any>>>;

// All deleting items in the app; separated by lists.
export const pendingDeleteItemsAtom = atom<PendingDeleteMap>(
  Object.values(EStorageId).reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PendingDeleteMap)
);
