import { IconType } from "../components/GenericIcon";
import { Palette } from "../theme/colors";
import { isItemDeleting } from "./sortedListUtils";
import { ListItem } from "./types";

/**
 * getRightIcon Prop: generates the config for the delete toggle icon.
 */
export function generateCheckboxIconConfig<T extends ListItem>(
    item: T,
    toggleItemDelete: (item: T) => void
) {
    return {
        icon: {
            type: isItemDeleting(item) ? 'circleFilled' : 'circle' as IconType,
            color: isItemDeleting(item) ? Palette.BLUE : Palette.DIM
        },
        onClick: toggleItemDelete
    }
}