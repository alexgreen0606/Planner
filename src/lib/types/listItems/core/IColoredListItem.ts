import { IListItem } from "./TListItem";
import { SelectableColor } from "../../../lib/constants/selectableColors";

export interface IColoredListItem extends IListItem {
    platformColor: SelectableColor;
};