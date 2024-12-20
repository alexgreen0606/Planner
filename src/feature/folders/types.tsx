import { ListItem } from "../../foundation/sortedLists/types";
import { FolderItemType } from "./enums";

export interface FolderItem extends ListItem {
    type: FolderItemType
    childrenCount: number;
};

export interface Folder extends Omit<ListItem, 'status'> {
    folderIds: string[];
    listIds: string[];
    parentFolderId: string | null; // ONLY the root folder will be null
};

export interface List extends ListItem {
    items: ListItem[];
    parentFolderId: string;
};