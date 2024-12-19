import { ListItem } from "../../foundation/sortedLists/types";

export interface Event extends ListItem {
    timestamp: string;
    apple_id?: string;
}