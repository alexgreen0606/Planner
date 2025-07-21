import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListType } from "@/lib/enums/EListType";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { Event } from "expo-calendar";
import { generateSortIdByTime } from "../plannerUtils";
import { isoToDatestamp } from "../dateUtils";
import { generateSortId } from "../listUtils";

/**
 * ✅ Maps a calendar event to a planner event.
 * 
 * @param event - The calendar event to map.
 * @param datestamp - The planner key for the event.
 * @param planner - The planner the event will exist in.
 * @param storRecord - Optional storage event to merge with the calendar event.
 * @param fallbackSortId - Optional sort ID to use for the event. Otherwise 1 will be used
 * @returns - A new planner event with the calendar data.
 */
export function mapCalendarToPlanner(event: Event, datestamp: string, planner: IPlannerEvent[], storRecord?: IPlannerEvent, fallbackSortId?: number): IPlannerEvent {
    const startDatestamp = isoToDatestamp(event.startDate as string);
    const endDatestamp = isoToDatestamp(event.endDate as string);

    const multiDayEnd =
        // Starts before datestamp and ends on datestamp
        startDatestamp < datestamp && endDatestamp === datestamp;

    const multiDayStart =
        // Starts on datestamp and ends after datestamp
        startDatestamp === datestamp && endDatestamp > datestamp;

    const plannerEvent: IPlannerEvent = {
        ...storRecord,
        sortId: fallbackSortId ?? storRecord?.sortId ?? 1,
        id: event.id,
        calendarId: event.id,
        value: event.title,
        status: EItemStatus.STATIC,
        listType: EListType.PLANNER,
        listId: datestamp,
        timeConfig: {
            startIso: event.startDate as string,
            endIso: event.endDate as string,
            allDay: event.allDay,
            multiDayStart,
            multiDayEnd
        }
    }

    if (!storRecord) {
        plannerEvent.sortId = generateSortIdByTime(plannerEvent, planner);
    }
    
    return plannerEvent;
}