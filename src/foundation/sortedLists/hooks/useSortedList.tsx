import { ItemStatus, ListItem } from '../utils';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useSortableListContext } from '../services/SortableListProvider';

export enum StorageConfigType {
    HANDLERS = "HANDLERS",
    DIRECT = "DIRECT",
};

interface StorageHandlers<T extends ListItem> {
    update: (item: T) => Promise<void> | void;
    create: (item: T) => Promise<void> | void;
    delete: (item: T) => Promise<void> | void;
};

interface StorageSaveOptions<S, T extends ListItem> {
    type: StorageConfigType.DIRECT;
    saveItemsToStorageObject: (items: T[], currentObject: S) => S;
};

interface CustomStorageHandlers<T extends ListItem> {
    type: StorageConfigType.HANDLERS;
    customStorageHandlers: StorageHandlers<T>;
};

type StorageConfig<S, T extends ListItem> =
    | StorageSaveOptions<S, T>
    | CustomStorageHandlers<T>;

/**
 * Maintains a list of sorted items.
 * @param storageKey - key of object holding the list in storage
 * @param storageId - ID of storage holding the list
 * @param getItemsFromStorageObject - helper function to retrieve the list from the storage object
 * @param storageConfig - determines how the list will be saved to storage
 */
const useSortedList = <T extends ListItem, S>(
    storageKey: string,
    storageId: string,
    getItemsFromStorageObject: (storageObject: S) => T[],
    storageConfig: StorageConfig<S, T>
) => {
    const { currentTextfield, setCurrentTextfield, pendingDeletes } = useSortableListContext();
    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const items: T[] = storageObject ? getItemsFromStorageObject(storageObject) : [];
    const saveItems = (newItems: T[]) =>
        storageObject && storageConfig.type === StorageConfigType.DIRECT ?
            setStorageObject(storageConfig.saveItemsToStorageObject(newItems, storageObject)) : null;

    /**
     * Converts an item into a textfield. If a textfield already exists, it will be saved first.
     */
    async function convertItemToTextfield(item: T) {
        if (item.status === ItemStatus.DELETE) return;
        else if (currentTextfield && currentTextfield.value.trim() !== '')
            await persistItemToStorage(currentTextfield);
        setCurrentTextfield({ ...item, status: ItemStatus.EDIT });
    };

    /**
     * Updates or creates an item in storage. The item will default to the textfield if no item is provided, and set its status back
     * to static.
     */
    async function persistItemToStorage(item: T | undefined) {
        const updatedItem = item ?? { ...currentTextfield, status: ItemStatus.STATIC };
        if (!updatedItem) return;

        if (storageConfig.type === StorageConfigType.HANDLERS) {
            // Handle the storage update directly
            if (updatedItem.status === ItemStatus.NEW) {
                await storageConfig.customStorageHandlers.create(updatedItem);
            } else {
                await storageConfig.customStorageHandlers.update(updatedItem);
            }
        } else {
            // Update the list with the new item and save
            const updatedList = [...items];
            const replaceIndex = updatedList.findIndex((existingItem) =>
                existingItem.id === updatedItem.id
            );
            if (replaceIndex !== -1) {
                updatedList[replaceIndex] = updatedItem;
            } else {
                updatedList.push(updatedItem);
            }
            saveItems(updatedList);
        }
    };

    /**
     * Deletes an item from storage. The item will default to the textfield if no item is provided.
     */
    async function deleteItemFromStorage(item: T | undefined) {
        const updatedItem = item ?? currentTextfield;
        if (!updatedItem) return;

        if (storageConfig.type === StorageConfigType.HANDLERS)
            // Handle the storage delete directly
            await storageConfig.customStorageHandlers.delete(updatedItem);
        else {
            // Remove the item from the list and save
            const updatedList = [...items];
            const deleteIndex = updatedList.findIndex(existingItem => existingItem.id === updatedItem.id);
            if (deleteIndex !== -1)
                updatedList.splice(deleteIndex, 1);
            saveItems(updatedList);
        }
    };

    /**
     * Clears any pending deletes and re-schedules them 3 seconds into the future.
     */
    function rescheduleAllDeletes() {
        pendingDeletes.current.forEach((timeoutId, id) => {
            clearTimeout(timeoutId);
            const newTimeoutId = setTimeout(() => {
                const currentItem = items.find(item => item.id === id);
                if (currentItem) {
                    deleteItemFromStorage(currentItem);
                    pendingDeletes.current.delete(id);
                }
            }, 3000);
            pendingDeletes.current.set(id, newTimeoutId);
        });
    };

    /**
     * Toggles an item in and out of deleting. The item will default to the textfield if no item is provided.
     * Changing the delete status of any item will reset the timeouts for all deleting items. Items are fully 
     * deleted after 3 seconds.
     */
    async function toggleDeleteItem(item: T) {
        const updatedStatus = item.status === ItemStatus.DELETE ? ItemStatus.STATIC : ItemStatus.DELETE;

        if (updatedStatus === ItemStatus.DELETE) {
            // Schedule item delete
            const timeoutId = setTimeout(() => {
                deleteItemFromStorage(item);
                pendingDeletes.current.delete(item.id);
            }, 3000);
            pendingDeletes.current.set(item.id, timeoutId);
        } else {
            // Unschedule item delete
            const timeoutId = pendingDeletes.current.get(item.id);
            if (timeoutId) {
                clearTimeout(timeoutId);
                pendingDeletes.current.delete(item.id);
            }
        }
        rescheduleAllDeletes();
        await persistItemToStorage({ ...item, status: updatedStatus });
    };

    return {
        items,
        persistItemToStorage,
        toggleDeleteItem,
        rescheduleAllDeletes,
        convertItemToTextfield,
        deleteItemFromStorage
    };
};

export default useSortedList;
