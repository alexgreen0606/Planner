import { GenericIconProps } from "../components/icons/GenericIcon";

export const LIST_ITEM_HEIGHT = 40;

export interface ListItem {
    id: string;
    value: string;
    sortId: number;
    status: ItemStatus
    listId: string;
};

export interface ListItemUpdateComponentProps<T extends ListItem> {
    item: T;
    onSave: (item: T) => T;
}

export type ListItemUpdateComponentConfig<T extends ListItem, P extends ListItemUpdateComponentProps<T>> = {
    component: React.ComponentType<P>;
    props: any;
    onSave: (item: T) => T
}
export type RowIconConfig<T extends ListItem> = {
    icon?: GenericIconProps;
    onClick?: (item: T) => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
}

export enum ItemStatus {
    NEW = 'NEW',
    EDIT = 'EDIT',
    DELETE = 'DELETE',
    TRANSFER = 'TRANSFER',
    STATIC = 'STATIC',
}

/**
 * Generates a new sort ID for an item below the item with the given sort ID.
 * @param parentSortId - -1 if at the top of the list, otherwise the sort ID of the item above the new item
 * @param listItems - the current list (MUST contain an event with the parentSortId)
 * @returns - a new sort id that places an item below its parent
 */
export function generateSortId(
    parentSortId: number,
    listItems: ListItem[],
): number {
    'worklet';
    const sortedList = [...listItems].sort((a, b) => a.sortId - b.sortId);
    if (parentSortId === -1) {
        // Use half of the smallest existing ID or default to 1
        const smallestId = sortedList.length > 0 ? sortedList[0].sortId : 2; // Default to 2 to ensure valid division
        return smallestId / 2;
    } else {
        // Locate the position of parentSortId
        for (let i = 0; i < sortedList.length; i++) {
            if (sortedList[i].sortId === parentSortId) {
                if (i === sortedList.length - 1) {
                    // If parentSortId is the largest, new ID is +1 larger than parent
                    return parentSortId + 1;
                } else {
                    // Calculate new ID as half the distance between parentSortId and the next ID
                    const nextId = sortedList[i + 1].sortId;
                    return parentSortId + (nextId - parentSortId) / 2;
                }
            }
        }
    }
    throw new Error(`No item exists in the list with sort ID ${parentSortId}.`)
}

/**
 * Fetches the sort ID of the item above the given item in the list.
 * @param item - the item to search above
 * @param listItems - the current list (MUST contain the item)
 * @returns 
 */
export function getParentSortId(item: ListItem, listItems: ListItem[]): number {
    const sortedList = [...listItems].sort((a,b) => a.sortId - b.sortId);
    const itemIndex = sortedList.findIndex(existingItem => existingItem.id === item.id);
    if (itemIndex !== -1)
        return itemIndex === 0 ? -1 : listItems[itemIndex - 1].sortId;
    throw new Error ('Item does not exist in the given list.')
};

/**
 * Returns true if the item is a textfield.
 */
export function isItemTextfield(item: ListItem): boolean {
    return [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
};

/**
 * Returns true if the item is deleting.
 */
export function isItemDeleting(item: ListItem): boolean {
    return item.status === ItemStatus.DELETE;
};