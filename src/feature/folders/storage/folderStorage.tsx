import { MMKV } from "react-native-mmkv";
import { Folder, FolderItem } from "../types";
import { FolderItemType } from "../enums";
import { getListItemCount } from "./listStorage";

const storage = new MMKV();

const getFolderKey = (folderId: string) => (`folder_${folderId}`);

export const saveFolder = (folder: Folder) =>
    storage.set(getFolderKey(folder.id), JSON.stringify(folder));

export const createFolder = (parentId: string, newFolderData: FolderItem) => {
    saveFolder({
        ...newFolderData,
        items: [],
        parentFolderId: parentId
    });
};

const getFolderItemCount = (folderId: string) => {
    const storageKey = getFolderKey(folderId);

    // Fetch the folder for the given id from MMKV storage
    const folderString = storage.getString(storageKey);
    if (folderString) {
        const foundFolder: Folder = JSON.parse(folderString);
        return foundFolder.items.length;
    } else {
        throw new Error('Folder not found.');
    }
}

export const getFolder = (folderId: string | undefined) => {
    if (!folderId) return;
    const storageKey = getFolderKey(folderId);

    // Fetch the folder for the given id from MMKV storage
    const folderString = storage.getString(storageKey);

    if (folderString) {
        const foundFolder: Folder = JSON.parse(folderString);
        foundFolder.items.map((item, i) => {
            if (item.type === FolderItemType.FOLDER) {
                foundFolder.items[i].childrenCount = getFolderItemCount(item.id);
            } else {
                foundFolder.items[i].childrenCount = getListItemCount(item.id);
            }
        })
        return foundFolder;
    } else if (folderId === 'root') {
        const initialRootFolder = {
            id: 'root',
            items: [],
            value: 'Lists',
        } as Folder;
        saveFolder(initialRootFolder)
        return initialRootFolder;
    }
    return undefined;
};

export const updateFolder = (newData: FolderItem, newParentId?: string) => {
    const folder = getFolder(newData.id);
    if (folder) {
        const newFolder = {
            ...folder,
            ...newData
        }
        if (newParentId) {
            newFolder.parentFolderId = newParentId;
            // Remove this folder from its old parent
            const oldParentFolder = getFolder(folder.parentFolderId);
            if (oldParentFolder) {
                saveFolder({
                    ...oldParentFolder,
                    items: oldParentFolder.items.filter(item => item.id !== newData.id)
                });
            } else {
                throw new Error ('Old parent folder not found.')
            }
            // Add this folder to its new parent
            const parentFolder = getFolder(newParentId);
            if (parentFolder) {
                console.log(parentFolder, 'parent found')
                const newParentItems = [...parentFolder.items, newData];
                console.log(newParentItems, 'new items')
                saveFolder({
                    ...parentFolder,
                    items: newParentItems
                });
                console.log(getFolder(parentFolder.id), 'new parent')
            } else {
                throw new Error ('New parent folder not found.')
            }
        }
        saveFolder(newFolder);
    }
};

export const deleteFolder = (folderId: string) => {
    const folder = getFolder(folderId);
    if (folder?.parentFolderId) {
        const parentFolder = getFolder(folder.parentFolderId);
        if (parentFolder) {
            saveFolder({
                ...parentFolder,
                items: parentFolder.items.filter(item => item.id !== folderId)
            });
        } else {
            throw new Error ('Parent folder not found.')
        }
    }
    storage.delete(getFolderKey(folderId));
};

// Special function that syncs a folder's items with the sorted UI
export const saveFolderItems = (folderId: string, newFolderItems: FolderItem[]) => {
    const folderKey = getFolderKey(folderId);
    const folder = getFolder(folderId);
    if (folder) {
        storage.set(
            folderKey,
            JSON.stringify({
                ...folder,
                items: newFolderItems
            })
        );
    }
};