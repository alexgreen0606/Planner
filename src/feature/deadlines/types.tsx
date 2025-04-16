import { ListItem } from "../../foundation/sortedLists/types";

export interface Deadline extends ListItem {
    startTime: Date;
}