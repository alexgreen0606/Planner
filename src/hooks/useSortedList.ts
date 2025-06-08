import { EItemStatus } from '@/enums/EItemStatus';
import { IListItem } from '@/types/listItems/core/TListItem';
import { uuid } from 'expo-modules-core';
import { useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { generateSortId, sanitizeList } from '../utils/listUtils';
import { useReloadScheduler } from './useReloadScheduler';
import { useDeleteScheduler } from './useDeleteScheduler';
import { useScrollContainer } from '@/services/ScrollContainer';
import { useTextfieldItemAs } from './useTextfieldItemAs';

type StorageHandlers<T extends IListItem> = {
    updateItem: (item: T) => Promise<any> | void;
    createItem: (item: T) => Promise<any> | void;
    deleteItems: (items: T[]) => Promise<any> | void;
};

interface SortedListConfig<T extends IListItem, S> {
    storageId: string;
    storageKey: string;
    handleListChange?: () => Promise<void>;
    getItemsFromStorageObject?: (storageObject: S) => Promise<T[]> | T[];
    setItemsInStorageObject?: (items: T[], currentObject: S) => S;
    initializeListItem?: (item: IListItem) => T;
    storageConfig?: StorageHandlers<T>;
    initializedStorageObject?: S;
    reloadOnOverscroll?: boolean;
    reloadTriggers?: any[];
}

const useSortedList = <T extends IListItem, S>({
    storageKey,
    storageId,
    getItemsFromStorageObject,
    setItemsInStorageObject,
    initializeListItem,
    storageConfig,
    initializedStorageObject,
    reloadOnOverscroll = false,
    reloadTriggers,
    handleListChange
}: SortedListConfig<T, S>) => {
    const pathname = usePathname();
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<T>();
    const { registerReloadFunction } = useReloadScheduler();
    const {
        isItemDeleting,
        cancelItemDeletion,
        scheduleItemDeletion,
        registerDeleteFunction
    } = useDeleteScheduler<T>();
    const { focusPlaceholder } = useScrollContainer();

    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ------------- BUILD Logic -------------

    async function buildList() {
        try {
            const fetchedItems = await getItemsFromStorageObject?.(storageObject ?? initializedStorageObject ?? [] as S);
            setItems(fetchedItems ?? storageObject as T[] ?? []);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        buildList();
    }, [storageObject]);

    // ------------- RELOAD Logic -------------

    // Custom Reload Triggering
    useEffect(() => {
        if (reloadTriggers) buildList();
    }, reloadTriggers);

    // Overscroll Reload Registering
    useEffect(() => {
        if (reloadOnOverscroll) registerReloadFunction(`${storageKey}-${storageId}`, buildList, pathname);
    }, []);

    /**
     * ✅ Saves an item to the current list and creates a new textfield item.
     * 
     * @param referenceSortId - The sort ID of an item to place the new textfield near
     * @param isChildId - Signifies if the reference ID should be below the new textfield, else above.
     */
    async function saveTextfieldAndCreateNew(referenceSortId?: number, isChildId: boolean = false) {
        const item = textfieldItem ? { ...textfieldItem } : null;

        // Phase 1: Save the item
        if (item) await persistItemToStorage(item);


        // Phase 2: Clear the textfield and exit if no reference ID was given
        if (!referenceSortId) {
            setTextfieldItem(undefined);
            return;
        }

        // Phase 3: Focus the hidden placeholder field.
        // Needed to ensure the keyboard doesn't flicker shut during transition to new textfield item.
        focusPlaceholder();

        // Phase 4: Create a new list item
        const updatedList = sanitizeList(items, item);
        const genericListItem: IListItem = {
            id: uuid.v4(),
            sortId: generateSortId(referenceSortId!, updatedList, isChildId),
            status: EItemStatus.NEW,
            listId: storageKey,
            value: ''
        };
        const newItem: T = initializeListItem?.(genericListItem) ?? genericListItem as T;

        setTextfieldItem(newItem);
    }

    // ------------- EDIT Logic -------------

    /**
     * Updates or creates an item in storage.
     * @returns - true if the item still exists in the list, else false
     */
    async function persistItemToStorage(item: T) {
        if (storageConfig) {

            // Handle the storage update directly
            if (item.status === EItemStatus.NEW) {
                return await storageConfig.createItem({ ...item, status: EItemStatus.STATIC });
            } else {
                await storageConfig.updateItem({ ...item, status: EItemStatus.STATIC });
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
        
        await handleListChange?.();
    };


    /**
     * Toggles an item between a textfield and static.
     * If another textfield exists, it will be saved first.
     */
    async function toggleItemEdit(item: T) {
        if (isItemDeleting(item)) return;

        if (textfieldItem && textfieldItem.value.trim() !== '') {
            await persistItemToStorage({ ...textfieldItem, status: EItemStatus.STATIC });
        }

        const togglingItem = textfieldItem?.id === item.id;
        if (!togglingItem) {
            setTextfieldItem({ ...item, status: EItemStatus.EDIT });
        } else {
            setTextfieldItem(null);
        }

    };

    // ------------- DELETE Logic -------------

    useEffect(() => {
        registerDeleteFunction(storageKey, deleteItemsFromStorage);
    }, [items]);

    /**
     * Deletes a batch of items from storage.
     * For custom storage config, it calls delete on each item individually.
     * For standard storage, it filters out all items in a single operation.
     */
    async function deleteItemsFromStorage(itemsToDelete: T[]) {
        if (storageConfig) {
            await storageConfig.deleteItems(itemsToDelete);
            await handleListChange?.();
        } else {
            const updatedList = items.filter(({ id }) =>
                !itemsToDelete.some(item => item.id === id)
            );

            setStorageObject(
                setItemsInStorageObject && storageObject
                    ? setItemsInStorageObject(updatedList, storageObject)
                    : (updatedList as S)
            );
        }
    }

    /**
     * Toggles an item in and out of deleting state.
     * Adds or removes the item from the pendingDeleteItems array.
     */
    async function toggleItemDelete(item: T) {
        console.log('toggling')
        // Handle textfield delete
        if (item.id === textfieldItem?.id) {
            setTextfieldItem(null);
            if (item.value.trim() === '') {
                deleteSingleItemFromStorage(item);
                return;
            }
        }

        if (isItemDeleting(item)) {
            cancelItemDeletion(item);
        } else {
            scheduleItemDeletion(item);
        }
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
        saveTextfieldAndCreateNew,
        storageObject: storageObject ?? initializedStorageObject,
        isLoading: isLoading === true
    };
};

export default useSortedList;
