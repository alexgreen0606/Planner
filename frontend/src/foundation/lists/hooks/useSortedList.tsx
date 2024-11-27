import { useEffect, useState } from 'react';
import { ListItem } from '../types';
import { getNewSortId } from '../../../feature/planner/utils';
import { ItemStatus } from '../enums';

const PENDING_ITEM_ID = 'PENDING_ITEM_ID';

/**
 * Creates and maintains a sorted list of items.
 * 
 * @param initialItems - sorted by sort ID ascending
 */
const useSortedList = <T extends ListItem>(initialItems: T[]) => {
    const [current, setCurrent] = useState<(T | ListItem)[]>(initialItems);

    // Generates a new textfield item.
    const initializeTextfield = (parentSortId: number): ListItem => ({
        id: PENDING_ITEM_ID,
        sortId: getNewSortId(parentSortId, current),
        value: '',
        status: ItemStatus.NEW
    })

    // Returns the current textfield in the list if one exists.
    const getTextfield = (): T | ListItem | undefined =>
        current.find(item => item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status));

     // Returns the item with the given ID if one exists.
     const getItemById = (id: string) => 
        current.find(item => item.id === id);

     const getParentSortId = (id: string) => {
        const itemIndex = current.findIndex(item => item.id === id);
        return current[itemIndex - 1]?.sortId || -1;
     }

    // Adds a new textfield just under the given sort ID.
    const addNewTextfield = (parentSortId: number) => {
        const newTextfield = initializeTextfield(parentSortId);
        setCurrent(curr => {
            const newList = [...curr];
            const insertIndex = newList.findIndex(item => item.sortId > newTextfield.sortId);
            insertIndex === -1 ?
                newList.push(newTextfield) :
                newList.splice(insertIndex, 0, newTextfield);
            return newList;
        });
    };

    // Moves the current textfield to be just under the given sort ID.
    const moveTextfield = (parentSortId: number) => {
        const newItem = initializeTextfield(parentSortId)
        moveItem(newItem);
    };

    // Updates the given item. Can also replace a pending item with the given value.
    const updateItem = (newItem: T | ListItem, replacePendingItem?: boolean) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const replaceIndex = newList.findIndex((item) =>
                item.id === (replacePendingItem ? PENDING_ITEM_ID : newItem.id)
            );
            if (replaceIndex !== -1) {
                newList[replaceIndex] = newItem;
            }
            return newList;
        });
    };

    // Deletes the item from the list with the given ID.
    const deleteItem = (itemId: string) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex((item) => item.id === itemId);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            return newList;
        });
    };

    // Move the given item to its new location.
    const moveItem = (newItem: T | ListItem) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex((item) => item.id === newItem.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            const insertIndex = newList.findIndex(item => item.sortId > newItem.sortId);
            insertIndex === -1 ?
                newList.push(newItem) :
                newList.splice(insertIndex, 0, newItem);
            return newList;
        });
    };

    // Initializes the item at the given index to be dragged.
    const beginDragItem = (index: number) => updateItem({ ...current[index], status: ItemStatus.DRAG });

    return {
        current,
        updateItem,
        deleteItem,
        moveItem,
        getTextfield,
        addNewTextfield,
        moveTextfield,
        getItemById,
        dragItem: beginDragItem,
        getParentSortId
    };
};

export default useSortedList;
