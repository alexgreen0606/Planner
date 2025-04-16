import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useSortableList } from '../services/SortableListProvider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ListItem } from '../types';
import { ItemStatus } from '../constants';
import { useDeleteScheduler } from '../services/DeleteScheduler';
import { useNavigation } from '../../navigation/services/NavigationProvider';

type StorageHandlers<T extends ListItem> = {
    update: (item: T) => Promise<void> | void;
    create: (item: T) => Promise<void> | void | Promise<string | undefined>;
    delete: (items: T[]) => Promise<void> | void;
};

interface SortedListConfig<T extends ListItem, S> {
    storageId: string;
    storageKey: string;
    getItemsFromStorageObject?: (storageObject: S) => Promise<T[]> | T[];
    setItemsInStorageObject?: (items: T[], currentObject: S) => S;
    storageConfig?: StorageHandlers<T>;
    noReload?: boolean;
}

const useSortedList = <T extends ListItem, S>(config: SortedListConfig<T, S>) => {

    const {
        storageKey,
        storageId,
        getItemsFromStorageObject,
        setItemsInStorageObject,
        storageConfig,
        noReload
    } = config;

    const {
        currentTextfield,
        setCurrentTextfield,
    } = useSortableList();

    const {
        pendingDeleteItems,
        setPendingDeleteItems,
        scheduledDeletionItems,
        isItemDeleting
    } = useDeleteScheduler();

    const { registerReloadFunction } = useNavigation();

    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const [items, setItems] = useState<T[]>([]);
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [deletePending, setDeletePending] = useState(false);

    const scheduledDeletions = useMemo(
        () => scheduledDeletionItems(storageKey),
        [scheduledDeletionItems]
    );

    const buildList = async () => {
        const fetchedItems = await getItemsFromStorageObject?.(storageObject ?? [] as S);
        setItems(fetchedItems ?? storageObject as T[] ?? []);
    };

    // Build the list whenever storage changes
    useEffect(() => {
        buildList();
    }, [storageObject]);

    useEffect(() => {
        if (!noReload) {
            registerReloadFunction(`${storageKey}-${storageId}`, buildList);
        }
    }, []);

    // Schedule items for deletion
    useEffect(() => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
        }

        if (pendingDeleteItems.length > 0) {
            deleteTimeoutRef.current = setTimeout(() => {
                setDeletePending(true);
            }, 3000);
        }
    }, [scheduledDeletions]);

    // Execute item deletion
    useEffect(() => {
        if (deletePending) {
            deleteItemsFromStorage([...scheduledDeletions as T[]]);
            setDeletePending(false);
        }
    }, [deletePending]);

    /**
     * Updates or creates an item in storage.
     * @returns - true if the item still exists in the list, else false
     */
    async function persistItemToStorage(item: T) {
        if (storageConfig) {

            // Handle the storage update directly
            if (item.status === ItemStatus.NEW) {
                return await storageConfig.create(item);
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
     * Deletes a batch of items from storage.
     * For custom storage config, it calls delete on each item individually.
     * For standard storage, it filters out all items in a single operation.
     */
    async function deleteItemsFromStorage(itemsToDelete: T[]) {
        if (storageConfig) {
            await storageConfig.delete(itemsToDelete);
        } else {
            const updatedList = items.filter(({ id }) =>
                !itemsToDelete.some(item => item.id === id)
            );

            setStorageObject(
                setItemsInStorageObject && storageObject
                    ? setItemsInStorageObject(updatedList, storageObject)
                    : updatedList as S
            );
        }
    }

    /**
     * Toggles an item between a textfield and static.
     * If another textfield exists, it will be saved first.
     */
    async function toggleItemEdit(item: T) {
        if (isItemDeleting(item)) return;
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
     * Toggles an item in and out of deleting state.
     * Adds or removes the item from the pendingDeleteItems array.
     */
    async function toggleItemDelete(item: T) {
        // Handle textfield delete
        if (item.id === currentTextfield?.id) {
            setCurrentTextfield(undefined);
            if (item.value.trim() === '') {
                deleteSingleItemFromStorage(item);
                return;
            }
        }

        // Check if item is already in the pending delete array
        const itemIndex = pendingDeleteItems.findIndex(deleteItem => deleteItem.id === item.id);
        const isDeleting = itemIndex !== -1;

        setPendingDeleteItems(prevItems => {
            if (isDeleting) {
                // Remove item from pending delete array
                return prevItems.filter(deleteItem => deleteItem.id !== item.id);
            } else {
                // Add item to pending delete array
                return [...prevItems, item];
            }
        });
    }

    /**
     * Deletes a single item from storage.
     * Uses the batch function with a single item.
     */
    async function deleteSingleItemFromStorage(item: T) {
        await deleteItemsFromStorage([item]);
    }

    return {
        items,
        refetchItems: buildList,
        persistItemToStorage,
        toggleItemDelete,
        toggleItemEdit,
        deleteSingleItemFromStorage,
    };
};

export default useSortedList;
