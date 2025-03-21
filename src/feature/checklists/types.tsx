import { ListItem } from "../../foundation/sortedLists/types";
import { selectableColors } from "../../foundation/theme/colors";

type SelectableColor = (typeof selectableColors)[number];

export const NULL = 'NULL';

export const ROOT_FOLDER_KEY = 'ROOT_FOLDER_ID';

export const LISTS_STORAGE_ID = 'FOLDER_STORAGE';

export enum FolderItemTypes {
    FOLDER = 'FOLDER',
    LIST = 'LIST'
};

export interface ColoredListItem extends ListItem {
    platformColor: SelectableColor;
};

export interface FolderItem extends ColoredListItem {
    type: FolderItemTypes;
    childrenCount: number;
};

export interface Folder extends ColoredListItem {
    folderIds: string[];
    listIds: string[];
};

export interface Checklist extends ColoredListItem {
    items: ListItem[];
    listId: string;
};