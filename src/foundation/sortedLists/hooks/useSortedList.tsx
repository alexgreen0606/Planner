import { isItemDeleting } from '../utils';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useSortableListContext } from '../services/SortableListProvider';
import { useEffect, useState } from 'react';
import { ItemStatus, ListItem } from '../types';

type StorageHandlers<T extends ListItem> = {
    update: (item: T) => Promise<void> | void;
    create: (item: T) => Promise<void> | void;
    delete: (item: T) => Promise<void> | void;
};

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
    getItemsFromStorageObject?: (storageObject: S) => Promise<T[]> | T[],
    setItemsInStorageObject?: (items: T[], currentObject: S) => S,
    storageConfig?: StorageHandlers<T>
) => {
    const { currentTextfield, setCurrentTextfield, pendingDeletes, loadingData, endLoadingData } = useSortableListContext();
    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const [items, setItems] = useState<T[]>([]);
    const buildList = async () => {
        const fetchedItems = await getItemsFromStorageObject?.(storageObject ?? [] as S);
        setItems(fetchedItems ?? storageObject as T[] ?? []);
        endLoadingData();
    };

    // Build the list from the storage object
    useEffect(() => {
        buildList();
    }, [storageObject]);

    // Rebuild the list when the user overscrolls
    useEffect(() => {
        if (loadingData) {
            buildList();
        }
    }, [loadingData]);

    /**
     * Toggles an item between a textfield and static.
     * If another textfield exists, it will be saved first.
     */
    async function toggleItemEdit(item: T) {
        if (item.status === ItemStatus.DELETE) return;
        const togglingItem = currentTextfield?.id === item.id;
        if (currentTextfield && currentTextfield.value.trim() !== '') {
            await persistItemToStorage({ ...currentTextfield, status: ItemStatus.STATIC });
        }
        if (!togglingItem) {
            setCurrentTextfield({ ...item, status: ItemStatus.EDIT });
        } else {
            setCurrentTextfield(undefined);
        }

    };

    /**
     * Updates or creates an item in storage.
     * @returns - true if the item still exists in the list, else false
     */
    async function persistItemToStorage(item: T) {
        if (storageConfig) {

            // Handle the storage update directly
            if (item.status === ItemStatus.NEW) {
                await storageConfig.create(item);
            } else {
                await storageConfig.update(item);
            }
        } else {

            // Update the list with the new item and save
            const updatedList = [...items];
            const replaceIndex = updatedList.findIndex((existingItem) =>
                existingItem.id === item.id
            );
            if (replaceIndex !== -1) {
                updatedList[replaceIndex] = item;
            } else {
                updatedList.push(item);
            }
            const objectToSave = setItemsInStorageObject && storageObject ? setItemsInStorageObject(updatedList, { ...storageObject }) : updatedList;
            setStorageObject(objectToSave as S);
        }
    };

    /**
     * Deletes an item from storage.
     */
    async function deleteItemFromStorage(item: T) {
        if (storageConfig)

            // Handle the storage delete directly
            await storageConfig.delete(item);
        else {

            // Remove the item from the list and save
            const updatedList = [...items].filter(existingItem => existingItem.status !== ItemStatus.DELETE || existingItem.id === item.id);
            const deleteIndex = updatedList.findIndex(existingItem => existingItem.id === item.id);
            if (deleteIndex !== -1) {
                updatedList.splice(deleteIndex, 1);
            } else {
                return;
            }
            const objectToSave = setItemsInStorageObject && storageObject ? setItemsInStorageObject(updatedList, storageObject) : updatedList;
            setStorageObject(objectToSave as S);
        }
    };

    /**
     * Clears any pending deletes and re-schedules them 3 seconds into the future.
     */
    function rescheduleAllDeletes() {
        pendingDeletes.current.forEach((pendingDelete, id) => {
            clearTimeout(pendingDelete.timeout);
            const timeout = setTimeout(() => {
                deleteItemFromStorage(pendingDelete.item);
                pendingDeletes.current.delete(id);
            }, 3000);
            pendingDeletes.current.set(id, { timeout, item: pendingDelete.item });
        });
    };

    /**
     * Toggles an item in and out of deleting.
     * Changing the delete status of any item will reset the timeouts for all deleting items. Items are fully 
     * deleted after 3 seconds.
     */
    async function toggleItemDelete(item: T) {

        // Handle textfield delete
        if (item.id === currentTextfield?.id) {
            setCurrentTextfield(undefined);
            if (item.value.trim() === '') {
                deleteItemFromStorage(item);
                return;
            }
        }
        const updatedStatus = isItemDeleting(item) ? ItemStatus.STATIC : ItemStatus.DELETE;
        if (updatedStatus === ItemStatus.DELETE) {

            // Schedule item delete
            const timeout = setTimeout(() => {
                deleteItemFromStorage(item);
                pendingDeletes.current.delete(item.id);
            }, 3000);
            pendingDeletes.current.set(item.id, { timeout, item });
        } else {

            // Unschedule item delete
            const pendingDelete = pendingDeletes.current.get(item.id);
            if (pendingDelete) {
                clearTimeout(pendingDelete.timeout);
                pendingDeletes.current.delete(item.id);
            }
        }
        rescheduleAllDeletes();
        await persistItemToStorage({ ...item, status: updatedStatus });
    };

    return {
        items,
        refetchItems: buildList,
        persistItemToStorage,
        toggleItemDelete,
        rescheduleAllDeletes,
        toggleItemEdit,
        deleteItemFromStorage
    };
};

export default useSortedList;
