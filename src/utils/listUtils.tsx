import { TIconType } from "@/components/icon";
import { TListItem } from "@/lib/types/listItems/core/TListItem";

// ✅ 

/**
* Generates the configuration for the list item deletion toggle.
* 
* @param isDeleting - Signifies if the item is pending deletion.
* @param toggleItemDelete - Toggles the item in and out of pending delete.
* @returns The icon configuration for the standard deletion toggle.
*/
export function generateCheckboxIconConfig<T extends TListItem>(
    isDeleting: boolean,
    toggleItemDelete: (item: T) => void,
) {
    return {
        icon: {
            type: isDeleting ? 'circleFilled' : 'circle' as TIconType,
            platformColor: isDeleting ? 'tertiaryLabel' : 'secondaryLabel'
        },
        onClick: toggleItemDelete
    }
}
