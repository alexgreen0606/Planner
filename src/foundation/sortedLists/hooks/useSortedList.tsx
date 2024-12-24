import { useEffect, useRef, useState } from 'react';
import { ListItem } from '../types';
import { ItemStatus, ShiftTextfieldDirection } from '../enums';
import uuid from 'react-native-uuid';
import { generateSortId } from '../utils';

interface StorageUpdateConfig<T> {
    create: (data: T) => Promise<T> | T;
    update: (data: T, newParentId?: string) => Promise<T> | T;
    delete: (data: T) => void;
}

/**
 * Maintains a sorted list of items.
 * 
 * @param initialItems - sorted by sort ID ascending
 */
const useSortedList = <T extends ListItem>(
    initialItems: T[],
    saveListToStorage?: (newList: T[]) => void, // TODO: document: cannot have this AND storageUpdates
    formatNewTextfield?: (newItem: T) => T,
    storageUpdates?: StorageUpdateConfig<T>
) => {
    const [current, setCurrent] = useState<T[]>([]);
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Keeps the list in sync with the stored list
    useEffect(() => {
        setCurrent(initialItems);
    }, [initialItems]);

    // Generates a new textfield item.
    const initializeTextfield = (parentSortId: number, customList?: T[]): T => {
        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, customList ?? current),
            value: '',
            status: ItemStatus.NEW,
        } as T
        if (formatNewTextfield)
            newTextfield = formatNewTextfield(newTextfield);
        return newTextfield;
    }

    // Returns the current textfield in the list if one exists.
    const getFocusedItem = (): T | undefined =>
        current.find(item => item.status && [ItemStatus.EDIT, ItemStatus.NEW, ItemStatus.TRANSFER].includes(item.status));

    // Returns the item with the given ID if one exists.
    const getItemById = (id: string) =>
        current.find(item => item.id === id);

    // Returns the sort ID of the item above the given item.
    const getParentSortId = (id: string, customList?: T[]) => {
        const itemIndex = (customList ?? current).findIndex(item => item.id === id);
        return current[itemIndex - 1]?.sortId || -1;
    }

    // Clears any pending deletes and re-schedules them 3 seconds into the future.
    const rescheduleAllDeletes = () => {
        pendingDeletes.current.forEach((timeoutId, id) => {
            clearTimeout(timeoutId);
            const newTimeoutId = setTimeout(async () => {
                const currentItem = getItemById(id);
                if (currentItem) {
                    deleteItem(currentItem);
                    pendingDeletes.current.delete(id);
                }
            }, 3000);
            pendingDeletes.current.set(id, newTimeoutId);
        });
    }

    /**
     * Adds a new textfield just under the given sort ID.
     */
    const generateTextfield = (parentSortId: number) => {
        const newTextfield = initializeTextfield(parentSortId);
        setCurrent(curr => {
            const newList = [...curr];
            const insertIndex = newList.findIndex(item => item.sortId > parentSortId);
            insertIndex === -1 ?
                newList.push(newTextfield) :
                newList.splice(insertIndex, 0, newTextfield);
            return newList;
        });
    };

    /**
     * Saves the focused item to the list.
     * 
     * @param shiftTextfieldConfig - determines if the textfield should shift above or below the new item
     */
    const saveTextfield = async (shiftTextfieldConfig?: string) => {

        // Get the item to be saved
        let focusedItem = getFocusedItem();
        if (!focusedItem) return;

        // Get the storage call to use
        const storageCall = !!storageUpdates ? (
            [ItemStatus.NEW].includes(focusedItem.status) ? storageUpdates.create :
                focusedItem.status === ItemStatus.EDIT ? storageUpdates.update : undefined) : undefined;

        if (!!focusedItem.value.trim().length) { // the field contains text
            focusedItem.status = ItemStatus.STATIC;

            // Execute the storage save
            if (storageCall)
                focusedItem = await storageCall(focusedItem);

            // Execute the update for this list
            updateItem(focusedItem, shiftTextfieldConfig);

        } else { // the field is empty
            // Execute the delete for this list
            deleteItem(focusedItem);
        }
    };

    /**
     * Generates a textfield to create a new item.
     * 
     * 1. If a textfield exists: 
     *  a. if the line clicked is just below the textfield
     *      i. if the textfield has a value: save the textfield, generate a new textfield just below it, and exit
     *      ii. otherwise: do nothing and exit
     *  b. if the line clicked is just above the textfield
     *      i. if the textfield has a value: save the textfield, then generate a new textfield just above it, and exit
     *      ii: otherwise: do nothing and exit
     *  c. otherwise move the textfield to the new position
     * 
     * 2. Otherwise: add a new textfield just below the list item with a sort ID that matches the given parent sort ID
     * 
     * @param newParentSortId - the sort ID of the item the textfield should be below
     */
    const moveTextfield = (newParentSortId: number | null) => {
        if (newParentSortId === null) return;
        const focusedItem = getFocusedItem();
        if (focusedItem) {
            if (newParentSortId === focusedItem.sortId) {
                if (focusedItem.value.trim().length) {
                    saveTextfield(ShiftTextfieldDirection.BELOW);
                } else {
                    return;
                }
            } else if (newParentSortId === getParentSortId(focusedItem.id)) {
                if (focusedItem.value.trim().length) {
                    saveTextfield(ShiftTextfieldDirection.ABOVE)
                } else {
                    return;
                }
            } else {
                moveItem(focusedItem, newParentSortId);
            }
        } else {
            generateTextfield(newParentSortId);
        }
    };

    /**
     * Toggles an item in and out of deleting. Changing the delete status of 
     * any item in the list will reset the timeouts for all deleting items. Items are deleted 3 seconds after clicked.
     * @param item - the item to delete
     */
    const toggleDeleteItem = (item: T) => {
        const wasDeleting = item.status === ItemStatus.DELETE;
        const updatedStatus = wasDeleting ? undefined : ItemStatus.DELETE;
        updateItem({ ...item, status: updatedStatus } as T);

        if (!wasDeleting) { // Item deletion being scheduled
            rescheduleAllDeletes();
            // Begin delete process of given item
            const timeoutId = setTimeout(async () => {
                deleteItem(item);
                pendingDeletes.current.delete(item.id);
            }, 3000);
            pendingDeletes.current.set(item.id, timeoutId);
        } else { // Item deletion being undone
            // Exit delete process of the item
            const timeoutId = pendingDeletes.current.get(item.id);
            if (timeoutId) {
                clearTimeout(timeoutId);
                pendingDeletes.current.delete(item.id);
            }
            // Re-schedule all existing deletes
            rescheduleAllDeletes();
        }
    };

    /**
     * Updates the given item.
     */
    const updateItem = (newItem: T, shiftTextfieldConfig?: string) => {
        setCurrent((curr) => {
            const newList = [...curr];

            // Replace the existing item with the new data
            const replaceIndex = newList.findIndex((item) =>
                item.id === newItem.id
            );
            if (replaceIndex !== -1) {
                newList[replaceIndex] = newItem;
            }

            // Shift the textfield up or down
            if (shiftTextfieldConfig) {
                const newParentSortId = shiftTextfieldConfig === ShiftTextfieldDirection.BELOW
                    ? newItem.sortId
                    : getParentSortId(newItem.id, newList);
                const newTextfield = initializeTextfield(newParentSortId, newList);
                const insertIndex = newList.findIndex(item => item.sortId > newParentSortId);
                insertIndex === -1 ?
                    newList.push(newTextfield) :
                    newList.splice(insertIndex, 0, newTextfield);
            }

            // Save this list to storage
            if (newItem.status === ItemStatus.STATIC && saveListToStorage) {
                saveListToStorage(newList.filter(item => item.status != ItemStatus.NEW));
            }
            newList.sort((a, b) => a.sortId - b.sortId);
            return newList;
        });
    };

    /**
     * Deletes the item from the list.
     */
    const deleteItem = (item: T) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);

            // Delete the item from the list
            if (deleteIndex !== -1)
                newList.splice(deleteIndex, 1);

            // Call the handler for deletes
            if (storageUpdates?.delete && item.status !== ItemStatus.NEW)
                storageUpdates.delete(item);

            // Save this list to storage
            if (saveListToStorage)
                saveListToStorage(newList);

            return newList;
        });
    };

    /**
     * Move the given item to its new location.
     */
    const moveItem = (item: T, newParentSortId: number) => {
        const newItem = {
            ...item,
            sortId: generateSortId(newParentSortId, current)
        };
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            if (newParentSortId === -1) {
                newList.unshift(newItem);
            } else {
                const insertIndex = newList.findIndex(currItem => currItem.sortId > newParentSortId);
                insertIndex === -1 ?
                    newList.push(newItem) :
                    newList.splice(insertIndex, 0, newItem);
            }
            // Save this list to storage
            if (saveListToStorage)
                saveListToStorage(newList);
            return newList;
        });
    };

    /**
     * Generates a textfield to edit an existing item.
     * 
     * 1. The item is deleting: do nothing and exit
     * 
     * 2. A textfield exists: save the textfield, then
     * 
     * 3. Turn the item into a textfield
     * 
     * @param item - the item that was clicked
     */
    const beginEditItem = async (item: ListItem) => {
        if (item.status === ItemStatus.DELETE)
            return;
        if (getFocusedItem())
            saveTextfield();

        updateItem({ ...item, status: ItemStatus.EDIT } as T);
    };

    /**
     * Initializes the item at the given index to be dragged.
     */
    const beginDragItem = (index: number) => updateItem({ ...current[index], status: ItemStatus.DRAG });

    /**
     * Moves the item to its new location.
     */
    const endDragItem = ({ data, from, to }: { data: T[]; from: number; to: number }) => {
        const draggedItem = data[to];
        draggedItem.status === ItemStatus.STATIC;
        if (from !== to) {
            const newParentSortId = to > 0 ?
                data[to - 1]?.sortId :
                -1
            moveItem(draggedItem, newParentSortId);
        } else {
            updateItem(draggedItem);
        }
    };

    const beginTransferItem = (item: T) =>
        updateItem({ ...item, status: ItemStatus.TRANSFER });

    return {
        current,
        updateItem,
        deleteItem,
        moveItem,
        getFocusedItem,
        getItemById,
        beginDragItem,
        endDragItem,
        saveTextfield,
        moveTextfield,
        beginEditItem,
        toggleDeleteItem,
        rescheduleAllDeletes,
        beginTransferItem
    };
};

export default useSortedList;
