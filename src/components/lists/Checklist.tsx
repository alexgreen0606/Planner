import useFolderItem from '@/hooks/useFolderItem';
import useListItemToggle from '@/hooks/useListItemToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { createNewChecklistItemAndSaveToStorage, deleteChecklistItems, updateListItemIndex } from '@/utils/checklistUtils';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from '../../_deprecated/DEP_DragAndDropList';

// ✅ 

type TChecklistProps = {
    checklistId: string;
}

const Checklist = ({ checklistId }: TChecklistProps) => {
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
            onCreateItem={createNewChecklistItemAndSaveToStorage}
            onDeleteItem={(item) => deleteChecklistItems([item])}
            onIndexChange={updateListItemIndex}
            onGetLeftIcon={useListItemToggle}
        />
    )
};

export default Checklist;