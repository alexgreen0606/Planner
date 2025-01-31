import { ListItem } from "../../foundation/sortedLists/utils";
import { SelectableColor } from "../../foundation/theme/colors";

export const NULL = 'NULL';
export const ROOT_FOLDER_ID = 'ROOT_FOLDER_ID';
export const FOLDER_STORAGE_ID = 'FOLDER_STORAGE';

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
export enum FolderItemType {
    FOLDER = 'FOLDER',
    LIST = 'LIST'
};
export interface ColoredListItem extends ListItem {
    color: SelectableColor;
};