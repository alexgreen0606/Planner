import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListType } from "@/lib/enums/EListType";

export interface IListItem {
    id: string;
    value: string;
    sortId: number;
    status: EItemStatus;
    listId: string;
    listType: EListType;
};
