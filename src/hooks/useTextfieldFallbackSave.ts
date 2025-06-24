import { IListItem } from "@/lib/types/listItems/core/TListItem";
import { useTextfieldItemAs } from "./useTextfieldItemAs";
import { useEffect, useRef } from "react";

export const useTextfieldFallbackSave = <T extends IListItem>(
    saveFunc: (item: T) => Promise<void> | void
) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();

    const textfieldItemRef = useRef<T | null>(null);

    useEffect(() => {
        textfieldItemRef.current = textfieldItem;
    }, [textfieldItem]);

    useEffect(() => {
        return () => {
            if (textfieldItemRef.current && textfieldItemRef.current.value.trim() !== '') {
                saveFunc(textfieldItemRef.current);
            }
            setTextfieldItem(null);
        }
    }, [saveFunc]);
}