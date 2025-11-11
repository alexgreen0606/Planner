
import { NULL } from '@/lib/constants/generic';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import {
  deleteChecklistItemFromStorage,
  deleteFolderItemFromStorage,
  getFolderItemFromStorageById,
  getListItemFromStorageById,
  saveFolderItemToStorage
} from '@/storage/checklistsStorage';

/**
 * Updates the position of an item within its folder or checklist.
 *
 * @param from - The initial index of the item.
 * @param to - The final index of the item.
 * @param parentFolderId - The ID of the folder where the item exists.
 */
export function updateFolderOrChecklistItemIndex(from: number, to: number, parentFolderId: string) {
  const folderItem = getFolderItemFromStorageById(parentFolderId);

  const [itemId] = folderItem.itemIds.splice(from, 1);
  folderItem.itemIds.splice(to, 0, itemId);

  saveFolderItemToStorage(folderItem);
}

/**
 * Deletes a list of checklist items.
 *
 * @param items - The list of items to delete.
 */
export async function deleteChecklistItems(items: TListItem[]) {
  const listsToUpdate: Record<string, IFolderItem> = {};
  const itemIdsToDelete = new Set<string>();

  // Phase 1: Load in the needed checklists.
  for (const item of items) {
    itemIdsToDelete.add(item.id);

    if (!listsToUpdate[item.listId]) {
      const checklist = getFolderItemFromStorageById(item.listId);
      listsToUpdate[item.listId] = checklist;
    }
  }

  // Phase 2: Update all checklists in storage.
  for (const checklist of Object.values(listsToUpdate)) {
    saveFolderItemToStorage({
      ...checklist,
      itemIds: checklist.itemIds.filter((id) => !itemIdsToDelete.has(id))
    });
  }

  // Phase 3: Delete items from storage.
  for (const itemId of itemIdsToDelete) {
    deleteChecklistItemFromStorage(itemId);
  }
}

/**
 * Deletes a folder item and all its children.
 *
 * @param items - The list of items to delete.
 */
export function deleteFolderItemAndChildren(item: IFolderItem, isForceDelete: boolean = false) {
  if (item.listId === NULL) {
    throw new Error('deleteFolderItemAndChildren: Cannot delete the root folder.');
  }

  if (!isForceDelete && item.itemIds.length > 0) {
    // Item cannot be deleted. Give it a value and abort the delete.
    if (item.value.trim() === '') {
      saveFolderItemToStorage({
        ...item,
        value: item.type === EFolderItemType.FOLDER ? 'Folder' : 'Checklist'
      });
    }
    return;
  }

  // Remove the item from its parent.
  const parentFolder = getFolderItemFromStorageById(item.listId);
  saveFolderItemToStorage({
    ...parentFolder,
    itemIds: parentFolder.itemIds.filter((currId) => currId !== item.id)
  });

  // Delete the item's children (for folders).
  if (item.type === EFolderItemType.FOLDER) {
    item.itemIds.forEach((childFolderItemId) => {
      const childFolderItem = getFolderItemFromStorageById(childFolderItemId);
      deleteFolderItemAndChildren(childFolderItem);
    });
  } else {
    deleteChecklistItems(item.itemIds.map(getListItemFromStorageById));
  }

  // Delete the item.
  deleteFolderItemFromStorage(item.id);
}
