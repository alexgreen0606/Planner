import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { deleteChecklistItems, createNewChecklistItemAndSaveToStorage, updateListItemIndex } from '@/utils/checklistUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';
import useFolderItem from '@/hooks/useFolderItem';

// ✅ 

const Checklist = () => {
    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });

    const {
        onGetIsItemDeletingCallback: onGetIsItemDeleting,
        onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete
    } = useDeleteSchedulerContext<TListItem>();

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
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(onGetIsItemDeleting(item), onToggleScheduleItemDelete)}
        />
    )
};

export default Checklist;