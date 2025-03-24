import { ListItem } from "./types";
import { IconType } from "../components/GenericIcon";

// ------------- Icon Configuration -------------

/**
* Generates the configuration for a checkbox icon used to toggle item deletion
* @param item The list item to generate the icon config for
* @param toggleItemDelete Callback function to handle item deletion toggle
* @param pendingDeleteItems The items about to be deleted
* @returns Icon configuration object containing icon type, color and click handler
*/
export function generateCheckboxIconConfig<T extends ListItem>(
    item: T,
    toggleItemDelete: (item: T) => void,
    pendingDeleteItems: T[]
) {
    return {
        icon: {
            type: !!pendingDeleteItems.find(i => i.id === item.id) ? 'circleFilled' : 'circle' as IconType,
            platformColor: !!pendingDeleteItems.find(i => i.id === item.id) ? 'systemTeal' : 'secondaryLabel'
        },
        onClick: toggleItemDelete
    };
}