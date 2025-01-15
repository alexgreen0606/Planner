import { useRef } from 'react';
import { ListItem } from '../types';
import { ItemStatus, ShiftTextfieldDirection } from '../enums';
import uuid from 'react-native-uuid';
import { generateSortId } from '../utils';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

interface StorageHandlers<T extends ListItem> {
    update: (item: T) => Promise<void> | void;
    create: (item: T) => Promise<void> | void;
    delete: (item: T) => Promise<void> | void;
}

// TODO: if no storage update exists, THEN save the items directly in this hook

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
const useSortedList = <T extends ListItem, S>(
    storageKey: string,
    storageId: string,
    getItemsFromStorageObject: (storageObject: S) => T[],
    saveItemsToStorageObject: (items: T[], currentObject: S) => S,
    initializeNewItem?: (newItem: T) => T,
    customStorageHandlers?: StorageHandlers<T>
) => {
    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const items: T[] = storageObject ? getItemsFromStorageObject(storageObject) : [];
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Save the items to storage
    const saveItems = (newItems: T[]) => storageObject ? setStorageObject(saveItemsToStorageObject(newItems, storageObject)) : null;

    // Returns the current textfield in the list if one exists
    const getFocusedItem = (): T | undefined =>
        items.find(item => item.status && [ItemStatus.EDIT, ItemStatus.NEW, ItemStatus.TRANSFER].includes(item.status));

    // Returns the item with the given ID if one exists
    const getItemById = (id: string) =>
        items.find(item => item.id === id);

    // Returns the sort ID of the item above the given item
    const getParentSortId = (id: string, customList?: T[]) => {
        const itemIndex = (customList ?? items).findIndex(item => item.id === id);
        return items[itemIndex - 1]?.sortId || -1;
    };

    // Generates a new textfield item and initializes it as needed
    const initializeTextfield = (parentSortId: number, customList?: T[]): T => {
        let newTextfield = {
            id: uuid.v4(),
            sortId: generateSortId(parentSortId, customList ?? items),
            value: '',
            status: ItemStatus.NEW,
        } as T
        if (initializeNewItem)
            newTextfield = initializeNewItem(newTextfield);
        return newTextfield;
    };

    /**
     * Adds a new textfield to the list just under the given sort ID.
     * @param parentSortId 
     */
    const addTextfield = (parentSortId: number): T[] => {
        const newItem = initializeTextfield(parentSortId);
        const newList = [...items, newItem];

        if (customStorageHandlers) {
            customStorageHandlers.create(newItem);
        } else {
            saveItems(newList);
        }
        return newList;
    };

    /**
     * Saves the focused item to the list. Updates the storage if needed.
     * @param shiftTextfieldConfig - determines if the textfield should shift above or below the new item
     */
    const saveTextfield = (shiftTextfieldConfig?: string, newTextfieldParentSortId?: number) => {
        let focusedItem = getFocusedItem();
        if (!focusedItem) return items;

        // Field contains text -> save it
        if (!!focusedItem.value.trim().length) {
            focusedItem.status = ItemStatus.STATIC;
            updateItem(focusedItem, shiftTextfieldConfig, newTextfieldParentSortId);
            // Field is empty -> delete it
        } else {
            deleteItem(focusedItem);
        }
    };

    /**
     * Generates a textfield to create a new item.
     * @param newParentSortId - the sort ID of the item the textfield should be below
     */
    const createOrMoveTextfield = async (newParentSortId: number | null) => {
        if (newParentSortId === null) return items;
        const focusedItem = getFocusedItem();

        // An item is being modified -> save it and shift textfield
        if (focusedItem) {

            // The new textfield will be below the focused item
            if (newParentSortId === focusedItem.sortId) {

                // Save the focused item if data exists and shift the textfield below
                if (focusedItem.value.trim().length) {
                    saveTextfield(ShiftTextfieldDirection.BELOW);
                } else {
                    return items;
                }

                // The new textfield will be above the current item
            } else if (newParentSortId === getParentSortId(focusedItem.id)) {

                // Save the focused item if data exists and shift the textfield above
                if (focusedItem.value.trim().length) {
                    saveTextfield(ShiftTextfieldDirection.ABOVE)
                } else {
                    return items;
                }

                // Otherwise save the focused item and create a new textfield under the parent
            } else {
                saveTextfield(undefined, newParentSortId);
            }

            // No item was focused -> add a new textfield
        } else {
            addTextfield(newParentSortId);
        }
    };

    /**
     * Updates an item in the list. If needed, the textfield will also be shifted.
     * @param newItem 
     * @param shiftTextfieldConfig 
     */
    const updateItem = (newItem: T, shiftTextfieldConfig?: string, newTextfieldParentSortId?: number) => {
        const newList = [...items];

        // Replace the existing item with the new data
        const replaceIndex = newList.findIndex((item) =>
            item.id === newItem.id
        );
        if (replaceIndex !== -1)
            newList[replaceIndex] = newItem;

        if (customStorageHandlers) {
            customStorageHandlers.update(newItem);
        } else {
            saveItems(newList); // needed to get the list's new data
        }

        // Create a new textfield if needed
        if (shiftTextfieldConfig || newTextfieldParentSortId) {
            const newParentSortId = shiftTextfieldConfig ? (
                shiftTextfieldConfig === ShiftTextfieldDirection.BELOW
                    ? newItem.sortId
                    : getParentSortId(newItem.id, newList)
            ) : newTextfieldParentSortId!;
            addTextfield(newParentSortId)
        }
    };

    /**
     * Deletes an item from the list.
     * @param item 
     */
    const deleteItem = (item: T) => {
        const newList = [...items];

        // Delete the item from the list
        const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);
        if (deleteIndex !== -1)
            newList.splice(deleteIndex, 1);

        // Execute delete side effects
        if (customStorageHandlers?.delete) {
            customStorageHandlers.delete(item);
        } else {
            saveItems(newList);
        }
    };

    /**
     * TODO: don't need. Just use delete and update. Moves an item to a new location.
     * @param item 
     * @param newParentSortId 
     */
    // const moveItem = (item: T, newParentSortId: number): T[] => {
    //     const newItem = {
    //         ...item,
    //         sortId: generateSortId(newParentSortId, items)
    //     };
    //     const newList = [...items];

    //     // Delete the current item from the list
    //     const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);
    //     if (deleteIndex !== -1) {
    //         newList.splice(deleteIndex, 1);
    //     }
    //     newList.push(newItem);

    //     saveItems(newList);
    //     return newList;
    // };

    /**
     * Initialize an item to be editted.
     * @param item - the item to edit
     */
    const beginEditItem = async (item: ListItem) => {

        // The item is deleting, so do nothing
        if (item.status === ItemStatus.DELETE)
            return items;

        // The item is already in edit, so do nothing
        const focusedItem = getFocusedItem();
        if (focusedItem?.id === item.id)
            return items;

        // There is another item in edit, so save it
        else if (focusedItem)
            saveTextfield();

        // Turn the item into a textfield
        updateItem({ ...item, status: ItemStatus.EDIT } as T);
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
     * Toggles an item in and out of deleting. Changing the delete status of 
     * any item in the list will reset the timeouts for all deleting items. Items are fully deleted
     * after 3 seconds.
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
     * Initialize the item at the given index to be dragged.
     * @param index 
     */
    const beginDragItem = (index: number) => updateItem({ ...items[index], status: ItemStatus.DRAG });

    /**
     * Handles dropping an item in a new location.
     * @param param0 - the item data, its old location, and its new location
     */
    const endDragItem = (item: T, newParentSortId: number) => {
        item.sortId = generateSortId(newParentSortId, items);
        updateItem(item);
    };

    /**
     * TODO: move to folder component Initialize the item to be transferred.
     * @param item - the item to transfer
     */
    // const beginTransferItem = (item: T) => updateItem({ ...item, status: ItemStatus.TRANSFER });

    return {
        items,
        updateItem,
        deleteItem,
        // moveItem,
        getFocusedItem,
        getItemById,
        beginDragItem,
        endDragItem,
        saveTextfield,
        createOrMoveTextfield,
        beginEditItem,
        toggleDeleteItem,
        rescheduleAllDeletes,
        // beginTransferItem
    };
};

export default useSortedList;
