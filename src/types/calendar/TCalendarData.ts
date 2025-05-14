import { EventChipProps } from "@/components/EventChip";
import { IPlannerEvent } from "../listItems/IPlannerEvent";

export type TCalendarData = {
    chipsMap: Record<string, EventChipProps[]>;
    plannersMap: Record<string, IPlannerEvent[]>;
}