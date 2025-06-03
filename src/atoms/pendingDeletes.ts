import { atom } from 'jotai';

export type PendingDeleteMap = Record<string, any>;
export type DeleteFunctionsMap = Record<string, (items: any[]) => void>;

export const pendingDeleteItemsAtom = atom<PendingDeleteMap>({});
export const deleteFunctionsMapAtom = atom<DeleteFunctionsMap>({});