import { IColoredListItem } from "../listItems/core/IColoredListItem";
import { IListItem } from "../listItems/core/TListItem";

export interface IChecklist extends IColoredListItem {
    items: IListItem[];
    listId: string;
};