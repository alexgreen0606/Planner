import { MMKV } from "react-native-mmkv";
import { Folder, FolderItem, List } from "../types";
import { FolderItemType } from "../enums";
import { ItemStatus } from "../../../foundation/sortedLists/enums";
import { StorageIds } from "../../../enums";

const storage = new MMKV({ id: StorageIds.FOLDER_STORAGE });
export const getStorageKey = (folderId: string) => (`FOLDERS_${folderId}`);

/**
 * Fetches a folder from storage with the given ID.
 * @param folderId
 */
export const getFolderFromStorage = (folderId: string) => {
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
            color: 'blue',
            status: ItemStatus.STATIC
        } as Folder;
        saveItemToStorage(initialRootFolder)
        return initialRootFolder;
    }
    throw new Error(`Folder not found for id: ${folderId}`);
};

/**
 * Fetches a list from storage with the given ID.
 * @param listId
 */
export const getListFromStorage = (listId: string) => {
    const storageKey = getStorageKey(listId);

    // Fetch the list for the given id from MMKV storage
    const listString = storage.getString(storageKey);

    if (listString) {
        const foundList: List = JSON.parse(listString);
        return foundList;
    }
    throw new Error('List not found!')
};

/**
 * Fetches a folder's items from storage and formats them into a list of 
 * folder items.
 * @param folderId 
 * @returns - a list of folder items
 */
// export const getFolderItems = (folderId: string) => {
//     const folder = getFolderFromStorage(folderId);
//     const folderItems = folder.folderIds.map(currFolderId => {
//         const currFolder = getFolderFromStorage(currFolderId);
//         return {
//             id: currFolder.id,
//             value: currFolder.value,
//             sortId: currFolder.sortId,
//             color: currFolder.color,
//             status: currFolder.status,
//             type: FolderItemType.FOLDER,
//             childrenCount: currFolder.folderIds.length + currFolder.listIds.length,
//         };
//     });
//     const listItems = folder.listIds.map(currListId => {
//         const currList = getListFromStorage(currListId);
//         return {
//             id: currList.id,
//             value: currList.value,
//             sortId: currList.sortId,
//             color: currList.color,
//             status: currList.status,
//             type: FolderItemType.LIST,
//             childrenCount: currList.items.length,
//         };
//     });
//     const allFolderItems = [...folderItems, ...listItems];
//     allFolderItems.sort((a, b) => a.sortId - b.sortId);
//     return allFolderItems;
// }

// TODO: comment
export const newGetFolderItems = (folder: Folder) => {
    const folderItems = folder.folderIds.map(currFolderId => {
        const currFolder = getFolderFromStorage(currFolderId);
        return {
            id: currFolder.id,
            value: currFolder.value,
            sortId: currFolder.sortId,
            color: currFolder.color,
            status: currFolder.status,
            type: FolderItemType.FOLDER,
            childrenCount: currFolder.folderIds.length + currFolder.listIds.length,
        };
    });
    const listItems = folder.listIds.map(currListId => {
        const currList = getListFromStorage(currListId);
        return {
            id: currList.id,
            value: currList.value,
            sortId: currList.sortId,
            color: currList.color,
            status: currList.status,
            type: FolderItemType.LIST,
            childrenCount: currList.items.length,
        };
    });
    const allFolderItems = [...folderItems, ...listItems];
    allFolderItems.sort((a, b) => a.sortId - b.sortId);
    return allFolderItems;
}

/**
 * Saves a folder or list to storage.
 * @param item - the item being saved
 */
export const saveItemToStorage = (item: Folder | List) =>
    storage.set(getStorageKey(item.id), JSON.stringify(item));

/**
 * Creates a new folder item and adds it to its parent folder.
 * @param parentId
 * @param newData
 */
export const createFolderItem = (parentId: string, newData: FolderItem) => {
    const parentFolder = getFolderFromStorage(parentId);
    const newItem = {
        ...newData,
        parentFolderId: parentId
    }
    if (newData.type === FolderItemType.FOLDER) {
        // Save the new folder
        saveItemToStorage({
            ...newItem,
            folderIds: [],
            listIds: [],
        });
        parentFolder.folderIds.push(newData.id);
    } else {
        // Save the new list
        saveItemToStorage({
            ...newItem,
            items: [],
            parentFolderId: parentId
        } as List);
        parentFolder.listIds.push(newData.id);
    }

    // Add the item to its parent
    saveItemToStorage(parentFolder);
};

/**
 * Updates a folder item.
 * If the folder item has been transfered, remove it from the old parent and add it 
 * to the new parent.
 *  The lists within this folder item will not be edited. (see updateFolderItems)
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

    if (newData.type === FolderItemType.LIST) {
        delete newItem.listIds;
        delete newItem.folderIds;
        if (newData.status === ItemStatus.NEW) {
            newItem.items = [];
        }
    } else {
        delete newItem.items;
        if (newData.status === ItemStatus.NEW) {
            newItem.folderIds = [];
            newItem.listIds = [];
        }
    }

    console.log(newItem, 'new')

    // Item is being transfered (root folder may not be transfered)
    if (newParentId && existingItem.parentFolderId) {
        newItem.parentFolderId = newParentId;
        const folderListKey = newData.type === FolderItemType.FOLDER ? "folderIds" : "listIds";
        // Add this item to its new parent
        const parentFolder = getFolderFromStorage(newParentId);
        const parentList = [...parentFolder[folderListKey], newData.id]
        saveItemToStorage({
            ...parentFolder,
            [folderListKey]: parentList,
        });
        // Remove this item from its old parent
        const oldParentFolder = getFolderFromStorage(existingItem.parentFolderId);
        const oldParentList = oldParentFolder[folderListKey].filter(currFolderId => currFolderId !== newData.id);
        saveItemToStorage({
            ...oldParentFolder,
            [folderListKey]: oldParentList
        });
    }
    // Update the item
    saveItemToStorage(newItem);

    // Refresh the parent folder
    if (newItem.parentFolderId) {
        const parent = getFolderFromStorage(newItem.parentFolderId);

        if (!!existingItem.listIds && newData.type === FolderItemType.LIST) {
            parent.folderIds = parent.folderIds.filter(id => id !== newData.id);
            parent.listIds = [...parent.listIds, newData.id];
        } else if (!existingItem.listIds && newData.type === FolderItemType.FOLDER) {
            parent.listIds = parent.listIds.filter(id => id !== newData.id);
            parent.folderIds = [...parent.folderIds, newData.id];
        }
        saveItemToStorage(parent);
    }
};

// TODO: comment
export const buildFolderFromItems = (newItems: FolderItem[], currentFolder: Folder) => {
    const newFolder = {
        ...currentFolder,
        folderIds: newItems.filter(item => item.type === FolderItemType.FOLDER).map(item => item.id),
        listIds: newItems.filter(item => item.type === FolderItemType.LIST).map(item => item.id),
    };
    return newFolder;
}

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
        saveItemToStorage({
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
    storage.delete(getStorageKey(itemId));
};

/**
 * Special function that syncs a list's items with the sorted UI.
 * @param listId
 * @param newListItems
 */
// export const updateListItems = (listId: string, newListItems: ListItem[]) => {
//     const listKey = getStorageKey(listId);
//     const list = getListFromStorage(listId);
//     storage.set(
//         listKey,
//         JSON.stringify({
//             ...list,
//             items: newListItems
//         })
//     );
// };