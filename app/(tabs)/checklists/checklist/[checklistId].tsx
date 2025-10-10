import useFolderItem from '@/hooks/useFolderItem';
import useListItemToggle from '@/hooks/useListItemToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import DraggableListPage from '@/components/DraggableListPage';
import { createNewChecklistItemAndSaveToStorage, deleteChecklistItems, updateListItemIndex } from '@/utils/checklistUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

type TChecklistParams = {
    checklistId: string;
};

const ChecklistPage = () => {
    const { checklistId } = useLocalSearchParams<TChecklistParams>();
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
    const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });

    const { itemIds } = useFolderItem(checklistId, folderItemStorage);
    return (
        <DraggableListPage
            emptyPageLabelProps={{ label: 'All items complete' }}
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

export default ChecklistPage;