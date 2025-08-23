import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { uuid } from "expo-modules-core";

// ✅ 

/**
 * Maps a weekday event to a recurring event for a given recurring planner.
 * 
 * @param recurringPlannerId - The ID of the recurring planner to place the event in. (ex: Tuesday)
 * @param weekdayEvent - The event from the recurring weekday planner.
 * @param existingEventId - The ID of an existing recurring event in the recurring planner to update.
 * @returns A recurring event representing the weekday event.
 */
export function mapWeekdayEventToRecurringEvent(recurringPlannerId: string, weekdayEvent: IRecurringEvent, existingEventId?: string): IRecurringEvent {
    return {
        ...weekdayEvent,
        id: existingEventId ?? uuid.v4(),
        listId: recurringPlannerId,
        weekdayEventId: weekdayEvent.id
    }
}