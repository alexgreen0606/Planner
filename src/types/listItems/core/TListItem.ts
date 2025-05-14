import { EItemStatus } from "@/enums/EItemStatus";

export interface IListItem {
    id: string;
    value: string;
    sortId: number;
    status: EItemStatus;
    listId: string;
};
