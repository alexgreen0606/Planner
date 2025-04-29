import { ListItem } from "../../foundation/sortedLists/types";

export interface Birthday extends ListItem {
    contacted: boolean;
    age: number;
}