import { ListItem } from "../../foundation/lists/types";

export interface EventPayload {
    id: string;
    sort_id: number;
    value: string;
    timestamp: string;
    apple_id: string;
}

export interface Event extends ListItem {
    timestamp: string;
    apple_id: string;
}