import { IListItem } from "./core/TListItem";

export interface IBirthday extends IListItem {
    contacted: boolean;
    age: number;
}