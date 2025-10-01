import { transferingFolderItemAtom } from '@/atoms/transferingFolderItem';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import useTextfieldItemAs from './useTextfieldItemAs';

// ✅ 

const useFolderItem = (itemId: string, itemStorage: MMKV) => {
    const [transferingItem, setTransferingItem] = useAtom(transferingFolderItemAtom);

    const [isEditingValue, setIsEditingValue] = useState(false);

    const [item, setItem] = useMMKVObject<IFolderItem>(itemId, itemStorage);

    const { textfieldItem } = useTextfieldItemAs<IFolderItem>(itemStorage);

    function handleToggleEditValue() {
        setIsEditingValue(prev => !prev);
    }

    function handleValueChange(value: string) {
        setItem((prev) => {
            if (!prev) return prev;
            return { ...prev, value };
        });
    }

    function handleEndItemTransfer() {
        setTransferingItem(null);
    }

    return {
        item,
        itemIds: item?.itemIds ?? [],
        isEditingValue,
        isTransferMode: !!transferingItem,
        textfieldItem,
        transferingItem,
        onEndTransfer: handleEndItemTransfer,
        onValueChange: handleValueChange,
        onToggleEditValue: handleToggleEditValue,
    }
};

export default useFolderItem;