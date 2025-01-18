import { ListItem } from "../../foundation/sortedLists/utils";

export const selectableColors = ['yellow', 'green', 'red', 'purple', 'orange'];

export interface FolderItem extends ListItem {
    type: FolderItemType
    childrenCount: number;
    color: string;
};

export interface Folder extends ColoredListItem {
    folderIds: string[];
    listIds: string[];
    parentFolderId: string | null; // ONLY the root folder will be null
};

export interface List extends ColoredListItem {
    items: ListItem[];
    parentFolderId: string;
};

export enum FolderItemType {
    FOLDER = 'FOLDER',
    LIST = 'LIST'
};

export interface ColoredListItem extends ListItem {
    color: string;
}

export const FOLDER_STORAGE_ID = 'FOLDER_STORAGE'