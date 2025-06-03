import { textfieldItemAtom } from "@/atoms/textfieldData";
import { IListItem } from "@/types/listItems/core/TListItem";
import { SetStateAction, useAtom } from "jotai";

export function useTextfieldItemAs<T extends IListItem>() {
    const [textfieldItem, setTextfieldItem] = useAtom(textfieldItemAtom);
    return [textfieldItem as T | null, setTextfieldItem as any] as const;
}