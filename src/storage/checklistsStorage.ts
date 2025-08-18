import { EStorageId } from "@/lib/enums/EStorageId";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { MMKV } from "react-native-mmkv";

// ✅ 

const folderStorage = new MMKV({ id: EStorageId.FOLDER });
const itemStorage = new MMKV({ id: EStorageId.ITEM });

// ==================
// 1. Save Functions
// ==================

export function saveFolderItemToStorage(data: IFolderItem) {
    folderStorage.set(data.id, JSON.stringify(data));
}

export function saveChecklistItemToStorage(data: TListItem) {
    itemStorage.set(data.id, JSON.stringify(data));
}

// ==================
// 2. Read Functions
// ==================

export function getListItemFromStorageById(itemId: string): TListItem {
    const itemString = folderStorage.getString(itemId);
    if (!itemString) {
        throw new Error(`getListItemFromStorageById: Checklist item not found with ID ${itemId}`);
    }

    return JSON.parse(itemString);
}

export function getFolderItemFromStorageById(itemId: string): IFolderItem {
    const itemString = folderStorage.getString(itemId);
    if (!itemString) {
        throw new Error(`getFolderItemFromStorageById: Folder item not found with ID ${itemId}`);
    }

    return JSON.parse(itemString);
}

// ====================
// 3. Delete Functions
// ====================

export function deleteFolderItem(itemId: string) {
    folderStorage.delete(itemId);
}

export function deleteChecklistItem(itemId: string) {
    itemStorage.delete(itemId);
}
