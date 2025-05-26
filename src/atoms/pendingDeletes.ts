import { atom } from 'jotai';
import { IListItem } from '@/types/listItems/core/TListItem';

export type PendingDeleteMap = Record<string, any[]>;
export type DeleteFunctionsMap = Record<string, (items: any[]) => void>;

export const pendingDeleteMapAtom = atom<PendingDeleteMap>({});
export const deleteFunctionsMapAtom = atom<DeleteFunctionsMap>({});