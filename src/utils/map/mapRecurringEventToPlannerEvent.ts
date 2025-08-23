import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { uuid } from "expo-modules-core";
import { createPlannerEventTimeConfig } from "../plannerUtils";

// ✅ 

/**
 * Maps a recurring event to a planner event.
 * 
 * @param datestamp - The date of the planner where the event will be placed. (YYYY-MM-DD)
 * @param recurringEvent - The recurring event to map.
 * @param existingPlannerEvent - Optional planner event to merge with the recurring event.
 * @returns A new planner event with the recurring event data.
 */
export function mapRecurringEventToPlannerEvent(datestamp: string, recurringEvent: IRecurringEvent, existingPlannerEvent?: IPlannerEvent): IPlannerEvent {
    const plannerEvent: IPlannerEvent = {
        ...existingPlannerEvent,
        id: existingPlannerEvent?.id ?? uuid.v4(),
        listId: datestamp,
        storageId: EStorageId.PLANNER_EVENT,
        recurringId: recurringEvent.id,
        value: recurringEvent.value
    };
    if (recurringEvent.startTime) {
        plannerEvent.timeConfig = createPlannerEventTimeConfig(datestamp, recurringEvent.startTime);
    }

    return plannerEvent;
}