import { IColoredListItem } from "../listItems/core/IColoredListItem";
import { TListItem } from "../listItems/core/TListItem";

// ✅ 

export interface IChecklist extends IColoredListItem {
    items: TListItem[];
    listId: string;
}