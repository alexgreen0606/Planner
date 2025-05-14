import { SharedValue } from "react-native-reanimated";
import {  ListItem } from "./types";
import { ItemStatus } from "./constants";

// ------------- Sort ID Management -------------

/**
* Generates a new sort ID for an item below the item with the given sort ID.
* @param parentSortId -1 if at the top of the list, otherwise the sort ID of the item above the new item
* @param listItems The current list (MUST contain an event with the parentSortId)
* @returns A new sort id that places an item below its parent
*/
// export function generateSortId(
//     parentSortId: number,
//     listItems: ListItem[],
// ): number {
//     'worklet';
//     const sortedList = [...listItems].sort((a, b) => a.sortId - b.sortId);

//     if (parentSortId === -1) {
//         const smallestId = sortedList.length > 0 ? sortedList[0].sortId : 2;
//         return smallestId / 2;
//     }

//     for (let i = 0; i < sortedList.length; i++) {
//         if (sortedList[i].sortId === parentSortId) {
//             if (i === sortedList.length - 1) {
//                 return parentSortId + 1;
//             }
//             const nextId = sortedList[i + 1].sortId;
//             return parentSortId + (nextId - parentSortId) / 2;
//         }
//     }

//     throw new Error(`No item exists in the list with sort ID ${parentSortId}.`);
// }

/**
 * Generates a new sort ID for inserting an item relative to another item in the list.
 * @param referenceSortId The sort ID of the reference item (parent if inserting below, child if inserting above)
 * @param listItems The current list (MUST contain an item with the referenceSortId unless -1)
 * @param isChildId If true, places the new item above the reference item (child); if false, below it (parent)
 * @returns A new sort ID that correctly positions the item
 */
export function generateSortId(
    referenceSortId: number,
    listItems: ListItem[],
    isChildId: boolean = false
): number {
    'worklet';
    const sortedList = [...listItems].sort((a, b) => a.sortId - b.sortId);

    if (referenceSortId === -1) {
        if (isChildId) {
            const largestId = sortedList.length > 0 ? sortedList[sortedList.length - 1].sortId : 1;
            return largestId + 1;
        } else {
            const smallestId = sortedList.length > 0 ? sortedList[0].sortId : 2;
            return smallestId / 2;
        }
    }

    for (let i = 0; i < sortedList.length; i++) {
        if (sortedList[i].sortId === referenceSortId) {
            if (isChildId) {
                // Insert above the child
                if (i === 0) {
                    return referenceSortId / 2;
                }
                const prevId = sortedList[i - 1].sortId;
                return prevId + (referenceSortId - prevId) / 2;
            } else {
                // Insert below the parent
                if (i === sortedList.length - 1) {
                    return referenceSortId + 1;
                }
                const nextId = sortedList[i + 1].sortId;
                return referenceSortId + (nextId - referenceSortId) / 2;
            }
        }
    }

    throw new Error(`No item exists in the list with sort ID ${referenceSortId}.`);
}


/**
* Gets the sort ID of the parent item (the one directly above this item)
* @param item The current list item
* @param positions Shared value containing positions of all items
* @param items The full array of items in the list
* @returns The sortId of the parent item, or -1 if this is the first item
*/
export function getParentSortIdFromPositions<T extends ListItem>(
    item: T,
    positions: SharedValue<Record<string, number>>,
    items: T[]
) {
    'worklet';
    const itemIndex = positions.value[item.id];

    if (itemIndex === 0) return -1;

    for (const id in positions.value) {
        if (positions.value[id] === itemIndex - 1) {
            return items.find(item => item.id === id)?.sortId ?? -1;
        }
    }

    throw new Error('Error getting new item sort ID.');
}

/**
* Fetches the sort ID of the item above the given item in the list.
* @param item The item to search above
* @param listItems The current list (MUST contain the item)
* @returns The sort ID of the parent item
*/
export function getParentSortId(item: ListItem, listItems: ListItem[]): number {
    const sortedList = [...listItems].sort((a, b) => a.sortId - b.sortId);
    const itemIndex = sortedList.findIndex(existingItem => existingItem.id === item.id);

    if (itemIndex !== -1) {
        return itemIndex === 0 ? -1 : listItems[itemIndex - 1].sortId;
    }

    throw new Error('Item does not exist in the given list.');
}

// ------------- Item Status Checks -------------

/**
* Returns true if the item is a textfield.
* @param item The item to check
* @returns Whether the item is a textfield
*/
export function isItemTextfield(item: ListItem): boolean {
    return [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
}

// ------------- Position Management -------------

/**
* Builds a map linking each item to its index in the list.
* @param currentList The current list of items
* @returns Record mapping item IDs to their positions
*/
export function buildItemPositions<T extends ListItem>(currentList: T[]): Record<string, number> {
    'worklet';
    return [...currentList].reduce<Record<string, number>>((acc, item, index) => {
        acc[item.id] = index;
        return acc;
    }, {});
}