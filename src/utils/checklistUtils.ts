import { jotaiStore } from 'app/_layout'
import { uuid } from 'expo-modules-core'

import { textfieldIdAtom } from '@/atoms/textfieldId'
import { NULL } from '@/lib/constants/generic'
import { EFolderItemType } from '@/lib/enums/EFolderItemType'
import { EStorageId } from '@/lib/enums/EStorageId'
import { TListItem } from '@/lib/types/listItems/core/TListItem'
import { IFolderItem } from '@/lib/types/listItems/IFolderItem'
import {
  deleteChecklistItemFromStorage,
  deleteFolderItemFromStorage,
  getFolderItemFromStorageById,
  getListItemFromStorageById,
  saveChecklistItemToStorage,
  saveFolderItemToStorage,
} from '@/storage/checklistsStorage'

// ✅

// ==================
//  Create Functions
// ==================

// ====================
// 1. Create Functions
// ====================

/**
 * Generates a new checklist item. The new item will focus the textfield.
 *
 * @param checklistId - The ID of the checklist.
 * @param index - The index of the new item within its list.
 */
export function createNewChecklistItemAndSaveToStorage(checklistId: string, index: number) {
  const checklist = getFolderItemFromStorageById(checklistId)

  const item: TListItem = {
    id: uuid.v4(),
    value: '',
    listId: checklistId,
    storageId: EStorageId.CHECKLIST_ITEM,
  }
  saveChecklistItemToStorage(item)

  checklist.itemIds.splice(index, 0, item.id)
  saveFolderItemToStorage(checklist)

  jotaiStore.set(textfieldIdAtom, item.id)
}

/**
 * Generates a new folder item. The new item will focus the textfield.
 *
 * @param parentFolderId - The ID of the folder where the new item must be placed.
 * @param index - The index of the new item within its parent folder.
 */
export function createNewFolderItemAndSaveToStorage(parentFolderId: string, index: number) {
  const parentFolder = getFolderItemFromStorageById(parentFolderId)

  const folderItem: IFolderItem = {
    id: uuid.v4(),
    value: '',
    listId: parentFolderId,
    storageId: EStorageId.FOLDER_ITEM,
    platformColor: 'systemBrown',
    type: EFolderItemType.FOLDER,
    itemIds: [],
  }
  saveFolderItemToStorage(folderItem)

  parentFolder.itemIds.splice(index, 0, folderItem.id)
  saveFolderItemToStorage(parentFolder)

  jotaiStore.set(textfieldIdAtom, folderItem.id)
}

// ===================
// 2. Update Function
// ===================

/**
 * Updates the position of an item within its folder or checklist.
 *
 * @param index - The index to place the item in.
 * @param item - The item to move.
 */
export function updateListItemIndex<T extends TListItem>(index: number, item: T) {
  const checklist = getFolderItemFromStorageById(item.listId)

  checklist.itemIds = checklist.itemIds.filter((id) => id !== item.id)
  checklist.itemIds.splice(index, 0, item.id)

  saveFolderItemToStorage(checklist)
}

// ====================
// 3. Delete Functions
// ====================

/**
 * Deletes a list of checklist items.
 *
 * @param items - The list of items to delete.
 */
export async function deleteChecklistItems(items: TListItem[]) {
  const listsToUpdate: Record<string, IFolderItem> = {}
  const itemIdsToDelete = new Set<string>()

  // Phase 1: Load in the needed checklists.
  for (const item of items) {
    itemIdsToDelete.add(item.id)

    if (!listsToUpdate[item.listId]) {
      const checklist = getFolderItemFromStorageById(item.listId)
      listsToUpdate[item.listId] = checklist
    }
  }

  // Phase 2: Update all checklists in storage.
  for (const checklist of Object.values(listsToUpdate)) {
    saveFolderItemToStorage({
      ...checklist,
      itemIds: checklist.itemIds.filter((id) => !itemIdsToDelete.has(id)),
    })
  }

  // Phase 3: Delete items from storage.
  for (const itemId of itemIdsToDelete) {
    deleteChecklistItemFromStorage(itemId)
  }
}

/**
 * Deletes a folder item and all its children.
 *
 * @param items - The list of items to delete.
 */
export function deleteFolderItemAndChildren(item: IFolderItem, isForceDelete: boolean = false) {
  if (item.listId === NULL) {
    throw new Error('deleteFolderItemAndChildren: Cannot delete the root folder.')
  }

  if (!isForceDelete && item.itemIds.length > 0) {
    // Item cannot be deleted. Give it a value and abort the delete.
    if (item.value.trim() === '') {
      saveFolderItemToStorage({
        ...item,
        value: item.type === EFolderItemType.FOLDER ? 'Folder' : 'Checklist',
      })
    }
    return
  }

  // Remove the item from its parent.
  const parentFolder = getFolderItemFromStorageById(item.listId)
  saveFolderItemToStorage({
    ...parentFolder,
    itemIds: parentFolder.itemIds.filter((currId) => currId !== item.id),
  })

  // Delete the item's children (for folders).
  if (item.type === EFolderItemType.FOLDER) {
    item.itemIds.forEach((childFolderItemId) => {
      const childFolderItem = getFolderItemFromStorageById(childFolderItemId)
      deleteFolderItemAndChildren(childFolderItem)
    })
  } else {
    deleteChecklistItems(item.itemIds.map(getListItemFromStorageById))
  }

  // Delete the item.
  deleteFolderItemFromStorage(item.id)
}
