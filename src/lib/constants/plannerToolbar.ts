import { openTimeModal } from "@/utils/plannerUtils";
import { IPlannerEvent } from "../types/listItems/IPlannerEvent";
import { TIconType } from "@/components/icon";

export const plannerToolbarIconConfig = [[{
    type: 'clock' as TIconType,
    onClick: (event: IPlannerEvent | undefined) => event && openTimeModal(event.listId, event)
}]];