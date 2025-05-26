import { textFieldStateAtom } from "@/atoms/textfieldAtoms";
import { IListItem } from "@/types/listItems/core/TListItem";
import { useAtom } from "jotai";

export const useTextfieldData = <T extends IListItem>() => {
    const [textfieldState, setTextFieldState] = useAtom(textFieldStateAtom);

    const setCurrentTextfield = (current: T | null = null, pending: T | null = null) => {
        setTextFieldState({
            current,
            pending: pending !== undefined ? pending : textfieldState.pending,
        });
    };

    return {
        currentTextfield: textfieldState.current as T | undefined,
        pendingItem: textfieldState.pending as T | undefined,
        setCurrentTextfield,
    };
};