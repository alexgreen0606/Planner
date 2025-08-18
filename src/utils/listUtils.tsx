import { TIconType } from "@/components/icon";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { uuid } from "expo-modules-core";

// ✅ 

// ==================
// 1. Clone Function
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
// 2. Generation Function
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
// 3. Validation Function
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