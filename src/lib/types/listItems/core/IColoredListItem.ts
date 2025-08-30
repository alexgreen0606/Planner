import { TSelectableColor } from "@/lib/constants/colors";
import { TListItem } from "./TListItem";

// ✅ 

export interface IColoredListItem extends TListItem {
    platformColor: TSelectableColor;
}