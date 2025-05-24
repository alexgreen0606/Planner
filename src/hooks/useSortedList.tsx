import { EItemStatus } from '@/enums/EItemStatus';
import { IListItem } from '@/types/listItems/core/TListItem';
import { uuid } from 'expo-modules-core';
import { useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { useDeleteScheduler } from '../services/DeleteScheduler';
import { useReloadScheduler } from '../services/ReloadScheduler';
import { useScrollContainer } from '../services/ScrollContainer';
import { generateSortId, sanitizeList } from '../utils/listUtils';
import { useTextFieldState } from '@/atoms/textfieldAtoms';

type StorageHandlers<T extends IListItem> = {
    update: (item: T) => Promise<void> | void;
    create: (item: T) => Promise<void> | void | Promise<string | undefined>;
    delete: (items: T[]) => Promise<void> | void;
};

interface SortedListConfig<T extends IListItem, S> {
    storageId: string;
    storageKey: string;
    getItemsFromStorageObject?: (storageObject: S) => Promise<T[]> | T[];
    setItemsInStorageObject?: (items: T[], currentObject: S) => S;
    initializeListItem?: (item: IListItem) => T;
    storageConfig?: StorageHandlers<T>;
    initializedStorageObject?: S;
    reloadOnNavigate?: boolean;
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
    reloadOnNavigate = false,
    reloadOnOverscroll = false,
    reloadTriggers
}: SortedListConfig<T, S>) => {

    const pathname = usePathname();

    const { currentTextfield, setCurrentTextfield } = useTextFieldState<T>();

    const {
        isItemDeleting,
        cancelItemDeletion,
        scheduleItemDeletion,
        registerDeleteFunction
    } = useDeleteScheduler();

    const { registerReloadFunction } = useReloadScheduler();

    const [isLoading, setIsLoading] = useState(true);
    const storage = useMMKV({ id: storageId });
    const [storageObject, setStorageObject] = useMMKVObject<S>(storageKey, storage);
    const [items, setItems] = useState<T[]>([]);

    // ------------- GENERATION Logic -------------

    async function buildList() {
        try {
            const fetchedItems = await getItemsFromStorageObject?.(storageObject ?? initializedStorageObject ?? [] as S);
            setItems(fetchedItems ?? storageObject as T[] ?? []);
            setIsLoading(false);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        buildList();
    }, [storageObject]);

    // ------------- RELOAD Logic -------------

    // Custom Reload Triggering
    useEffect(() => {
        if (reloadTriggers) {
            buildList();
        }
    }, reloadTriggers);

    // Navigation Focus Reload Triggering
    useFocusEffect(useCallback(() => {
        if (reloadOnNavigate) {
            buildList();
        }
    }, [storageObject]));

    // Overscroll Reload Registering
    useEffect(() => {
        if (reloadOnOverscroll) {
            registerReloadFunction(`${storageKey}-${storageId}`, buildList, pathname);
        }
    }, []);

    /**
     * Saves the existing textfield to storage and generates a new one at the requested position.
     * @param referenceSortId The sort ID of an item to place the new textfield near
     * @param isChildId Signifies if the reference ID should be below the new textfield, else above.
     */
    async function saveTextfieldAndCreateNew(item?: T, referenceSortId?: number, isChildId: boolean = false) {

        const updatedList = sanitizeList(items, item);

        if (item) {
            // Save the current textfield before creating a new one
            await persistItemToStorage(item);

            if (!referenceSortId) {
                setCurrentTextfield(undefined);
                return;
            }
        }

        const genericListItem: IListItem = {
            id: uuid.v4(),
            sortId: generateSortId(referenceSortId!, updatedList, isChildId),
            status: EItemStatus.NEW,
            listId: storageKey,
            value: '',
        };

        const newItem: T = initializeListItem?.(genericListItem) ?? genericListItem as T;
        setCurrentTextfield(newItem, item);
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
     * Toggles an item between a textfield and static.
     * If another textfield exists, it will be saved first.
     */
    async function toggleItemEdit(item: T) {
        if (isItemDeleting(item)) return;
        const togglingItem = currentTextfield?.id === item.id;
        if (currentTextfield && currentTextfield.value.trim() !== '') {
            await persistItemToStorage({ ...currentTextfield, status: EItemStatus.STATIC });
        }
        if (!togglingItem) {
            setCurrentTextfield({ ...item, status: EItemStatus.EDIT });
        } else {
            setCurrentTextfield(undefined);
        }

    };

    // ------------- DELETION Logic -------------

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
            await storageConfig.delete(itemsToDelete);
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
        // Handle textfield delete
        if (item.id === currentTextfield?.id) {
            setCurrentTextfield(undefined);
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
