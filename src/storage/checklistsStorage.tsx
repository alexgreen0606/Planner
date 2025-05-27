import { MMKV } from "react-native-mmkv";
import { IFolder } from "@/types/checklists/IFolder";
import { EItemStatus } from "@/enums/EItemStatus";
import { IChecklist } from "@/types/checklists/IChecklist";
import { EFolderItemType } from "@/enums/EFolderItemType";
import { IFolderItem } from "@/types/listItems/IFolderItem";
import { NULL } from "@/constants/generic";
import { CHECKLISTS_STORAGE_ID, ROOT_CHECKLIST_FOLDER_KEY } from "@/constants/storageIds";

const storage = new MMKV({ id: CHECKLISTS_STORAGE_ID });

/**
 * Fetches a folder from storage with the given ID.
 * @param folderId
 */
export const getFolderFromStorage = (folderId: string) => {

    // Fetch the folder for the given id from MMKV storage
    const folderString = storage.getString(folderId);

    if (folderString) {
        const foundFolder: IFolder = JSON.parse(folderString);
        return foundFolder;
    } else if (folderId === ROOT_CHECKLIST_FOLDER_KEY) {

        // @ts-ignore - color must be overridden to blue for the root folder
        const initialRootFolder = {
            id: ROOT_CHECKLIST_FOLDER_KEY,
            listId: NULL,
            folderIds: [],
            listIds: [],
            value: 'Lists',
            sortId: 1,
            platformColor: 'systemBlue',
            status: EItemStatus.STATIC
        } as IFolder;
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
        const foundList: IChecklist = JSON.parse(listString);
        return foundList;
    }
    throw new Error('List not found!')
};

export const getFolderItem = (itemId: string, type: EFolderItemType): IFolderItem => {
    const data =
        type === EFolderItemType.FOLDER
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
            type === EFolderItemType.FOLDER
                ? (data as IFolder).folderIds.length + (data as IFolder).listIds.length
                : (data as IChecklist).items.length,
    };

    return newItem;
};


/**
 * Builds a collection of all folder and lists within a folder.
 * @param folder - the folder to build from
 * @returns - a list representing all items within a folder
 */
export const getFolderItems = (folder: IFolder): IFolderItem[] => {
    return [
        ...folder.folderIds.map(currFolderId => getFolderItem(currFolderId, EFolderItemType.FOLDER)),
        ...folder.listIds.map(currListId => getFolderItem(currListId, EFolderItemType.LIST))
    ]
};

/**
 * Saves a folder or list to storage.
 * @param item - the item to save
 */
export const saveToStorage = (item: IFolder | IChecklist) => {
    storage.set(item.id, JSON.stringify(item));
};

/**
 * Creates a new folder item and adds it to its parent folder.
 * @param parentId - ID of the folder containing the item
 * @param newData - data to build the item
 */
export const createFolderItem = (newItem: IFolderItem) => {
    const parentFolder = getFolderFromStorage(newItem.listId);
    const { childrenCount, ...sharedData } = {
        ...newItem,
        status: EItemStatus.STATIC,
      };
    if (newItem.type === EFolderItemType.FOLDER) {
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
export const updateFolderItem = (newData: IFolderItem) => {
    const existingItem = getFolderFromStorage(newData.id) ?? getListFromStorage(newData.id);
    const newItem = {
        ...existingItem,
        ...newData,
        status: EItemStatus.STATIC
    } as IChecklist | IFolder;

    // Item is being transfered (root folder may not be transfered)
    if (existingItem.listId !== NULL && existingItem.listId !== newItem.listId) {
        const folderListKey = newData.type === EFolderItemType.FOLDER ? "folderIds" : "listIds";
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
export const deleteFolderItem = (itemId: string, type: EFolderItemType) => {
    let item;
    try {
        item = type === EFolderItemType.FOLDER ? getFolderFromStorage(itemId) : getListFromStorage(itemId);
    } catch (error) {
        return;
    }

    // Remove the item from its parent
    if (item.listId !== NULL) {
        const folderListKey = type === EFolderItemType.FOLDER ? "folderIds" : "listIds";
        const parentFolder = getFolderFromStorage(item.listId);
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentFolder[folderListKey].filter(currId => currId !== itemId)
        });
    }

    // Delete the item's children (for folders)
    if (type === EFolderItemType.FOLDER) {
        const folder = getFolderFromStorage(itemId);
        folder.folderIds.map(currFolderId => deleteFolderItem(currFolderId, EFolderItemType.FOLDER));
        folder.listIds.map(currListId => deleteFolderItem(currListId, EFolderItemType.LIST));
    }

    // Delete the item
    storage.delete(itemId);
};