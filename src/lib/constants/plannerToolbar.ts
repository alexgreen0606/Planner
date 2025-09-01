import { openPlannerTimeModal } from "@/utils/plannerUtils";
import { IPlannerEvent } from "../types/listItems/IPlannerEvent";
import { TIconType } from "./icons";

// ✅ 

export const plannerToolbarIconConfig = [[{
    type: 'clock' as TIconType,
    onClick: (event: IPlannerEvent | undefined) => event && openPlannerTimeModal(event.id, event.listId)
}]];