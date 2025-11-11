import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/DraggableListPage';
import useFolderItem from '@/hooks/useFolderItem';
import useListItemToggle from '@/hooks/useListItemToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import {
  deleteChecklistItems,
  updateFolderOrChecklistItemIndex
} from '@/utils/checklistUtils';
import { getFolderItemFromStorageById, saveChecklistItemToStorage, saveFolderItemToStorage } from '@/storage/checklistsStorage';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { uuid } from 'expo-modules-core';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';

type TChecklistPageParams = {
  checklistId: string;
};

const ChecklistPage = () => {
  const { checklistId } = useLocalSearchParams<TChecklistPageParams>();

  const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });
  const { onSetTextfieldId } = useTextfieldItemAs<TListItem>(itemStorage);

  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const { itemIds, platformColor } = useFolderItem(checklistId, folderItemStorage);

  function handleCreateNewChecklistItemAndSaveToStorage(checklistId: string, index: number) {
    const checklist = getFolderItemFromStorageById(checklistId);

    const item: TListItem = {
      id: uuid.v4(),
      value: '',
      listId: checklistId,
      storageId: EStorageId.CHECKLIST_ITEM
    };
    saveChecklistItemToStorage(item);

    checklist.itemIds.splice(index, 0, item.id);
    saveFolderItemToStorage(checklist);

    onSetTextfieldId(item.id);
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
      onIndexChange={updateFolderOrChecklistItemIndex}
      onGetLeftIcon={useListItemToggle}
    />
  );
};

export default ChecklistPage;
