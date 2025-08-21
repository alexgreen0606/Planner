import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { useState } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

//

export const useFolderItem = (
    itemId: string
) => {

    const [isEditingValue, setIsEditingValue] = useState(false);

    const storage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const [item, setItem] = useMMKVObject<IFolderItem>(itemId, storage);

    function handleToggleEditValue() {
        setIsEditingValue(prev => !prev);
    }

    function handleEditValue(value: string) {
        setItem((prev) => {
            if (!prev) return prev;
            return { ...prev, value };
        });
    }

    return {
        item,
        itemIds: item?.itemIds ?? [],
        isEditingValue,
        handleEditValue,
        handleToggleEditValue,
    };
};