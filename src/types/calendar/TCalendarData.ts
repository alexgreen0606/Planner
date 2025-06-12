import { EventChipProps } from "@/components/EventChip";
import { IPlannerEvent } from "../listItems/IPlannerEvent";

export type TCalendarData = {
    // Chips for each given day are separated by their calendar of origin (2D array)
    chipsMap: Record<string, EventChipProps[][]>;
    plannersMap: Record<string, IPlannerEvent[]>;
}