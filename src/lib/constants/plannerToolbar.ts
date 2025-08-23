import { TIconType } from "@/components/icon";
import { openPlannerTimeModal } from "@/utils/plannerUtils";
import { IPlannerEvent } from "../types/listItems/IPlannerEvent";

// ✅ 

export const plannerToolbarIconConfig = [[{
    type: 'clock' as TIconType,
    onClick: (event: IPlannerEvent | undefined) => event && openPlannerTimeModal(event.id, event.listId)
}]];