import { textfieldItemAtom } from "@/atoms/textfieldData";
import { NULL } from "@/lib/constants/generic";
import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListType } from "@/lib/enums/EListType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IChecklist } from "@/lib/types/checklists/IChecklist";
import { IFolder } from "@/lib/types/checklists/IFolder";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { jotaiStore } from "app/_layout";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: EStorageId.CHECKLISTS });

/**
 * Fetches a folder from storage with the given ID.
 * @param folderId
 */
export const getFolderFromStorage = (folderId: string): IFolder | null => {
    const folderString = storage.getString(folderId);

    if (folderString) {
        const foundFolder: IFolder = JSON.parse(folderString);
        return foundFolder;
    }
    console.warn(`Folder not found for key: ${folderId}`);
    return null;
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
    console.warn(`List not found for key: ${listId}`);
    return null;
};

export const getFolderItem = (itemId: string, type: EFolderItemType): IFolderItem | null => {
    const data =
        type === EFolderItemType.FOLDER
            ? getFolderFromStorage(itemId)
            : getListFromStorage(itemId);

    if (!data) return null;

    const newItem = {
        id: data.id,
        value: data.value,
        listId: data.listId,
        sortId: data.sortId,
        platformColor: data.platformColor,
        status: data.status,
        type,
        listType: EListType.FOLDER,
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
    ].filter(item => item !== null);
};

/**
 * Saves a folder or list to storage.
 * @param item - the item to save
 */
export const saveToStorage = (item: IFolder | IChecklist) => {
    storage.set(item.id, JSON.stringify(item));
};

/**
 * TODO: comment
 * 
 * @param item 
 */
export function saveTextfieldItem(item: IFolderItem) {
    if (item.status === EItemStatus.NEW) {
        createFolderItem(item);
    } else {
        updateFolderItem(item);
    }
}

/**
 * Creates a new folder item and adds it to its parent folder.
 * @param parentId - ID of the folder containing the item
 * @param newData - data to build the item
 */
export const createFolderItem = (newItem: IFolderItem) => {
    const parentFolder = getFolderFromStorage(newItem.listId);
    if (!parentFolder) return;

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
    if (!existingItem) return;

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
        if (!parentFolder) return;

        const parentList = [...parentFolder[folderListKey], newItem.id]
        saveToStorage({
            ...parentFolder,
            [folderListKey]: parentList,
        });
        // Remove this item from its old parent
        const oldParentFolder = getFolderFromStorage(existingItem.listId);
        if (!oldParentFolder) return;

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
    const item = type === EFolderItemType.FOLDER ? getFolderFromStorage(itemId) : getListFromStorage(itemId);
    if (!item || item.listId === NULL) return;

    // Remove the item from its parent
    const folderListKey = type === EFolderItemType.FOLDER ? "folderIds" : "listIds";
    const parentFolder = getFolderFromStorage(item.listId);
    if (!parentFolder) return;

    saveToStorage({
        ...parentFolder,
        [folderListKey]: parentFolder[folderListKey].filter(currId => currId !== itemId)
    });

    // Delete the item's children (for folders)
    if (type === EFolderItemType.FOLDER) {
        const folder = getFolderFromStorage(itemId);
        if (!folder) return;

        folder.folderIds.forEach(childFolderId => deleteFolderItem(childFolderId, EFolderItemType.FOLDER));
        folder.listIds.forEach(childListId => deleteFolderItem(childListId, EFolderItemType.LIST));
    }

    // Delete the item
    storage.delete(itemId);

    // Clear the textfield item to ensure final deletion
    jotaiStore.set(textfieldItemAtom, null);
}

export function saveChecklistItem(item: TListItem) {
    const list = getListFromStorage(item.listId);
    console.log(list)
    if (!list) return;

    const replaceIndex = list.items.findIndex((existingItem) =>
        existingItem.id === item.id
    );
    if (replaceIndex !== -1) {
        list.items[replaceIndex] = item;
    } else {
        list.items.push(item);
    }

    saveToStorage(list);
}

// TODO: comment
export function deleteChecklistItems(items: TListItem[]) {
    // Group items by listId
    const itemsByListId = items.reduce((acc, item) => {
        if (!acc[item.listId]) {
            acc[item.listId] = [];
        }
        acc[item.listId].push(item);
        return acc;
    }, {} as Record<string, TListItem[]>);

    // Process each list separately
    Object.entries(itemsByListId).forEach(([listId, itemsToDelete]) => {
        const listString = storage.getString(listId);
        const itemIdsToDelete = itemsToDelete.map(item => item.id);

        if (listString) {
            const currentList: IChecklist = JSON.parse(listString);
            const updatedList = {
                ...currentList,
                items: currentList.items.filter(item => !itemIdsToDelete.includes(item.id))
            };

            storage.set(listId, JSON.stringify(updatedList));
        }
    });
}