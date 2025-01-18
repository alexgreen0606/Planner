import { useRef } from 'react';
import { ItemStatus, ListItem } from '../utils';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

export enum StorageConfigType {
    HANDLERS = "HANDLERS",
    DIRECT = "DIRECT",
};

export enum HandlerType {
    SYNC = "SYNC",
    ASYNC = "ASYNC",
};

interface StorageHandlers<T extends ListItem> {
    type: HandlerType;
    update: HandlerType extends HandlerType.ASYNC ? (item: T) => Promise<void> : (item: T) => void;
    create: HandlerType extends HandlerType.ASYNC ? (item: T) => Promise<void> : (item: T) => void;
    delete: HandlerType extends HandlerType.ASYNC ? (item: T) => Promise<void> : (item: T) => void;
};

interface StorageSaveOptions<S, T extends ListItem> {
    type: StorageConfigType.DIRECT;
    saveItemsToStorageObject: (items: T[], currentObject: S) => S;
};

interface CustomStorageHandlers<T extends ListItem> {
    type: StorageConfigType.HANDLERS;
    handlerType: HandlerType;
    customStorageHandlers: StorageHandlers<T>;
};

type StorageConfig<S, T extends ListItem> =
    | StorageSaveOptions<S, T>
    | CustomStorageHandlers<T>;

/**
 * Maintains a list of sorted items.
 * @param storageKey - key of the object holding the list in storage
 * @param storageId - ID of storage holding the list
 * @param getItemsFromStorageObject - helper function to retrieve the list from the storage object
 * @param saveItemsToStorageObject - helper function to add the list back to the storage object
 * @param initializeNewItem - helper function to initialize a new item in the list
 * @param customStorageHandlers - for lists representing other storage objects, these helper functions will handle
 *  saving the updated values to storage
 */
const useSortedList = <T extends ListItem, S>(
    storageKey: string,
    storageId: string,
    getItemsFromStorageObject: (storageObject: S) => T[],
    storageConfig: StorageConfig<S, T>
) => {
    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const items: T[] = storageObject ? getItemsFromStorageObject(storageObject) : [];
    const saveItems = (newItems: T[]) =>
        storageObject && storageConfig.type === StorageConfigType.DIRECT ?
            setStorageObject(storageConfig.saveItemsToStorageObject(newItems, storageObject)) : null;
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

    /**
     * Fetches the current textfield in the list.
     * @returns - focused item, otherwise undefined
     */
    const getFocusedItem = (): T | undefined => {
        return items.find(item => [ItemStatus.EDIT, ItemStatus.NEW, ItemStatus.TRANSFER].includes(item.status));
    };

    /**
     * Saves the textfield item to the list.
     * @param shiftTextfieldConfig - shifts the textfield above or below the saved item
     * @param newTextfieldParentSortId - sort ID above where the new textfield should be
     */
    const saveTextfield = async (item?: T, shiftTextfieldConfig?: string, newTextfieldParentSortId?: number) => {
        const focusedItem = item ?? getFocusedItem();
        if (!focusedItem) return;

        if (focusedItem.value !== '') {
            // Save the item
            await updateItem({ ...focusedItem, status: ItemStatus.STATIC }, shiftTextfieldConfig, newTextfieldParentSortId);
        } else {
            // Delete the empty item
            await deleteItem(focusedItem);
        }
    };

    /**
     * Updates an item in the list. If needed, the textfield will also be moved.
     * @param newItem - new data to save
     * @param shiftTextfieldConfig - shifts the textfield above or below the updated item
     * @param newTextfieldParentSortId - sort ID above where the new textfield should be
     */
    const updateItem = async (newItem: T, shiftTextfieldConfig?: string, newTextfieldParentSortId?: number) => {
        const newList = [...items];

        // Replace the existing item with the new data
        const replaceIndex = newList.findIndex((item) =>
            item.id === newItem.id
        );
        if (replaceIndex !== -1)
            newList[replaceIndex] = newItem;

        // Save the list
        if (storageConfig.type === StorageConfigType.HANDLERS) {
            await storageConfig.customStorageHandlers.update(newItem);
        } else {
            saveItems(newList);
        }
    };

    /**
     * Deletes an item from the list.
     * @param item - item to delete
     */
    const deleteItem = async (item: T) => {
        const newList = [...items];

        // Delete the item from the list
        const deleteIndex = newList.findIndex(currItem => currItem.id === item.id);
        if (deleteIndex !== -1)
            newList.splice(deleteIndex, 1);

        // Save the list
        if (storageConfig.type === StorageConfigType.HANDLERS) {
            await storageConfig.customStorageHandlers.delete(item);
        } else {
            saveItems(newList);
        }
    };

    /**
     * Clear any pending deletes and re-schedules them 3 seconds into the future.
     */
    const rescheduleAllDeletes = () => {
        pendingDeletes.current.forEach((timeoutId, id) => {
            clearTimeout(timeoutId);
            const newTimeoutId = setTimeout(() => {
                const currentItem = items.find(item => item.id === id);
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
     * @param item - item to toggle
     */
    const toggleDeleteItem = async (item: T) => {
        const wasDeleting = item.status === ItemStatus.DELETE;
        const updatedStatus = wasDeleting ? ItemStatus.STATIC : ItemStatus.DELETE;
        await updateItem({ ...item, status: updatedStatus });

        if (!wasDeleting) {
            // Schedule item delete
            const timeoutId = setTimeout(() => {
                deleteItem(item);
                pendingDeletes.current.delete(item.id);
            }, 3000);
            pendingDeletes.current.set(item.id, timeoutId);
            rescheduleAllDeletes();
        } else {
            // Unschedule item delete
            const timeoutId = pendingDeletes.current.get(item.id);
            if (timeoutId) {
                clearTimeout(timeoutId);
                pendingDeletes.current.delete(item.id);
            }
            rescheduleAllDeletes();
        }
    };

    return {
        items,
        updateItem,
        getFocusedItem,
        saveTextfield,
        toggleDeleteItem,
        rescheduleAllDeletes,
    };
};

export default useSortedList;
