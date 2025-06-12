import { IPlannerEvent } from "../listItems/IPlannerEvent";
import { TEventChip } from "../planner/TEventChip";

export type TCalendarData = {
    // Chips for each given day are separated by their calendar of origin (2D array)
    chipsMap: Record<string, TEventChip[][]>;
    plannersMap: Record<string, IPlannerEvent[]>;
}