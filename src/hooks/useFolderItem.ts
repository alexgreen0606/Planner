import { useState, useEffect, useCallback } from 'react';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getFolderItem, updateFolderItem } from '@/storage/checklistsStorage';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { EStorageId } from '@/lib/enums/EStorageId';

export const useFolderItem = (
    itemId: string,
    itemType: EFolderItemType
) => {
    const storage = useMMKV({ id: EStorageId.CHECKLISTS });
    const [item, setItem] = useState<IFolderItem | null>(
        getFolderItem(itemId, itemType)
    );
    const [editingValue, setEditingValue] = useState<string | null>(null);

    useEffect(() => {
        const currentFolder = getFolderItem(itemId, itemType);
        setItem(currentFolder);
        setEditingValue(null);
    }, [itemId, itemType]);

    useMMKVListener((key) => {
        if (key === itemId) {
            setItem(getFolderItem(itemId, itemType));
        }
    }, storage);

    const onBeginEdit = useCallback(() => {
        if (!item) return;
        setEditingValue(item.value);
    }, [item]);

    const onTitleChange = useCallback((text: string) => {
        setEditingValue(text);
    }, []);

    const onSave = useCallback(() => {
        if (!item) return;
        
        if (editingValue !== null) {
            const updatedFolder = {
                ...item,
                value: editingValue,
                status: EItemStatus.STATIC
            };

            // Update storage
            updateFolderItem(updatedFolder);

            // Update local state
            setItem(updatedFolder);
            setEditingValue(null);
        }
    }, [item, editingValue]);



    return {
        folder: item,
        editingValue,
        onBeginEdit,
        onTitleChange,
        onSave
    };
};