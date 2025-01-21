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
export enum ShiftTextfieldDirection {
    ABOVE = 'ABOVE',
    BELOW = 'BELOW'
}
export enum RowControl {
    LEFT_ICON = 'LEFT_ICON',
    RIGHT_ICON = 'RIGHT_ICON',
    CONTENT = 'CONTENT'
}

/**
 * Generates a new sort id for an item below the item with the given sort ID.
 * @param parentSortId - -1 if at the top of the list, otherwise the sort ID of the item above the new item
 * @param listItems - the current list
 * @returns - a new sort id that places an item below its parent
 */
export function generateSortId(
    parentSortId: number,
    listItems: ListItem[],
): number {
    'worklet';
    const listCopy = [...listItems];
    listCopy.sort((a, b) => a.sortId - b.sortId);
    if (parentSortId === -1) {
        // Use half of the smallest existing ID or default to 1
        const smallestId = listCopy.length > 0 ? listCopy[0].sortId : 2; // Default to 2 to ensure valid division
        return smallestId / 2;
    } else {
        // Locate the position of parentSortId
        for (let i = 0; i < listCopy.length; i++) {
            if (listCopy[i].sortId === parentSortId) {
                if (i === listCopy.length - 1) {
                    // If parentSortId is the largest, new ID is +1 larger than parent
                    return parentSortId + 1;
                } else {
                    // Calculate new ID as half the distance between parentSortId and the next ID
                    const nextId = listCopy[i + 1].sortId;
                    return parentSortId + (nextId - parentSortId) / 2;
                }
            }
        }
    }
    throw new Error('Error generating sort ID.')
}

export function isItemTextfield(item: ListItem) {
    return [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
};

export function isItemDeleting(item: ListItem) {
    return item.status === ItemStatus.DELETE;
};