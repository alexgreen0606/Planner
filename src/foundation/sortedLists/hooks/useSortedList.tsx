import { useRef, useState } from 'react';
import { ListItem } from '../types';
import { ItemStatus, ShiftTextfieldDirection, TOP_OF_LIST_ID } from '../enums';
import uuid from 'react-native-uuid';

interface StorageUpdateConfig<T> {
    create: (data: T) => void;
    update: (data: T, newParentId?: string) => void;
    delete: (data: T) => void;
}

/**
 * Maintains a sorted list of items.
 * 
 * @param initialItems - sorted by sort ID ascending
 */
const useSortedList = <T extends ListItem>(
    initialItems: T[],
    saveListToStorage: (newList: T[]) => void,
    emptyItem?: Partial<T>,
    storageUpdates?: StorageUpdateConfig<T>
) => {
    const [current, setCurrent] = useState<T[]>(initialItems);
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Generates a new textfield item.
    const initializeTextfield = (): T => ({
        ...emptyItem,
        id: uuid.v4(),
        value: '',
        status: ItemStatus.NEW,
    } as T)

    // Returns the current textfield in the list if one exists.
    const getFocusedItem = (): T | undefined =>
        current.find(item => item.status && [ItemStatus.EDIT, ItemStatus.NEW, ItemStatus.TRANSFER].includes(item.status));

    // Returns the item with the given ID if one exists.
    const getItemById = (id: string) =>
        current.find(item => item.id === id);

    // Returns the sort ID of the item above the given item.
    const getParentId = (id: string) => {
        const itemIndex = current.findIndex(item => item.id === id);
        return current[itemIndex - 1]?.id || TOP_OF_LIST_ID;
    }

    /**
     * Adds a new textfield just under the given sort ID.
     */
    const generateTextfield = (parentId: string) => {
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
     * @param parentId - the ID of the item the textfield should be below
     */
    const moveTextfield = (parentId: string | null) => {
        if (!parentId) return;
        const currentItem = getFocusedItem();
        if (currentItem) {
            if (parentId === currentItem.id) {
                if (currentItem.value.trim().length) {
                    saveTextfield(ShiftTextfieldDirection.BELOW);
                } else {
                    return;
                }
            } else if (parentId === getParentId(currentItem.id)) {
                if (currentItem.value.trim().length) {
                    saveTextfield(ShiftTextfieldDirection.ABOVE)
                } else {
                    return;
                }
            } else {
                moveItem(getFocusedItem() as T, parentId);
            }
        } else {
            generateTextfield(parentId);
        }
    };

    /**
     * Saves the data entered in the current textfield to the list.
     * 
     * @param shiftTextfieldConfig - determines if the textfield should shift above or below the new item
     */
    const saveTextfield = async (shiftTextfieldConfig?: string) => {

        // Get the item to be saved
        const currentItem = getFocusedItem();
        if (!currentItem?.status) return;

        // Get the storage call to use
        const storageCall = !!storageUpdates ? (
            currentItem.status === ItemStatus.NEW ? storageUpdates.create :
                currentItem.status === ItemStatus.EDIT ? storageUpdates.update : undefined) : undefined;

        if (!!currentItem.value.trim().length) { // the field contains text

            // Execute the save
            delete currentItem.status
            if (storageCall) storageCall(currentItem);
            updateItem(currentItem);

            if (shiftTextfieldConfig) { // shift the textfield up or down
                const newParentId = shiftTextfieldConfig === ShiftTextfieldDirection.BELOW
                    ? currentItem.id
                    : getParentId(currentItem.id);
                generateTextfield(newParentId); // TODO: verify this works
            }
        } else { // the field is empty
            if (currentItem.status === ItemStatus.EDIT && storageUpdates?.delete) {
                storageUpdates.delete(currentItem);
            }
            deleteItem(currentItem);
        }
    };

    /**
     * Clears any pending deletes and re-schedules them 3 seconds into the future.
     */
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
    const updateItem = (newItem: T) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const replaceIndex = newList.findIndex((item) =>
                item.id === newItem.id
            );
            if (replaceIndex !== -1) {
                newList[replaceIndex] = newItem;
            }
            // saveList(newList);
            return newList;
        });
    };

    /**
     * Deletes the item from the list.
     */
    const deleteItem = (item: T, itemTransfered?: boolean) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            saveList(newList);
            return newList;
        });
        if (!itemTransfered && storageUpdates?.delete) {
            storageUpdates.delete(item);
        }
    };

    /**
     * Move the given item to its new location.
     */
    const moveItem = (item: T, newParentId: string) => {
        setCurrent((curr) => {
            const newList = [...curr];
            const deleteIndex = newList.findIndex((item) => item.id === item.id);
            if (deleteIndex !== -1) {
                newList.splice(deleteIndex, 1);
            }
            if (newParentId === TOP_OF_LIST_ID) {
                newList.unshift(item);
            } else {
                const insertIndex = newList.findIndex(item => item.id === newParentId);
                insertIndex === -1 ?
                    newList.push(item) :
                    newList.splice(insertIndex + 1, 0, item);
            }
            saveList(newList);
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
        delete draggedItem.status;
        if (from !== to) {
            const newParentId = to > 0 ?
                data[to - 1]?.id :
                TOP_OF_LIST_ID
            moveItem(draggedItem, newParentId);
        }
        updateItem(draggedItem);
    };

    const beginTransferItem = (item: T) => 
        updateItem({ ...item, status: ItemStatus.TRANSFER });

    /**
     * Save the given list to storage. Filters out the textfield and all statuses.
     */
    const saveList = (newList: T[]) =>
        saveListToStorage(
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
        getFocusedItem,
        generateTextfield,
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
