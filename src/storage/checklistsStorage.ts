import { textfieldItemAtom } from "@/atoms/textfieldData";
import { NULL } from "@/lib/constants/generic";
import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListType } from "@/lib/enums/EListType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IChecklist } from "@/lib/types/checklists/IChecklist";
import { IFolder } from "@/lib/types/checklists/IFolder";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { jotaiStore } from "app/_layout";
import { MMKV } from "react-native-mmkv";

// ✅ 

const storage = new MMKV({ id: EStorageId.CHECKLISTS });

function saveToStorage(data: IFolder | IChecklist) {
    storage.set(data.id, JSON.stringify(data));
}

// ====================
// 1. Upsert Functions
// ====================

export function upsertFolderItem(item: IFolderItem) {
    if (item.status === EItemStatus.NEW) {
        createFolderItem(item);
    } else {
        updateFolderItemCheckTransfer(item);
    }
}

export function upsertChecklistItem(item: TListItem) {
    const list = getListById(item.listId);
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

// =====================
// 2. Read Functions
// =====================

export function getFolderById(folderId: string): IFolder {
    const folderString = storage.getString(folderId);

    if (folderString) {
        return JSON.parse(folderString);
    }

    throw new Error(`getFolderFromStorage: Folder not found for key ${folderId}`);
}

export function getListById(listId: string): IChecklist {
    const listString = storage.getString(listId);

    if (listString) {
        return JSON.parse(listString);
    }

    throw new Error(`getListFromStorage: List not found for key ${listId}`);
}

export function getFolderItemById(itemId: string, type: EFolderItemType): IFolderItem {
    const item =
        type === EFolderItemType.FOLDER
            ? getFolderById(itemId)
            : getListById(itemId);

    return {
        id: item.id,
        value: item.value,
        listId: item.listId,
        sortId: item.sortId,
        platformColor: item.platformColor,
        status: item.status,
        type,
        listType: EListType.FOLDER,
        childrenCount:
            type === EFolderItemType.FOLDER
                ? (item as IFolder).folderIds.length + (item as IFolder).listIds.length
                : (item as IChecklist).items.length,
    };
}

export function getFolderItemsByParentFolder(folder: IFolder): IFolderItem[] {
    return [
        ...folder.folderIds.map(currFolderId => getFolderItemById(currFolderId, EFolderItemType.FOLDER)),
        ...folder.listIds.map(currListId => getFolderItemById(currListId, EFolderItemType.LIST))
    ];
}

// ====================
// 3. Delete Functions
// ====================

export function deleteFolderItemAndChildren(itemId: string, type: EFolderItemType) {
    const item = type === EFolderItemType.FOLDER ? getFolderById(itemId) : getListById(itemId);

    if (item.listId === NULL) {
        throw new Error('deleteFolderItemAndChildren: Cannot delete the root folder.');
    }

    // Remove the item from its parent
    const folderListKey = type === EFolderItemType.FOLDER ? "folderIds" : "listIds";
    const parentFolder = getFolderById(item.listId);
    if (!parentFolder) return;

    saveToStorage({
        ...parentFolder,
        [folderListKey]: parentFolder[folderListKey].filter(currId => currId !== itemId)
    });

    // Delete the item's children (for folders)
    if (type === EFolderItemType.FOLDER) {
        const folder = getFolderById(itemId);
        if (!folder) return;

        folder.folderIds.forEach(childFolderId => deleteFolderItemAndChildren(childFolderId, EFolderItemType.FOLDER));
        folder.listIds.forEach(childListId => deleteFolderItemAndChildren(childListId, EFolderItemType.LIST));
    }

    // Delete the item
    storage.delete(itemId);

    // Clear the textfield item to ensure final deletion
    jotaiStore.set(textfieldItemAtom, null);
}

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

// ====================
// 4. Helper Functions
// ====================

function createFolderItem(newItem: IFolderItem) {
    const parentFolder = getFolderById(newItem.listId);
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
}

function updateFolderItemCheckTransfer(newData: IFolderItem) {
    const prevItem = newData.type === EFolderItemType.FOLDER ? getFolderById(newData.id) : getListById(newData.id);
    const item = {
        ...prevItem,
        ...newData,
        status: EItemStatus.STATIC
    } as IChecklist | IFolder;

    if (prevItem.listId !== item.listId) {
        transferFolderItem(newData.type, item, prevItem);
    }

    saveToStorage(item);
}

function transferFolderItem(
    type: EFolderItemType,
    item: IChecklist | IFolder,
    prevItem: IChecklist | IFolder
) {
    if (prevItem.listId === NULL) {
        throw new Error('updateFolderItem: Cannot transfer the root folder.');
    }

    const folderListKey = type === EFolderItemType.FOLDER ? "folderIds" : "listIds";
    const prevParentFolder = getFolderById(prevItem.listId);
    const parentFolder = getFolderById(item.listId);

    // Add this item to its new parent.
    saveToStorage({
        ...parentFolder,
        [folderListKey]: [...parentFolder[folderListKey], item.id],
    });

    // Remove this item from its old parent.
    saveToStorage({
        ...prevParentFolder,
        [folderListKey]: prevParentFolder[folderListKey].filter(currFolderId => currFolderId !== item.id)
    });

}
