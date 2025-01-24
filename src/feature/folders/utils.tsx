import { ListItem } from "../../foundation/sortedLists/utils";

export const selectableColors = ['yellow', 'green', 'red', 'purple', 'orange'];

export const NULL = 'NULL';
export const ROOT_FOLDER_ID = 'ROOT_FOLDER_ID';

export interface FolderItem extends ListItem {
    type: FolderItemType
    childrenCount: number;
    color: string;
};

export interface Folder extends ColoredListItem {
    folderIds: string[];
    listIds: string[];
};

export interface List extends ColoredListItem {
    items: ListItem[];
    listId: string;
};

export enum FolderItemType {
    FOLDER = 'FOLDER',
    LIST = 'LIST'
};

export interface ColoredListItem extends ListItem {
    color: string;
}

export const FOLDER_STORAGE_ID = 'FOLDER_STORAGE'