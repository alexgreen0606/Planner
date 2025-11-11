import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useMMKV } from 'react-native-mmkv';

import DraggableListPage from '@/components/DraggableListPage';
import useFolderItem from '@/hooks/useFolderItem';
import useListItemToggle from '@/hooks/useListItemToggle';
import { EStorageId } from '@/lib/enums/EStorageId';
import {
  createNewChecklistItemAndSaveToStorage,
  deleteChecklistItems,
  updateFolderOrChecklistItemIndex
} from '@/utils/checklistUtils';

type TChecklistPageParams = {
  checklistId: string;
};

const ChecklistPage = () => {
  const { checklistId } = useLocalSearchParams<TChecklistPageParams>();
  const itemStorage = useMMKV({ id: EStorageId.CHECKLIST_ITEM });

  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const { itemIds, platformColor } = useFolderItem(checklistId, folderItemStorage);

  return (
    <DraggableListPage
      emptyPageLabel='All items complete'
      listId={checklistId}
      storage={itemStorage}
      storageId={EStorageId.CHECKLIST_ITEM}
      itemIds={itemIds}
      addButtonColor={platformColor}
      onCreateItem={createNewChecklistItemAndSaveToStorage}
      onDeleteItem={(item) => deleteChecklistItems([item])}
      onIndexChange={updateFolderOrChecklistItemIndex}
      onGetLeftIcon={useListItemToggle}
    />
  );
};

export default ChecklistPage;
