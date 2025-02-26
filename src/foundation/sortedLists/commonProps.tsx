import { IconType } from "../components/GenericIcon";
import { Palette } from "../theme/colors";
import { isItemDeleting } from "./utils";
import { ListItem } from "./types";

// ------------- Icon Configuration -------------

/**
* Generates the configuration for a checkbox icon used to toggle item deletion
* @param item The list item to generate the icon config for
* @param toggleItemDelete Callback function to handle item deletion toggle
* @returns Icon configuration object containing icon type, color and click handler
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
   };
}