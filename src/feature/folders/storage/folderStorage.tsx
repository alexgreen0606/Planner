import { MMKV } from "react-native-mmkv";
import { Folder, FOLDER_STORAGE_ID, FolderItem, FolderItemType, List } from "../utils";
import { ItemStatus } from "../../../foundation/sortedLists/utils";

const storage = new MMKV({ id: FOLDER_STORAGE_ID });

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
    } else if (folderId === 'root') {
        const initialRootFolder = {
            id: 'root',
            folderIds: [],
            listIds: [],
            value: 'Lists',
            sortId: 1,
            parentFolderId: null,
            color: 'blue',
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
        const foundList: List = JSON.parse(listString);
        return foundList;
    }
    throw new Error('List not found!')
};

export const getFolderItem = (itemId: string, type: FolderItemType): FolderItem => {
    if (type === FolderItemType.FOLDER) {
        const data = getFolderFromStorage(itemId);
        return {
            id: data.id,
            value: data.value,
            sortId: data.sortId,
            color: data.color,
            status: data.status,
            type: FolderItemType.FOLDER,
            childrenCount: data.folderIds.length + data.listIds.length,
        };
    } else {
        const data = getListFromStorage(itemId);
        return {
            id: data.id,
            value: data.value,
            sortId: data.sortId,
            color: data.color,
            status: data.status,
            type: FolderItemType.LIST,
            childrenCount: data.items.length,
        };
    }
}

/**
 * Builds a collection of all folder and lists within a folder.
 * @param folder - the folder to build from
 * @returns - a list representing all items within a folder
 */
export const getFolderItems = (folder: Folder): FolderItem[] => {
    return [
        ...folder.folderIds.map(currFolderId => getFolderItem(currFolderId, FolderItemType.FOLDER)),
        ...folder.listIds.map(currListId => getFolderItem(currListId, FolderItemType.LIST))
    ]
};

/**
 * Saves a folder or list to storage.
 * @param item - the item to save
 */
export const saveToStorage = (item: Folder | List) => {
    storage.set(item.id, JSON.stringify(item));
};

/**
 * Creates a new folder item and adds it to its parent folder.
 * @param parentId - ID of the folder containing the item
 * @param newData - data to build the item
 */
export const createFolderItem = (parentId: string, newData: FolderItem) => {
    const parentFolder = getFolderFromStorage(parentId);
    const newItem = {
        ...newData,
        parentFolderId: parentId
    };
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
export const updateFolderItem = (newData: FolderItem, newParentId?: string) => {
    const existingItem = getFolderFromStorage(newData.id) ?? getListFromStorage(newData.id);
    const newItem = {
        ...existingItem,
        ...newData
    } as List | Folder;

    // Toggle the item between list and folder
    if (newData.type === FolderItemType.LIST && newData.status === ItemStatus.NEW) {
        delete newItem.listIds;
        delete newItem.folderIds;
        newItem.items = [];
    } else if (newData.type === FolderItemType.FOLDER && newData.status === ItemStatus.NEW) {
        delete newItem.items;
        newItem.folderIds = [];
        newItem.listIds = [];
    }

    // Item is being transfered (root folder may not be transfered)
    if (newParentId && existingItem.parentFolderId) {
        newItem.parentFolderId = newParentId;
        const folderListKey = newData.type === FolderItemType.FOLDER ? "folderIds" : "listIds";
        // Add this item to its new parent
        const parentFolder = getFolderFromStorage(newParentId);
        const parentList = [...parentFolder[folderListKey], newData.id]
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentList,
        });
        // Remove this item from its old parent
        const oldParentFolder = getFolderFromStorage(existingItem.parentFolderId);
        const oldParentList = oldParentFolder[folderListKey].filter(currFolderId => currFolderId !== newData.id);
        saveToStorage({
            ...oldParentFolder,
            [folderListKey]: oldParentList
        });
    }
    // Update the item
    saveToStorage(newItem);

    // Update the parent folder
    if (newItem.parentFolderId) {
        const parent = getFolderFromStorage(newItem.parentFolderId);
        if (!!existingItem.listIds && newData.type === FolderItemType.LIST) {
            parent.folderIds = parent.folderIds.filter(id => id !== newData.id);
            parent.listIds = [...parent.listIds, newData.id];
        } else if (!existingItem.listIds && newData.type === FolderItemType.FOLDER) {
            parent.listIds = parent.listIds.filter(id => id !== newData.id);
            parent.folderIds = [...parent.folderIds, newData.id];
        }
        saveToStorage(parent);
    }
};

/**
 * Deletes a folder item and its children. Also removes it from its parent.
 * @param itemId 
 * @param type 
 */
export const deleteFolderItem = (itemId: string, type: FolderItemType) => {
    let item;
    try {
        item = type === FolderItemType.FOLDER ? getFolderFromStorage(itemId) : getListFromStorage(itemId);
    } catch (error) {
        return;
    }

    // Remove the item from its parent
    if (item.parentFolderId) {
        const folderListKey = type === FolderItemType.FOLDER ? "folderIds" : "listIds";
        const parentFolder = getFolderFromStorage(item.parentFolderId);
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentFolder[folderListKey].filter(currId => currId !== itemId)
        });
    }

    // Delete the item's children (for folders)
    if (type === FolderItemType.FOLDER) {
        const folder = getFolderFromStorage(itemId);
        folder.folderIds.map(currFolderId => deleteFolderItem(currFolderId, FolderItemType.FOLDER));
        folder.listIds.map(currListId => deleteFolderItem(currListId, FolderItemType.LIST));
    }

    // Delete the item
    storage.delete(itemId);
};