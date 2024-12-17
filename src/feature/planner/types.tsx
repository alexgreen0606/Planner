import { ListItem } from "../../foundation/lists/types";

export interface Event extends ListItem {
    timestamp: string;
    apple_id?: string;
}