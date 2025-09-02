import useFolderItem from '@/hooks/useFolderItem';
import useListItemToggle from '@/hooks/useListItemToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { createNewChecklistItemAndSaveToStorage, deleteChecklistItems, updateListItemIndex } from '@/utils/checklistUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

const Checklist = () => {
    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });

    const { itemIds } = useFolderItem(checklistId, folderItemStorage);

    return (
        <DragAndDropList<TListItem>
            fillSpace
            listId={checklistId}
            storage={itemStorage}
            storageId={EStorageId.CHECKLIST_ITEM}
            itemIds={itemIds}
            emptyLabelConfig={{
                label: "It's a ghost town in here",
                className: 'flex-1'
            }}
            onCreateItem={createNewChecklistItemAndSaveToStorage}
            onDeleteItem={(item) => deleteChecklistItems([item])}
            onIndexChange={updateListItemIndex}
            onGetLeftIcon={useListItemToggle}
        />
    )
};

export default Checklist;