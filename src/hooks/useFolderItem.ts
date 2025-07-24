import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getFolderItem, updateFolderItem } from '@/storage/checklistsStorage';
import { useCallback, useEffect, useState } from 'react';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';

// ✅ 

export const useFolderItem = (
    itemId: string,
    itemType: EFolderItemType
) => {
    const [editValue, setEditValue] = useState<string | null>(null);
    const [item, setItem] = useState<IFolderItem | null>(
        getFolderItem(itemId, itemType)
    );

    const handleBeginEditValue = useCallback(() => {
        if (!item) return;
        setEditValue(item.value);
    }, [item]);

    const handleValueChange = useCallback((text: string) => {
        setEditValue(text);
    }, []);

    const handleSaveValue = useCallback(() => {
        if (!item || !editValue) return;

        updateFolderItem({
            ...item,
            value: editValue,
            status: EItemStatus.STATIC
        });
        setEditValue(null);
    }, [item, editValue]);

    const storage = useMMKV({ id: EStorageId.CHECKLISTS });

    // Update the item when its storage record changes.
    useMMKVListener((key) => {
        if (key === itemId) {
            setItem(getFolderItem(itemId, itemType));
        }
    }, storage);

    // Fetch the new folder item anytime the hook params change.
    useEffect(() => {
        const currentFolder = getFolderItem(itemId, itemType);
        setItem(currentFolder);
        setEditValue(null);
    }, [itemId, itemType]);

    return {
        folderItem: item,
        editingValue: editValue,
        handleBeginEditValue,
        handleValueChange,
        handleSaveValue
    };
};