import { textfieldIdAtom } from "@/atoms/textfieldId";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useAtom } from "jotai";
import { MMKV, useMMKVObject } from "react-native-mmkv";

// ✅ 

export function useTextfieldItemAs<T extends TListItem>(storage: MMKV) {
    const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

    const [textfieldItem, setTextfieldItem] = useMMKVObject<T>(textfieldId ?? 'EMPTY_KEY', storage);

    function handleCloseTextfield() {
        setTextfieldId(null);
    }

    return {
        textfieldId,
        textfieldItem,
        onSetTextfieldId: setTextfieldId,
        onSetTextfieldItem: setTextfieldItem,
        onCloseTextfield: handleCloseTextfield
    };
}