import { ListItem } from "../../foundation/sortedLists/sortedListUtils";
import { SelectableColor } from "../../foundation/theme/colors";

export const NULL = 'NULL';
export const ROOT_FOLDER_KEY = 'ROOT_FOLDER_ID';
export const LISTS_STORAGE_ID = 'FOLDER_STORAGE';

export enum FolderItemType {
    FOLDER = 'FOLDER',
    LIST = 'LIST'
};

export interface ColoredListItem extends ListItem {
    color: SelectableColor;
};
export interface FolderItem extends ColoredListItem {
    type: FolderItemType
    childrenCount: number;
};
export interface Folder extends ColoredListItem {
    folderIds: string[];
    listIds: string[];
};
export interface List extends ColoredListItem {
    items: ListItem[];
    listId: string;
};