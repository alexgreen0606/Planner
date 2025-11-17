import { uuid } from 'expo-modules-core';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/SortableListPage';
import useFolderItem from '@/hooks/useFolderItem';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { getListItemFromStorageById, saveChecklistItemToStorage } from '@/storage/checklistsStorage';
import {
  deleteChecklistItems,
} from '@/utils/checklistUtils';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

type TChecklistPageParams = {
  checklistId: string;
};

const ChecklistPage = () => {
  const { onToggleScheduleItemDeleteCallback, onGetIsItemDeletingCallback } = useDeleteSchedulerContext<TListItem>();
  const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });
  const { checklistId } = useLocalSearchParams<TChecklistPageParams>();

  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const { itemIds, platformColor, onUpdateItemIndex, onSetFolderItem } = useFolderItem(checklistId, folderItemStorage);

  const handleGetItemTextPlatformColorCallback = useCallback((item: TListItem) => {
      return onGetIsItemDeletingCallback(item) ? 'tertiaryLabel' : 'label';
    }, [onGetIsItemDeletingCallback]);

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
  }

  return (
    <DraggableListPage<TListItem>
      emptyPageLabel='All items complete'
      listId={checklistId}
      storage={itemStorage}
      itemIds={itemIds}
      accentPlatformColor={platformColor}
      onToggleSelectItem={onToggleScheduleItemDeleteCallback}
      onGetIsItemSelectedCallback={onGetIsItemDeletingCallback}
      onGetItem={getListItemFromStorageById}
      onCreateItem={handleCreateNewChecklistItemAndSaveToStorage}
      onDeleteItem={(item) => deleteChecklistItems([item])}
      onIndexChange={onUpdateItemIndex}
      onGetItemTextPlatformColorCallback={handleGetItemTextPlatformColorCallback}
    />
  );
};

export default ChecklistPage;
