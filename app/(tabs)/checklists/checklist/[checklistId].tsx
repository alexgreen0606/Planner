import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/DraggableListPage';
import useFolderItem from '@/hooks/useFolderItem';
import useListItemToggle from '@/hooks/useListItemToggle';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { saveChecklistItemToStorage } from '@/storage/checklistsStorage';
import {
  deleteChecklistItems,
} from '@/utils/checklistUtils';
import { uuid } from 'expo-modules-core';

type TChecklistPageParams = {
  checklistId: string;
};

const ChecklistPage = () => {
  const { checklistId } = useLocalSearchParams<TChecklistPageParams>();

  const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });
  const { onSetTextfieldId } = useTextfieldItemAs<TListItem>(itemStorage);

  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const { itemIds, platformColor, onUpdateItemIndex, onSetFolderItem } = useFolderItem(checklistId, folderItemStorage);

  function handleCreateNewChecklistItemAndSaveToStorage(index: number) {
    // Save the new item to storage.
    const newItem: TListItem = {
      id: uuid.v4(),
      value: '',
      listId: checklistId,
      storageId: EStorageId.CHECKLIST_ITEM
    };
    saveChecklistItemToStorage(newItem);

    // Add the new item to the checklist.
    onSetFolderItem((prev) => {
      if (!prev) return prev;
      const newChecklist = { ...prev };
      newChecklist.itemIds.splice(index, 0, newItem.id);
      return newChecklist;
    });

    onSetTextfieldId(newItem.id);
  }

  return (
    <DraggableListPage
      emptyPageLabel='All items complete'
      listId={checklistId}
      storage={itemStorage}
      storageId={EStorageId.CHECKLIST_ITEM}
      itemIds={itemIds}
      addButtonColor={platformColor}
      onCreateItem={handleCreateNewChecklistItemAndSaveToStorage}
      onDeleteItem={(item) => deleteChecklistItems([item])}
      onIndexChange={onUpdateItemIndex}
      onGetLeftIcon={useListItemToggle}
    />
  );
};

export default ChecklistPage;
