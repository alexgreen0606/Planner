import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListItemType } from "@/lib/enums/EListType";

// ✅ 

export type TListItem = {
    id: string;
    value: string;
    status: EItemStatus;
    listId: string;
    listType: EListItemType;
}
