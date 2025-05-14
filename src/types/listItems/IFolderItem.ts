import { EFolderItemType } from "@/enums/EFolderItemType";
import { IColoredListItem } from "./core/IColoredListItem";

export interface IFolderItem extends IColoredListItem {
    type: EFolderItemType;
    childrenCount: number;
};