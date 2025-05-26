import { atom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { IListItem } from '@/types/listItems/core/TListItem';

export const textFieldStateAtom = atom<{
    current: Required<IListItem> | null;
    pending: Required<IListItem> | null;
}>({
    current: null,
    pending: null,
});

export const currentTextFieldAtom = atom((get) => get(textFieldStateAtom).current);
export const pendingTextFieldAtom = atom((get) => get(textFieldStateAtom).pending);