import { textfieldItemAtom } from "@/atoms/textfieldData";
import { IListItem } from "@/lib/types/listItems/core/TListItem";
import { useAtom } from "jotai";

export function useTextfieldItemAs<T extends IListItem>() {
    const [textfieldItem, setTextfieldItem] = useAtom(textfieldItemAtom);
    return [textfieldItem as T | null, setTextfieldItem as any] as const;
}