import { MMKV } from 'react-native-mmkv';

import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

const folderItemStorage = new MMKV({ id: EStorageId.FOLDER_ITEM });
const checklistItemStorage = new MMKV({ id: EStorageId.CHECKLIST_ITEM });

// ================
//  Save Functions
// ================

export function saveFolderItemToStorage(data: IFolderItem) {
  folderItemStorage.set(data.id, JSON.stringify(data));
}

export function saveChecklistItemToStorage(data: TListItem) {
  checklistItemStorage.set(data.id, JSON.stringify(data));
}

// ================
//  Read Functions
// ================

export function getListItemFromStorageById(itemId: string): TListItem {
  const itemString = checklistItemStorage.getString(itemId);
  if (!itemString) {
    throw new Error(`getListItemFromStorageById: Checklist item not found with ID ${itemId}`);
  }
  return JSON.parse(itemString);
}

export function getFolderItemFromStorageById(itemId: string): IFolderItem {
  const itemString = folderItemStorage.getString(itemId);
  if (!itemString) {
    throw new Error(`getFolderItemFromStorageById: Folder item not found with ID ${itemId}`);
  }
  return JSON.parse(itemString);
}

// ==================
//  Delete Functions
// ==================

export function deleteFolderItemFromStorage(itemId: string) {
  folderItemStorage.delete(itemId);
}

export function deleteChecklistItemFromStorage(itemId: string) {
  checklistItemStorage.delete(itemId);
}
