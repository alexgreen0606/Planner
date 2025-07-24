import { IListItem } from "@/lib/types/listItems/core/TListItem";
import { useEffect, useRef } from "react";
import { useTextfieldItemAs } from "./useTextfieldItemAs";

// ✅ 

export const useTextfieldFallbackSave = <T extends IListItem>(
    saveFunc: (item: T) => Promise<any> | any
) => {
    const textfieldItemRef = useRef<T | null>(null);

    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();

    // Keep the textfield ref up-to-date.
    useEffect(() => {
        textfieldItemRef.current = textfieldItem;
    }, [textfieldItem]);

    // Save the textfield on unmount.
    useEffect(() => {
        return () => {
            if (textfieldItemRef.current && textfieldItemRef.current.value.trim() !== '') {
                saveFunc(textfieldItemRef.current);
            }
            setTextfieldItem(null);
        }
    }, [saveFunc]);
}