import { useState } from 'react';
import { ListItem } from '../types';
import { ItemStatus } from '../enums';
import uuid from 'react-native-uuid';

/**
 * Creates and maintains a sorted list of items.
 * 
 * @param initialItems - sorted by sort ID ascending
 */
const useSortedList = <T extends ListItem>(
    initialItems: T[],
    saveLocalList: (newList: T[]) => void,
    emptyItem?: Partial<T>
) => {
    const [current, setCurrent] = useState<T[]>(initialItems);

    // Generates a new textfield item.
    const initializeTextfield = (): T => ({
        ...emptyItem,
        id: uuid.v4(),
        value: '',
        status: ItemStatus.NEW,
    } as T)

    // Returns the current textfield in the list if one exists.
    const getTextfield = (): T | undefined =>
        current.find(item => item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status));

    // Returns the item with the given ID if one exists.
    const getItemById = (id: string) =>
        current.find(item => item.id === id);

    // Returns the sort ID of the item above the given item.
    const getParentId = (id: string) => {
        const itemIndex = current.findIndex(item => item.id === id);
        return current[itemIndex - 1]?.id || 'TODO';
    }

    // Adds a new textfield just under the given sort ID.
    const addNewTextfield = (parentId: string) => {
        const newTextfield = initializeTextfield();
        setCurrent(curr => {
            const newList = [...curr];
            const insertIndex = newList.findIndex(item => item.id === parentId);
            insertIndex === -1 ?
                newList.push(newTextfield) :
                newList.splice(insertIndex + 1, 0, newTextfield);
            return newList;
        });
    };

    // Moves the current textfield to be just under the given sort ID.
    const moveTextfield = (parentId: string) => {
        const newItem = initializeTextfield();
        moveItem(newItem, parentId);
    };

    // Updates the given item. Can also replace a pending item with the given value.
    const updateItem = (newItem: T) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const replaceIndex = newList.findIndex((item) =>
                item.id === newItem.id
            );
            if (replaceIndex !== -1) {
                newList[replaceIndex] = newItem;
            }
            saveList(newList);
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
            saveList(newList);
            return newList;
        });
    };

    // Move the given item to its new location.
    const moveItem = (newItem: T, parentId: string) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex((item) => item.id === newItem.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            const insertIndex = newList.findIndex(item => item.id === parentId);
            insertIndex === -1 ?
                newList.push(newItem) :
                newList.splice(insertIndex + 1, 0, newItem);
            saveList(newList);
            return newList;
        });
    };

    // Initializes the item at the given index to be dragged.
    const beginDragItem = (index: number) => updateItem({ ...current[index], status: ItemStatus.DRAG });

    const saveList = (newList: T[]) =>
        saveLocalList(
            newList
                .filter(item => item.status !== ItemStatus.NEW)
                .map(item => {
                    const updatedItem = { ...item };
                    delete updatedItem.status;
                    return updatedItem;
                })
        );

    return {
        current,
        updateItem,
        deleteItem,
        moveItem,
        getTextfield,
        addNewTextfield,
        moveTextfield,
        getItemById,
        beginDragItem,
        getParentId,
    };
};

export default useSortedList;
