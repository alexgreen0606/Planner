import { IListItem } from "./core/TListItem";

export interface IDeadline extends IListItem {
    startTime: string;
}