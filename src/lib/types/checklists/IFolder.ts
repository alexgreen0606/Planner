import { SelectableColor } from "@/lib/constants/selectableColors";
import { IListItem } from "../listItems/core/TListItem";

export interface IFolder extends IListItem {
    folderIds: string[];
    listIds: string[];
    platformColor: SelectableColor;
};

