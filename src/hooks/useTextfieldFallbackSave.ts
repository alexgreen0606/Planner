import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useEffect, useRef } from "react";
import { useTextfieldItemAs } from "./useTextfieldItemAs";

// ✅ 

export const useTextfieldFallbackSave = <T extends TListItem>(
    onSave: (item: T) => Promise<any> | any
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
                onSave(textfieldItemRef.current);
            }
            setTextfieldItem(null);
        }
    }, [onSave]);
}