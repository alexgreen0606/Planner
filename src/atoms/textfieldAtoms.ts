// atoms/textFieldAtoms.ts
import { atom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { IListItem } from '@/types/listItems/core/TListItem';

// Base atom
export const textFieldStateAtom = atom<{
    current: Required<IListItem> | null;
    pending: Required<IListItem> | null;
}>({
    current: null,
    pending: null,
});

// Derived atoms
export const currentTextFieldAtom = atom((get) => get(textFieldStateAtom).current);
export const pendingTextFieldAtom = atom((get) => get(textFieldStateAtom).pending);

// Custom hook that encapsulates all the logic
export const useTextFieldState = <T extends IListItem>() => {
    const textFieldState = useAtomValue(textFieldStateAtom);
    const setTextFieldState = useSetAtom(textFieldStateAtom);

    const setCurrentTextfield = (current: T | null = null, pending: T | null = null) => {
        setTextFieldState({
            current,
            pending: pending !== undefined ? pending : textFieldState.pending,
        });
    };

    return {
        currentTextfield: textFieldState.current as T | undefined,
        pendingItem: textFieldState.pending as T | undefined,
        setCurrentTextfield,
    };
};