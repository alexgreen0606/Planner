import { MMKV } from "react-native-mmkv";
import { Folder, FolderItem, FolderItemTypes, Checklist } from "../types";
import { ItemStatus } from "../../../foundation/sortedLists/constants";
import { LISTS_STORAGE_ID, NULL, ROOT_FOLDER_KEY } from "../constants";

const storage = new MMKV({ id: LISTS_STORAGE_ID });

/**
 * Fetches a folder from storage with the given ID.
 * @param folderId
 */
export const getFolderFromStorage = (folderId: string) => {

    // Fetch the folder for the given id from MMKV storage
    const folderString = storage.getString(folderId);

    if (folderString) {
        const foundFolder: Folder = JSON.parse(folderString);
        return foundFolder;
    } else if (folderId === ROOT_FOLDER_KEY) {

        // @ts-ignore - color must be overridden to blue for the root folder
        const initialRootFolder = {
            id: ROOT_FOLDER_KEY,
            listId: NULL,
            folderIds: [],
            listIds: [],
            value: 'Lists',
            sortId: 1,
            platformColor: 'systemBlue',
            status: ItemStatus.STATIC
        } as Folder;
        saveToStorage(initialRootFolder)
        return initialRootFolder;
    }
    throw new Error(`Folder not found for id: ${folderId}`);
};

/**
 * Fetches a list from storage with the given ID.
 * @param listId
 */
export const getListFromStorage = (listId: string) => {
    const listString = storage.getString(listId);

    if (listString) {
        const foundList: Checklist = JSON.parse(listString);
        return foundList;
    }
    throw new Error('List not found!')
};

export const getFolderItem = (itemId: string, type: FolderItemTypes): FolderItem => {
    const data =
        type === FolderItemTypes.FOLDER
            ? getFolderFromStorage(itemId)
            : getListFromStorage(itemId);

    if (!data) throw new Error(`${type} does not exist with id ${itemId}`)

    const newItem = {
        id: data.id,
        value: data.value,
        listId: data.listId,
        sortId: data.sortId,
        platformColor: data.platformColor,
        status: data.status,
        type,
        childrenCount:
            type === FolderItemTypes.FOLDER
                ? (data as Folder).folderIds.length + (data as Folder).listIds.length
                : (data as Checklist).items.length,
    };

    return newItem;
};


/**
 * Builds a collection of all folder and lists within a folder.
 * @param folder - the folder to build from
 * @returns - a list representing all items within a folder
 */
export const getFolderItems = (folder: Folder): FolderItem[] => {
    return [
        ...folder.folderIds.map(currFolderId => getFolderItem(currFolderId, FolderItemTypes.FOLDER)),
        ...folder.listIds.map(currListId => getFolderItem(currListId, FolderItemTypes.LIST))
    ]
};

/**
 * Saves a folder or list to storage.
 * @param item - the item to save
 */
export const saveToStorage = (item: Folder | Checklist) => {
    storage.set(item.id, JSON.stringify(item));
};

/**
 * Creates a new folder item and adds it to its parent folder.
 * @param parentId - ID of the folder containing the item
 * @param newData - data to build the item
 */
export const createFolderItem = (newItem: FolderItem) => {
    const parentFolder = getFolderFromStorage(newItem.listId);
    const { childrenCount, ...sharedData } = {
        ...newItem,
        status: ItemStatus.STATIC,
      };
    if (newItem.type === FolderItemTypes.FOLDER) {
        // Save the new folder
        saveToStorage({
            ...sharedData,
            folderIds: [],
            listIds: [],
        });
        parentFolder.folderIds.push(newItem.id);
    } else {
        // Save the new list
        saveToStorage({
            ...sharedData,
            items: [],
        });
        parentFolder.listIds.push(newItem.id);
    }

    // Add the item to its parent
    saveToStorage(parentFolder);
};

/**
 * Updates a folder item.
 * If the folder item has been transfered, remove it from the old parent and add it 
 * to the new parent.
 *  The lists within thiese items will not be edited.
 * @param newData 
 * @param newParentId 
 * @returns - the new item that was saved
 */
export const updateFolderItem = (newData: FolderItem) => {
    const existingItem = getFolderFromStorage(newData.id) ?? getListFromStorage(newData.id);
    const newItem = {
        ...existingItem,
        ...newData,
        status: ItemStatus.STATIC
    } as Checklist | Folder;

    // Item is being transfered (root folder may not be transfered)
    if (existingItem.listId !== NULL && existingItem.listId !== newItem.listId) {
        const folderListKey = newData.type === FolderItemTypes.FOLDER ? "folderIds" : "listIds";
        // Add this item to its new parent
        const parentFolder = getFolderFromStorage(newItem.listId);
        const parentList = [...parentFolder[folderListKey], newItem.id]
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentList,
        });
        // Remove this item from its old parent
        const oldParentFolder = getFolderFromStorage(existingItem.listId);
        const oldParentList = oldParentFolder[folderListKey].filter(currFolderId => currFolderId !== newItem.id);
        saveToStorage({
            ...oldParentFolder,
            [folderListKey]: oldParentList
        });
    }
    // Update the item
    saveToStorage(newItem);
};

/**
 * Deletes a folder item and its children. Also removes it from its parent.
 * @param itemId 
 * @param type 
 */
export const deleteFolderItem = (itemId: string, type: FolderItemTypes) => {
    let item;
    try {
        item = type === FolderItemTypes.FOLDER ? getFolderFromStorage(itemId) : getListFromStorage(itemId);
    } catch (error) {
        return;
    }

    // Remove the item from its parent
    if (item.listId !== NULL) {
        const folderListKey = type === FolderItemTypes.FOLDER ? "folderIds" : "listIds";
        const parentFolder = getFolderFromStorage(item.listId);
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentFolder[folderListKey].filter(currId => currId !== itemId)
        });
    }

    // Delete the item's children (for folders)
    if (type === FolderItemTypes.FOLDER) {
        const folder = getFolderFromStorage(itemId);
        folder.folderIds.map(currFolderId => deleteFolderItem(currFolderId, FolderItemTypes.FOLDER));
        folder.listIds.map(currListId => deleteFolderItem(currListId, FolderItemTypes.LIST));
    }

    // Delete the item
    storage.delete(itemId);
};