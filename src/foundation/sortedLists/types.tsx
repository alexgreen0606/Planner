import { ItemStatus } from "./enums";

export interface ListItem {
    id: string;
    value: string;
    sortId: number;
    status: ItemStatus
};