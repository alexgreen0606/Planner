import { SelectableColor } from "@/lib/constants/colors";
import { TListItem } from "../listItems/core/TListItem";

// ✅ 

export interface IFolder extends TListItem {
    folderIds: string[];
    listIds: string[];
    platformColor: SelectableColor;
}

