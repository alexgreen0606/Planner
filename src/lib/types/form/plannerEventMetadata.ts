import { EEventType } from "@/lib/enums/plannerEventModalEnums";
import * as Calendar from "expo-calendar";
import { IPlannerEvent } from "../listItems/IPlannerEvent";

// The state of the event at time of modal open.
export type TInitialEventMetadata =
    | { eventType: EEventType.NON_CALENDAR; plannerEvent: IPlannerEvent }
    | { eventType: EEventType.CALENDAR_SINGLE_DAY; plannerEvent: IPlannerEvent }
    | { eventType: EEventType.CALENDAR_ALL_DAY; calendarEvent: Calendar.Event }
    | { eventType: EEventType.CALENDAR_MULTI_DAY; startPlannerEvent: IPlannerEvent | null, endPlannerEvent: IPlannerEvent | null, calendarEvent: Calendar.Event };

export type TCarryoverEventMetadata = {
    id: string,
    index: number | null // null means the event has moved to a new planner
};