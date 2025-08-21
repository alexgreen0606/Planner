import { TIconType } from "@/components/icon";
import { TListItem } from "@/lib/types/listItems/core/TListItem";

// ✅ 

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
