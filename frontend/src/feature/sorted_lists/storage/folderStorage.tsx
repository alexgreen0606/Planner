import { MMKV } from "react-native-mmkv";
import { Folder, FolderItem } from "../types";

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

export const getFolder = (folderId: string | undefined) => {
    if (!folderId) return;
    const storageKey = getFolderKey(folderId);

    // Fetch the folder for the given id from MMKV storage
    const folderString = storage.getString(storageKey);

    if (folderString) {
        const foundFolder: Folder = JSON.parse(folderString);

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
            // Add this folder to its new parent folder
            const parentFolder = getFolder(newParentId);
            if (parentFolder) {
                saveFolder({
                    ...parentFolder,
                    items: [...parentFolder.items, newData]
                });
            }
            // Remove this folder from its old parent
            const oldParentFolder = getFolder(folder.parentFolderId);
            if (oldParentFolder) {
                saveFolder({
                    ...oldParentFolder,
                    items: oldParentFolder.items.filter(item => item.id !== newData.id)
                });
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

        const parentFolder = getFolder(folder.parentFolderId);
        if (parentFolder) {
            const folderIndex = parentFolder.items.findIndex(item => item.id === folder.id);
            if (folderIndex !== -1) {
                const newList = [...parentFolder.items];
                newList[folderIndex].childrenCount = newFolderItems.length;
                saveFolderItems(parentFolder.id, newList);
            }
        }
    }
};