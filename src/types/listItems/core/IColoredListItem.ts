import { IListItem } from "./TListItem";
import { SelectableColor } from "../../../constants/selectableColors";

export interface IColoredListItem extends IListItem {
    platformColor: SelectableColor;
};