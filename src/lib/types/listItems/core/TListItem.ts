import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListType } from "@/lib/enums/EListType";

// ✅ 

export type TListItem = {
    id: string;
    value: string;
    status: EItemStatus;
    listId: string;
    listType: EListType;
}
