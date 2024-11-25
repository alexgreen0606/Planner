export interface ListItem {
    id: string;
    sortId: number;
    value: string;
    pendingDelete?: boolean;
};

export interface CreateItemPayload {
    value: string;
    sortId: number;
}