import { IPlannerEvent } from "../listItems/IPlannerEvent";

// ✅ 

export type TPlanner = {
    datestamp: string;
    title: string;
    events: IPlannerEvent[];
    hideRecurring: boolean;
};