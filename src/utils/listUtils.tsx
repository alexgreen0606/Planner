import { IconType } from "@/components/GenericIcon";
import { EItemStatus } from "@/enums/EItemStatus";
import { IListItem } from "@/types/listItems/core/TListItem";
import { SharedValue } from "react-native-reanimated";

// ------------- Sort ID Management -------------

/**
 * Generates a new sort ID for inserting an item relative to another item in the list.
 * @param referenceSortId The sort ID of the reference item (parent if inserting below, child if inserting above)
 * @param listItems The current list (MUST contain an item with the referenceSortId unless -1)
 * @param isChildId If true, places the new item above the reference item (child); if false, below it (parent)
 * @returns A new sort ID that correctly positions the item
 */
export function generateSortId(
    referenceSortId: number,
    listItems: IListItem[],
    isChildId: boolean = false
): number {
    'worklet';
    const sortedList = sanitizeList(listItems);

    if (referenceSortId === -1) {
        if (isChildId) {
            const largestId = sortedList.length > 0 ? sortedList[sortedList.length - 1].sortId : 1;
            return largestId * 2;
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
                    return referenceSortId * 2;
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
export function getParentSortIdFromPositions<T extends IListItem>(
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
export function getParentSortId(item: IListItem, listItems: IListItem[]): number {
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
export function isItemTextfield(item: IListItem): boolean {
    return [EItemStatus.NEW, EItemStatus.EDIT].includes(item.status);
}

// ------------- Position Management -------------

/**
* Builds a map linking each item to its index in the list.
* @param currentList The current list of items
* @returns Record mapping item IDs to their positions
*/
export function buildItemPositions<T extends IListItem>(currentList: T[]): Record<string, number> {
    'worklet';
    return [...currentList].reduce<Record<string, number>>((acc, item, index) => {
        acc[item.id] = index;
        return acc;
    }, {});
}

/**
 * ✅ Sorts a list and updates the given item within the list.
 * 
 * @param list The list of items to clean up
 * @param syncItem An item to update within the list. Item will be updated by ID. If no item exists, it will be appended.
 * @param replaceId The ID of the item to replace in the list. If not provided, syncItem's ID will be used.
 * @returns A clean list sorted by sort ID
 */
export function sanitizeList<T extends IListItem>(list: T[], syncItem?: T | null, replaceId?: string) {
    const updatedList = [...list];

    if (syncItem) {
        const existingItemId = replaceId ?? syncItem.id;
        const itemCurrentIndex = updatedList.findIndex(
            (listItem) => listItem.id === existingItemId
        );
        if (itemCurrentIndex !== -1) {
            updatedList[itemCurrentIndex] = syncItem;
        } else {
            updatedList.push(syncItem);
        }
    }

    return updatedList.sort((a, b) => a.sortId - b.sortId);
}

// ------------- Common Props -------------

/**
* Generates the configuration for a checkbox icon used to toggle item deletion
* @param item The list item to generate the icon config for
* @param toggleItemDelete Callback function to handle item deletion toggle
* @param pendingDeleteItems The items about to be deleted
* @returns Icon configuration object containing icon type, color and click handler
*/
export function generateCheckboxIconConfig<T extends IListItem>(
    item: T,
    toggleItemDelete: (item: T) => void,
    isDeleting: boolean
) {
    return {
        icon: {
            type: isDeleting ? 'circleFilled' : 'circle' as IconType,
            platformColor: isDeleting ? 'systemBlue' : 'secondaryLabel'
        },
        onClick: toggleItemDelete
    };
}