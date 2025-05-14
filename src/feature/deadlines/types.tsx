import { ListItem } from "../sortedList/types";

export interface Deadline extends ListItem {
    startTime: string;
}