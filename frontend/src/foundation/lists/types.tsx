import { ItemStatus } from "./enums";

export interface ListItem {
    id: string;
    sortId: number;
    value: string;
    status?: ItemStatus
};

export interface CreateItemPayload {
    value: string;
    sortId: number;
}