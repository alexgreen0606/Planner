import { ListItem } from "../../foundation/sortedLists/types";
import { FolderItemType } from "./enums";

export interface FolderItem extends ListItem {
    type: FolderItemType
    childrenCount: number;
};

export interface Folder extends ListItem {
    items: FolderItem[];
    parentFolderId?: string;
};

export interface List extends ListItem {
    items: ListItem[];
    parentFolderId?: string;
};