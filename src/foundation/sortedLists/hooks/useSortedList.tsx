import { useEffect, useRef, useState } from 'react';
import { ListItem } from '../types';
import { ItemStatus, ListStorageMode, ShiftTextfieldDirection } from '../enums';
import uuid from 'react-native-uuid';
import { generateSortId } from '../utils';

type UseSortedListParams<T extends ListItem> = {
    storageMode: ListStorageMode;
    initializeNewItem?: (newItem: T) => T;
} & (
        | {
            storageMode: ListStorageMode.FULL_SYNC;
            saveListToStorage: (newList: T[]) => void;
        }
        | {
            storageMode: ListStorageMode.ITEM_SYNC;
            storageUpdates: {
                create: (data: T) => Promise<T> | T;
                update: (data: T, newParentId?: string) => Promise<T> | T;
                delete: (data: T) => void;
            };
        }
        | {
            storageMode: ListStorageMode.CUSTOM_SYNC;
        }
    );

/**
 * Maintains a sorted list of items.
 * There a 3 modes of saving the list to storage:
 * 
 *  - FULL SYNC: the storage is updated with the full list, sorted by this hook
 *  - ITEM SYNC: the storage is updated with individual items as they are modified, and sorted manually
 *  - CUSTOM SYNC: the list is updated manually by an external component, sorted by this hook
 * 
 * @param initialItems - sorted by sort ID ascending
 */
const useSortedList = <T extends ListItem>(
    initialItems: T[],
    options: UseSortedListParams<T>,
) => {
    const [current, setCurrent] = useState<T[]>([]);
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // ITEM SYNC MODE: Keeps this sorted list in sync with storage
    useEffect(() => {
        setCurrent(initialItems);
    }, [initialItems]);

    // Generates a new textfield item and initializes it as needed
    const initializeTextfield = (parentSortId: number, customList?: T[]): T => {
        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, customList ?? current),
            value: '',
            status: ItemStatus.NEW,
        } as T
        if (options.initializeNewItem)
            newTextfield = options.initializeNewItem(newTextfield);
        return newTextfield;
    };

    // Returns the current textfield in the list if one exists
    const getFocusedItem = (): T | undefined =>
        current.find(item => item.status && [ItemStatus.EDIT, ItemStatus.NEW, ItemStatus.TRANSFER].includes(item.status));

    // Returns the item with the given ID if one exists
    const getItemById = (id: string) =>
        current.find(item => item.id === id);

    // Returns the sort ID of the item above the given item
    const getParentSortId = (id: string, customList?: T[]) => {
        const itemIndex = (customList ?? current).findIndex(item => item.id === id);
        return current[itemIndex - 1]?.sortId || -1;
    };

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
    };

    /**
     * Adds a new textfield to the textfield just under the given sort ID.
     * @param parentSortId 
     */
    const addTextfield = (parentSortId: number): T[] => {
        let updatedList: T[] = [];
        const newTextfield = initializeTextfield(parentSortId);
        setCurrent(curr => {
            const newList = [...curr];
            const insertIndex = newList.findIndex(item => item.sortId > parentSortId);
            insertIndex === -1 ?
                newList.push(newTextfield) :
                newList.splice(insertIndex, 0, newTextfield);
            updatedList = newList;
            return newList;
        });
        return updatedList;
    };

    /**
     * Saves the focused item to the list. Updates the storage if needed.
     * @param shiftTextfieldConfig - determines if the textfield should shift above or below the new item
     */
    const saveTextfield = async (shiftTextfieldConfig?: string, newTextfieldParentSortId?: number): Promise<T[]> => {
        let focusedItem = getFocusedItem();
        if (!focusedItem) return current;

        if (!!focusedItem.value.trim().length) { // the field contains text -> save it

            // ITEM SYNC MODE: Execute the storage update for this list
            if (options.storageMode === ListStorageMode.ITEM_SYNC) {
                focusedItem.status === ItemStatus.EDIT ?
                    await options.storageUpdates.update({ ...focusedItem, status: ItemStatus.STATIC }) :
                    await options.storageUpdates.create({ ...focusedItem, status: ItemStatus.STATIC });
            }
            focusedItem.status = ItemStatus.STATIC;

            // Execute the local update for this list
            return updateItem(focusedItem, shiftTextfieldConfig, newTextfieldParentSortId);

        } else { // the field is empty -> delete it
            return deleteItem(focusedItem);
        }
    };

    /**
     * Generates a textfield to create a new item.
     * @param newParentSortId - the sort ID of the item the textfield should be below
     */
    const createOrMoveTextfield = async (newParentSortId: number | null): Promise<T[]> => {
        if (newParentSortId === null) return current;
        const focusedItem = getFocusedItem();

        // An item is being modified -> save it and shift textfield
        if (focusedItem) {

            // The new textfield will be below the focused item
            if (newParentSortId === focusedItem.sortId) {

                // Save the focused item if data exists and shift the textfield below
                if (focusedItem.value.trim().length) {
                    return await saveTextfield(ShiftTextfieldDirection.BELOW);
                } else {
                    return current;
                }

                // The new textfield will be above the current item
            } else if (newParentSortId === getParentSortId(focusedItem.id)) {

                // Save the focused item if data exists and shift the textfield above
                if (focusedItem.value.trim().length) {
                    return await saveTextfield(ShiftTextfieldDirection.ABOVE)
                } else {
                    return current;
                }

                // Otherwise save the focused item and create a new textfield under the parent
            } else {
                return await saveTextfield(undefined, newParentSortId);
            }

            // No item was focused -> add a new textfield
        } else {
            return addTextfield(newParentSortId);
        }
    };

    /**
     * Toggles an item in and out of deleting. Changing the delete status of 
     * any item in the list will reset the timeouts for all deleting items. Items are fully deleted
     * after 3 seconds.
     * @param item - the item to delete
     */
    const toggleDeleteItem = (item: T): T[] => {
        const wasDeleting = item.status === ItemStatus.DELETE;
        const updatedStatus = wasDeleting ? undefined : ItemStatus.DELETE;
        const updatedList = updateItem({ ...item, status: updatedStatus } as T);

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

        return updatedList;
    };

    /**
     * Updates an item in the list. If needed, the textfield will also be shifted.
     * @param newItem 
     * @param shiftTextfieldConfig 
     */
    const updateItem = (newItem: T, shiftTextfieldConfig?: string, newTextfieldParentSortId?: number): T[] => {
        let updatedList: T[] = [];
        setCurrent((curr) => {
            const newList = [...curr];

            // Replace the existing item with the new data
            const replaceIndex = newList.findIndex((item) =>
                item.id === newItem.id
            );
            if (replaceIndex !== -1) {
                newList[replaceIndex] = newItem;
            }

            // Create a new textfield if needed
            if (shiftTextfieldConfig || newTextfieldParentSortId) {
                const newParentSortId = shiftTextfieldConfig ? (shiftTextfieldConfig === ShiftTextfieldDirection.BELOW
                    ? newItem.sortId
                    : getParentSortId(newItem.id, newList)) : newTextfieldParentSortId!;
                const newTextfield = initializeTextfield(newParentSortId, newList);
                const insertIndex = newList.findIndex(item => item.sortId > newParentSortId);
                insertIndex === -1 ?
                    newList.push(newTextfield) :
                    newList.splice(insertIndex, 0, newTextfield);
            }

            // FULL SYNC MODE: Save the updated list to storage
            if (newItem.status === ItemStatus.STATIC && options.storageMode === ListStorageMode.FULL_SYNC) {
                options.saveListToStorage(newList.filter(item => item.status != ItemStatus.NEW));
            }

            // Sort the list in case the new item's sort ID has changed
            newList.sort((a, b) => a.sortId - b.sortId);

            updatedList = newList;
            return newList;
        });
        return updatedList;
    };

    /**
     * Deletes an item from the list.
     * @param item 
     */
    const deleteItem = (item: T): T[] => {
        let updatedList: T[] = [];
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);

            // Delete the item from the list
            if (deleteIndex !== -1)
                newList.splice(deleteIndex, 1);

            // ITEM SYNC MODE: Call the handler for deletes
            if (options.storageMode === ListStorageMode.ITEM_SYNC && item.status !== ItemStatus.NEW)
                options.storageUpdates.delete(item);

            // FULL SYNC MODE: Save the updated list to storage
            if (options.storageMode === ListStorageMode.FULL_SYNC)
                options.saveListToStorage(newList);

            updatedList = newList;
            return newList;
        });
        return updatedList;
    };

    /**
     * Moves an item to a new location.
     * @param item 
     * @param newParentSortId 
     */
    const moveItem = (item: T, newParentSortId: number): T[] => {
        const newItem = {
            ...item,
            sortId: generateSortId(newParentSortId, current)
        };
        let updatedList: T[] = [];
        setCurrent((curr) => {
            const newList = [...curr];

            // Delete the current item from the list
            const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }

            // Add the new item to the list
            if (newParentSortId === -1) {
                newList.unshift(newItem);
            } else {
                const insertIndex = newList.findIndex(currItem => currItem.sortId > newParentSortId);
                insertIndex === -1 ?
                    newList.push(newItem) :
                    newList.splice(insertIndex, 0, newItem);
            }

            // FULL SYNC MODE: Save the updated list to storage
            if (options.storageMode === ListStorageMode.FULL_SYNC)
                options.saveListToStorage(newList);

            updatedList = [...newList];
            console.log(updatedList, 'updated')
            console.log(newList, 'new')
            return newList;
        });
        return updatedList;
    };

    /**
     * Initialize an item to be editted.
     * @param item - the item to edit
     */
    const beginEditItem = async (item: ListItem): Promise<T[]> => {

        // The item is deleting, so do nothing
        if (item.status === ItemStatus.DELETE)
            return current;

        // The item is already in edit, so do nothing
        const focusedItem = getFocusedItem();
        if (focusedItem?.id === item.id)
            return current;

        // There is another item in edit, so save it
        else if (focusedItem)
            return await saveTextfield();

        // Turn the item into a textfield
        return updateItem({ ...item, status: ItemStatus.EDIT } as T);
    };

    /**
     * Initialize the item at the given index to be dragged.
     * @param index 
     */
    const beginDragItem = (index: number): T[] => updateItem({ ...current[index], status: ItemStatus.DRAG });

    /**
     * Handles dropping an item in a new location.
     * @param param0 - the item data, its old location, and its new location
     */
    const endDragItem = ({ data, from, to }: { data: T[]; from: number; to: number }): T[] => {
        const draggedItem = data[to];
        draggedItem.status === ItemStatus.STATIC;
        if (from !== to) {
            const newParentSortId = to > 0 ?
                data[to - 1]?.sortId :
                -1
            return moveItem(draggedItem, newParentSortId);
        } else {
            return updateItem(draggedItem);
        }
    };

    /**
     * Initialize the item to be transferred.
     * @param item - the item to transfer
     */
    const beginTransferItem = (item: T): T[] => updateItem({ ...item, status: ItemStatus.TRANSFER });

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
        createOrMoveTextfield,
        beginEditItem,
        toggleDeleteItem,
        rescheduleAllDeletes,
        beginTransferItem
    };
};

export default useSortedList;
