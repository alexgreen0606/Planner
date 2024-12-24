import { MMKV } from "react-native-mmkv";
import { Folder, FolderItem, List } from "../types";
import { FolderItemType } from "../enums";
import { ItemStatus } from "../../../foundation/sortedLists/enums";
import { StorageIds } from "../../../enums";
import { ListItem } from "../../../foundation/sortedLists/types";

const storage = new MMKV({ id: StorageIds.FOLDER_STORAGE });

export const getStorageKey = (folderId: string) => (`FOLDERS_${folderId}`);

export const saveToStorage = (item: Folder | List) =>
    storage.set(getStorageKey(item.id), JSON.stringify(item));

export const getFolder = (folderId: string) => {
    const storageKey = getStorageKey(folderId);

    // Fetch the folder for the given id from MMKV storage
    const folderString = storage.getString(storageKey);

    if (folderString) {
        const foundFolder: Folder = JSON.parse(folderString);
        return foundFolder;
    } else if (folderId === 'root') {
        const initialRootFolder = {
            id: 'root',
            folderIds: [],
            listIds: [],
            value: 'Lists',
            sortId: 1,
            parentFolderId: null,
        } as Folder;
        saveToStorage(initialRootFolder)
        return initialRootFolder;
    }
    throw new Error(`Folder not found for id: ${folderId}`);
};

export const getList = (listId: string) => {
    const storageKey = getStorageKey(listId);

    // Fetch the list for the given id from MMKV storage
    const listString = storage.getString(storageKey);

    if (listString) {
        const foundList: List = JSON.parse(listString);
        return foundList;
    }
    throw new Error('List not found!')
};

export const getFolderItems = (folderId: string) => {
    const folder = getFolder(folderId);
    const folderItems = folder.folderIds.map(currFolderId => {
        const currFolder = getFolder(currFolderId);
        return {
            id: currFolder.id,
            value: currFolder.value,
            sortId: currFolder.sortId,
            status: ItemStatus.STATIC,
            type: FolderItemType.FOLDER,
            childrenCount: currFolder.folderIds.length + currFolder.listIds.length,
        } as FolderItem
    });
    const listItems = folder.listIds.map(currListId => {
        const currList = getList(currListId);
        return {
            id: currList.id,
            value: currList.value,
            sortId: currList.sortId,
            status: ItemStatus.STATIC,
            type: FolderItemType.LIST,
            childrenCount: currList.items.length,
        } as FolderItem
    });
    const allFolderItems = [...folderItems, ...listItems];
    allFolderItems.sort((a, b) => a.sortId - b.sortId);
    return allFolderItems;
}

/**
 * Creates a folder and adds it to its parent.
 */
export const createFolderItem = (parentId: string, newData: FolderItem): FolderItem => {
    newData.status = ItemStatus.STATIC;
    const parentFolder = getFolder(parentId);
    const newItem = {
        ...newData,
        parentFolderId: parentId
    }
    if (newData.type === FolderItemType.FOLDER) {
        // Save the new folder
        saveToStorage({
            ...newItem,
            folderIds: [],
            listIds: [],
        });
        parentFolder.folderIds.push(newData.id);
    } else {
        // Save the new list
        saveToStorage({
            ...newItem,
            items: [],
            parentFolderId: parentId
        });
        parentFolder.listIds.push(newData.id);
    }

    // Add the item to its parent
    saveToStorage(parentFolder);

    return newItem;
};

/**
 * Updates a folder item.
 * 
 * If the folder item has been transfered, remove it from the old parent and add it 
 * to the new parent.
 * 
 *  The lists within this folder item will not be edited. (see updateFolderItems)
 */
export const updateFolderItem = (newData: FolderItem, newParentId?: string): FolderItem => {
    newData.status = ItemStatus.STATIC;
    const existingItem = newData.type === FolderItemType.FOLDER ? getFolder(newData.id) : getList(newData.id);
    const newItem = {
        ...existingItem,
        ...newData
    }
    // Item is being transfered (root folder may not be transfered)
    if (newParentId && existingItem.parentFolderId) {
        newItem.parentFolderId = newParentId;
        const folderListKey = newData.type === FolderItemType.FOLDER ? "folderIds" : "listIds";
        // Add this item to its new parent
        const parentFolder = getFolder(newParentId);
        const parentList = [...parentFolder[folderListKey], newData.id]
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentList,
        });
        // Remove this item from its old parent
        const oldParentFolder = getFolder(existingItem.parentFolderId);
        const oldParentList = oldParentFolder[folderListKey].filter(currFolderId => currFolderId !== newData.id);
        saveToStorage({
            ...oldParentFolder,
            [folderListKey]: oldParentList
        });
    }
    // Update the item
    saveToStorage(newItem);

    return newItem;
};

/**
 * Deletes a folder and its children, and removes it from its parent.
 */
export const deleteFolderItem = (itemId: string, type: FolderItemType) => {

    let item;
    try {
        item = type === FolderItemType.FOLDER ? getFolder(itemId) : getList(itemId);
    } catch (error) {
        return;
    }

    // Remove the item from its parent
    if (item.parentFolderId) {
        const folderListKey = type === FolderItemType.FOLDER ? "folderIds" : "listIds";
        const parentFolder = getFolder(item.parentFolderId);
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentFolder[folderListKey].filter(currId => currId !== itemId)
        });
    }

    // Delete the item's children (for folders)
    if (type === FolderItemType.FOLDER) {
        const folder = getFolder(itemId);
        folder.folderIds.map(currFolderId => deleteFolderItem(currFolderId, FolderItemType.FOLDER));
        folder.listIds.map(currListId => deleteFolderItem(currListId, FolderItemType.LIST));
    }

    // Delete the item
    storage.delete(getStorageKey(itemId));
};

// Special function that syncs a folder's items with the sorted UI
export const updateFolderItems = (folderId: string, newFolderItems: FolderItem[]) => {
    const folderKey = getStorageKey(folderId);
    const folder = getFolder(folderId);
    const folderItemIds = newFolderItems.filter(item => item.type === FolderItemType.FOLDER).map(item => item.id);
    const listItemIds = newFolderItems.filter(item => item.type === FolderItemType.LIST).map(item => item.id);
    if (folder) {
        storage.set(
            folderKey,
            JSON.stringify({
                ...folder,
                listItemIds,
                folderItemIds
            })
        );
    }
};

// Special function that syncs a list's items with the sorted UI
export const updateListItems = (listId: string, newListItems: ListItem[]) => {
    const listKey = getStorageKey(listId);
    const list = getList(listId);
    storage.set(
        listKey,
        JSON.stringify({
            ...list,
            items: newListItems
        })
    );
};