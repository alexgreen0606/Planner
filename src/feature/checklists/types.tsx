import { ListItem } from "../../foundation/sortedLists/types";
import { selectableColors } from "../../theme/colors";

type SelectableColor = (typeof selectableColors)[number];

export enum FolderItemTypes {
    FOLDER = 'folder',
    LIST = 'list'
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