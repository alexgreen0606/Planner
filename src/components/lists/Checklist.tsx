import { useFolderItem } from '@/hooks/useFolderItem';
import { EListItemType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { deleteChecklistItems, generateNewChecklistItemAndSaveToStorage, updateListItemIndex } from '@/utils/checklistUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

const Checklist = () => {

    const { checklistId } = useLocalSearchParams<{ checklistId: string }>();

    const {
        handleGetIsItemDeleting: onGetIsItemDeleting,
        handleToggleScheduleItemDelete: onToggleScheduleItemDelete
    } = useDeleteScheduler<TListItem>();

    const { itemIds } = useFolderItem(checklistId);

    const itemStorage = useMMKV({ id: EStorageId.ITEM });

    return (
        <DragAndDropList<TListItem>
            fillSpace
            listId={checklistId}
            storage={itemStorage}
            listType={EListItemType.CHECKLIST}
            itemIds={itemIds}
            emptyLabelConfig={{
                label: "It's a ghost town in here.",
                className: 'flex-1'
            }}
            onCreateItem={generateNewChecklistItemAndSaveToStorage}
            onDeleteItem={(item) => deleteChecklistItems([item])}
            onIndexChange={updateListItemIndex}
            onGetLeftIconConfig={(item) => generateCheckboxIconConfig(onGetIsItemDeleting(item), onToggleScheduleItemDelete)}
        />
    );
};

export default Checklist;