import { ListItem } from "../sortedList/types";

export interface Birthday extends ListItem {
    contacted: boolean;
    age: number;
}