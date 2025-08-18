import { TIconType } from "@/components/icon";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { uuid } from "expo-modules-core";

// ✅ 

// ==================
// 1. Sort Functions
// ==================

// DEPRECATED
/**
 * Generates a list item sort ID relative to another reference item in the list.
 * 
 * @param referenceSortId - The sort ID of the reference item, or -1 for upper and lower inserts.
 * @param list - The current list. Must contain an item with the referenceSortId (unless reference sort ID is -1).
 * @param isReferenceChildOfNewItem - Places the new item above the reference item. Default is false.
 * @returns A new sort ID that positions an item relative to the reference.
 */
export function generateSortId(
    list: TListItem[],
    referenceSortId: number,
    isReferenceChildOfNewItem: boolean = false
): number {
    'worklet';

    const sortedList = sortListWithUpsertItem(list);

    if (referenceSortId === -1) {
        if (isReferenceChildOfNewItem) {
            const largestId = sortedList.length > 0 ? sortedList[sortedList.length - 1].sortId : 1;
            return largestId * 2;
        } else {
            const smallestId = sortedList.length > 0 ? sortedList[0].sortId : 2;
            return smallestId / 2;
        }
    }

    for (let i = 0; i < sortedList.length; i++) {
        if (sortedList[i].sortId === referenceSortId) {
            if (isReferenceChildOfNewItem) {
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

    throw new Error(`generateSortId: No item exists in the list with sort ID ${referenceSortId}`);
}

// DEPRECATED
/**
 * Sorts a list and optionally saves a given item to the list.
 * 
 * @param list - The list of items.
 * @param syncItem - An item to update within the list. If no item exists, it will be inserted.
 * @param replaceId - The ID of the item to replace in the list. If not provided, syncItem's ID will be used.
 * @returns A list containing the item and sorted by sort ID.
 */
export function sortListWithUpsertItem<T extends TListItem>(list: T[], syncItem?: T | null, replaceId?: string) {
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

// ==================
// 2. Clone Function
// ==================

/**
 * Clones a list item and gives it a new ID. Data may also be updated or removed.
 * 
 * @param item - The item to clone.
 * @param keysToDelete - List of keys within the item to delete.
 * @param newData - Partial data to overwrite in the clone.
 * @returns A new object with the original item's data, a new ID, deleted keys, and updated data.
 */
export function cloneListItemWithKeyRemovalAndUpdate<T extends TListItem>(item: T, keysToDelete?: (keyof T)[], newData?: Partial<T>): T {
    const clone = {
        ...item,
        id: uuid.v4(),
        ...(newData || {})
    };

    keysToDelete?.forEach(key => {
        delete clone[key];
    });

    return clone;
}

// =======================
// 3. Generation Function
// =======================

/**
* Generates the configuration for the list item deletion toggle.
* 
* @param isDeleting - True if the item is pending delete, else false.
* @param toggleItemDelete - Toggles the item in and out of pending delete.
* @returns Icon configuration for the deletion toggle.
*/
export function generateCheckboxIconConfig<T extends TListItem>(
    isDeleting: boolean,
    toggleItemDelete: (item: T) => void,
) {
    return {
        icon: {
            type: isDeleting ? 'circleFilled' : 'circle' as TIconType,
            platformColor: isDeleting ? 'systemBlue' : 'secondaryLabel'
        },
        onClick: toggleItemDelete
    };
}

// =======================
// 4. Validation Function
// =======================

/**
* Validates if a list item is the current textfield.
* 
* @param item The item to validate.
* @returns True if the item is a textfield, else false.
*/
export function isItemTextfield(item: TListItem | undefined): boolean {
    return item ? [EItemStatus.NEW, EItemStatus.EDIT].includes(item.status) : false;
}