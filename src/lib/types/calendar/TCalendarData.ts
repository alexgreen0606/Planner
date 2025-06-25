import { IPlannerEvent } from "../listItems/IPlannerEvent";
import { TCalendarEventChip } from "../planner/TCalendarEventChip";

export type TCalendarData = {
    // Chips for each given day are separated by their calendar of origin (2D array)
    chipsMap: Record<string, TCalendarEventChip[][]>;
    plannersMap: Record<string, IPlannerEvent[]>;
}