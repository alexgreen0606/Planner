import { ListItem } from "./types";

/**
 * Generates a new sort id for an item below the item with the given sort ID.
 * @param parentSortId - -1 if at the top of the list, otherwise the sort ID of the item above the new item
 * @param listItems - the current list
 * @returns - a new sort id that places an item below its parent
 */
export function generateSortId(
    parentSortId: number,
    listItems: ListItem[],
): number {
    if (parentSortId === -1) {
        // Use half of the smallest existing ID or default to 1
        const smallestId = listItems.length > 0 ? listItems[0].sortId : 2; // Default to 2 to ensure valid division
        return smallestId / 2;
    } else {
        // Locate the position of parentSortId
        for (let i = 0; i < listItems.length; i++) {
            if (listItems[i].sortId === parentSortId) {
                if (i === listItems.length - 1) {
                    // If parentSortId is the largest, new ID is +1 larger than parent
                    return parentSortId + 1;
                } else {
                    // Calculate new ID as half the distance between parentSortId and the next ID
                    const nextId = listItems[i + 1].sortId;
                    return parentSortId + (nextId - parentSortId) / 2;
                }
            }
        }
    }
    throw new Error('Error generating sort ID.')
}