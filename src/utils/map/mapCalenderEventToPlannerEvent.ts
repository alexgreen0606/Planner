import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { Event } from "expo-calendar";
import { uuid } from "expo-modules-core";
import { isoToDatestamp } from "../dateUtils";

// ✅ 

/**
 * Maps a calendar event to a planner event.
 * 
 * @param datestamp - The date of the planner where the event will be placed. (YYYY-MM-DD)
 * @param event - The calendar event to map.
 * @param existingPlannerEvent - Optional planner event to merge with the calendar event.
 * @returns A planner event with the calendar data.
 */
export function mapCalendarEventToPlannerEvent(datestamp: string, event: Event, existingPlannerEvent?: IPlannerEvent): IPlannerEvent {
    const startDatestamp = isoToDatestamp(event.startDate as string);
    const endDatestamp = isoToDatestamp(event.endDate as string);

    const multiDayEnd =
        // Starts before datestamp and ends on datestamp
        startDatestamp < datestamp && endDatestamp === datestamp;

    const multiDayStart =
        // Starts on datestamp and ends after datestamp
        startDatestamp === datestamp && endDatestamp > datestamp;

    const plannerEvent: IPlannerEvent = {
        ...existingPlannerEvent,
        id: existingPlannerEvent?.id ?? uuid.v4(),
        calendarId: event.id,
        value: event.title,
        storageId: EStorageId.PLANNER_EVENT,
        listId: datestamp,
        timeConfig: {
            startIso: event.startDate as string,
            endIso: event.endDate as string,
            allDay: false,
            multiDayStart,
            multiDayEnd
        }
    };

    return plannerEvent;
}