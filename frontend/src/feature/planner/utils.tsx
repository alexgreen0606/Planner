import { ListItem } from "../../foundation/lists/types";
import { Event, EventPayload } from "./types";


export function getNewSortId(
    parentSortId: number | undefined,
    listItems: ListItem[],
): number {

    if (!parentSortId)
        throw new Error('Invalid parentSortId.');

    let newSortId: number = -1;

    if (parentSortId === -1) {
        // If no valid previous ID is provided, use half of the smallest existing ID or default to 1
        const smallestId = listItems.length > 0 ? listItems[0].sortId : 2; // Default to 2 to ensure valid division
        newSortId = smallestId / 2;
    } else {
        // Locate the position of parentSortId
        let found = false;
        for (let i = 0; i < listItems.length; i++) {
            if (listItems[i].sortId === parentSortId) {
                found = true;
                if (i === listItems.length - 1) {
                    // If parentSortId is the largest, new ID is double the parentSortId
                    newSortId = parentSortId * 2;
                } else {
                    // Calculate new ID as half the distance between parentSortId and the next ID
                    const nextId = listItems[i + 1].sortId;
                    newSortId = parentSortId + (nextId - parentSortId) / 2;
                }
                break;
            }
        }
        if (!found) {
            throw new Error("Previous ID not found in events list");
        }
    }

    return newSortId;
}

export const generateEventPayload = (event: Event): EventPayload => ({
    ...event,
    sort_id: event.sortId
});

export const generateEvent = (eventPayload: EventPayload): Event => ({
    ...eventPayload,
    sortId: eventPayload.sort_id,
    pendingDelete: false
});