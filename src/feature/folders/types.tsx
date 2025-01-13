import { ListItem } from "../../foundation/sortedLists/types";
import { FolderItemType } from "./enums";

export interface FolderItem extends ListItem {
    type: FolderItemType
    childrenCount: number;
    color: string;
};

export interface Folder extends Omit<ListItem, 'status'> {
    folderIds: string[];
    listIds: string[];
    color: string;
    parentFolderId: string | null; // ONLY the root folder will be null
};

export interface List extends ListItem {
    items: ListItem[];
    color: string;
    parentFolderId: string;
};